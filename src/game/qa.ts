import { createInitialState } from './engine';
import { corpPlayTurnStep, runnerPlayTurnStep } from './ai';
import type { GameState } from './types';

export interface RuleViolation {
  turn: number;
  phase: string;
  activePlayer: 'Corp' | 'Runner';
  message: string;
}

export interface QAGameResult {
  gameIndex: number;
  winner: 'Corp' | 'Runner' | null;
  winMethod: 'agenda' | 'flatline' | 'deckout' | 'deadlock' | null;
  turns: number;
  steps: number;
  corpFinalCredits: number;
  runnerFinalCredits: number;
  corpFinalScore: number;
  runnerFinalScore: number;
  violations: RuleViolation[];
}

export interface QAReport {
  totalGames: number;
  corpWins: number;
  runnerWins: number;
  flatlineWins: number;
  agendaWins: number;
  deckoutWins: number;
  deadlocks: number;
  averageTurns: number;
  averageSteps: number;
  averageCorpCredits: number;
  averageRunnerCredits: number;
  totalViolations: number;
  violationsSummary: string[];
  results: QAGameResult[];
}

// 매 게임 상태마다 규칙 준수 여부(Assertion) 검증
export function checkRulesCompliance(state: GameState): string[] {
  const violations: string[] = [];

  // 1. 자금 무결성
  if (state.corp.credits < 0) {
    violations.push(`Corp credits is negative: ${state.corp.credits}`);
  }
  if (state.runner.credits < 0) {
    violations.push(`Runner credits is negative: ${state.runner.credits}`);
  }

  // 2. 클릭 무결성
  if (state.corp.clicks < 0) {
    violations.push(`Corp clicks is negative: ${state.corp.clicks}`);
  }
  if (state.runner.clicks < 0) {
    violations.push(`Runner clicks is negative: ${state.runner.clicks}`);
  }

  // 3. 원격 서버 루트(Root) 설치 제약 조건
  Object.keys(state.servers).forEach(serverKey => {
    if (serverKey.startsWith('Remote') || serverKey.toLowerCase().includes('remote')) {
      const server = state.servers[serverKey];
      // Agenda 또는 Asset인 카드가 root에 몇 개 있는지 센다.
      const agendaOrAssetCards = server.root.filter(card => card.type === 'Agenda' || card.type === 'Asset');
      if (agendaOrAssetCards.length > 1) {
        violations.push(`Server ${serverKey} root has multiple agendas/assets: ${agendaOrAssetCards.map(c => c.title).join(', ')}`);
      }
    }
  });

  // 4. 러너 프로그램 메모리 사용량 (기본 4 MU)
  let calculatedMemoryUsed = 0;
  state.runner.rig.forEach(card => {
    if (card.type === 'Program') {
      calculatedMemoryUsed += card.memoryCost || 0;
    }
  });
  if (calculatedMemoryUsed > state.runner.memoryLimit) {
    violations.push(`Runner memory used (${calculatedMemoryUsed} MU) exceeds limit (${state.runner.memoryLimit} MU)`);
  }

  // 5. 승리 조건 및 점수 무결성
  if (state.winner === null && state.phase !== 'game-over') {
    if (state.corp.score >= 7) {
      violations.push(`Corp scored ${state.corp.score} points (>= 7) but game winner is not set`);
    }
    if (state.runner.score >= 7) {
      violations.push(`Runner scored ${state.runner.score} points (>= 7) but game winner is not set`);
    }
    if (state.runner.flatlined) {
      violations.push(`Runner flatlined but game winner is not set`);
    }
  }

  return violations;
}

// 1회의 단일 게임 시뮬레이션 실행 함수
export function simulateSingleGame(gameIndex: number): QAGameResult {
  // AI vs AI 모드로 게임 상태 초기화
  let state = createInitialState('ai-vs-ai', 'medium');
  let steps = 0;
  const maxSteps = 1500; // 교착 상태 차단을 위한 최대 스텝 락
  const violations: RuleViolation[] = [];

  while (state.phase !== 'game-over' && steps < maxSteps) {
    const prevClicks = state.activePlayer === 'Corp' ? state.corp.clicks : state.runner.clicks;
    const prevTurn = state.turn;
    const prevPhase = state.phase;

    // 규칙 검증 (행동 수행 전 상태 체크)
    const stepViolations = checkRulesCompliance(state);
    if (stepViolations.length > 0) {
      stepViolations.forEach(msg => {
        // 동일한 턴/페이즈의 동일한 룰 위반은 중복해서 넣지 않도록 필터링
        if (!violations.some(v => v.turn === state.turn && v.phase === state.phase && v.message === msg)) {
          violations.push({
            turn: state.turn,
            phase: state.phase,
            activePlayer: state.activePlayer,
            message: msg
          });
        }
      });
    }

    try {
      // 런 상태이거나 러너의 차례인 경우 러너 AI 구동
      if (state.run || state.activePlayer === 'Runner') {
        state = runnerPlayTurnStep(state);
      } else {
        state = corpPlayTurnStep(state);
      }
    } catch (err) {
      console.error(`QA 시뮬레이션 중 오류 발생 (게임 ${gameIndex}, 스텝 ${steps}):`, err);
      break;
    }

    steps++;

    // 만약 행동 이후에도 클릭 수, 페이즈, 턴 중 아무것도 변하지 않았다면 교착 상태로 간주
    const currentClicks = state.activePlayer === 'Corp' ? state.corp.clicks : state.runner.clicks;
    if (currentClicks === prevClicks && state.turn === prevTurn && state.phase === prevPhase && !state.run) {
      // 교착 무한루프 방지를 위해 의무 강제 기본 드로우 적용
      if (state.activePlayer === 'Corp') {
        state.corp.clicks = Math.max(0, state.corp.clicks - 1);
      } else {
        state.runner.clicks = Math.max(0, state.runner.clicks - 1);
      }
    }
  }

  // 승리 방식 판정
  let winMethod: QAGameResult['winMethod'] = null;
  if (state.winner) {
    if (state.runner.flatlined) {
      winMethod = 'flatline';
    } else if (state.corp.deck.length === 0 && state.winner === 'Runner') {
      winMethod = 'deckout';
    } else {
      winMethod = 'agenda';
    }
  } else if (steps >= maxSteps) {
    winMethod = 'deadlock';
  }

  return {
    gameIndex,
    winner: state.winner,
    winMethod,
    turns: state.turn,
    steps,
    corpFinalCredits: state.corp.credits,
    runnerFinalCredits: state.runner.credits,
    corpFinalScore: state.corp.score,
    runnerFinalScore: state.runner.score,
    violations
  };
}

// 다중 시뮬레이션 가동 및 종합 리포트 생성
export function runQASimulations(gameCount: number): QAReport {
  const results: QAGameResult[] = [];
  let corpWins = 0;
  let runnerWins = 0;
  let flatlineWins = 0;
  let agendaWins = 0;
  let deckoutWins = 0;
  let deadlocks = 0;
  
  let totalTurns = 0;
  let totalSteps = 0;
  let totalCorpCredits = 0;
  let totalRunnerCredits = 0;

  const allViolationsMessages = new Set<string>();
  let totalViolationsCount = 0;

  for (let i = 1; i <= gameCount; i++) {
    const res = simulateSingleGame(i);
    results.push(res);

    if (res.winner === 'Corp') corpWins++;
    if (res.winner === 'Runner') runnerWins++;
    
    if (res.winMethod === 'flatline') flatlineWins++;
    if (res.winMethod === 'agenda') agendaWins++;
    if (res.winMethod === 'deckout') deckoutWins++;
    if (res.winMethod === 'deadlock') deadlocks++;

    totalTurns += res.turns;
    totalSteps += res.steps;
    totalCorpCredits += res.corpFinalCredits;
    totalRunnerCredits += res.runnerFinalCredits;

    if (res.violations.length > 0) {
      totalViolationsCount += res.violations.length;
      res.violations.forEach(v => {
        allViolationsMessages.add(`[Turn ${v.turn} | ${v.activePlayer}] ${v.message}`);
      });
    }
  }

  return {
    totalGames: gameCount,
    corpWins,
    runnerWins,
    flatlineWins,
    agendaWins,
    deckoutWins,
    deadlocks,
    averageTurns: Number((totalTurns / gameCount).toFixed(1)),
    averageSteps: Number((totalSteps / gameCount).toFixed(1)),
    averageCorpCredits: Number((totalCorpCredits / gameCount).toFixed(1)),
    averageRunnerCredits: Number((totalRunnerCredits / gameCount).toFixed(1)),
    totalViolations: totalViolationsCount,
    violationsSummary: Array.from(allViolationsMessages).slice(0, 15), // 최대 15개 요약 노출
    results
  };
}
