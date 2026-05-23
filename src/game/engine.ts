import type { GameState, Card, ServerName, LogEntry, GameMode, Difficulty } from './types';
import { buildCorpStarterDeck, buildRunnerStarterDeck } from './cards';

// 딥 카피 헬퍼
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

// 로그 생성 도우미
function addLog(logs: LogEntry[], message: string, sender: 'Corp' | 'Runner' | 'System'): LogEntry[] {
  const newLog: LogEntry = {
    id: `log_${Date.now()}_${Math.random()}`,
    message,
    timestamp: new Date().toLocaleTimeString(),
    sender,
  };
  return [...logs, newLog];
}

// 넷 데미지 처리 함수
export function applyNetDamage(state: GameState, amount: number, sourceName: string): GameState {
  let tempState = cloneState(state);
  let hand = [...tempState.runner.hand];
  let discard = [...tempState.runner.discard];
  let logs = [...tempState.logs];

  logs = addLog(logs, `Runner가 ${sourceName}(으)로부터 ${amount}점의 Net Damage를 입습니다.`, 'System');

  for (let i = 0; i < amount; i++) {
    if (hand.length === 0) {
      tempState.runner.flatlined = true;
      tempState.winner = 'Corp';
      tempState.phase = 'game-over';
      logs = addLog(logs, `Runner의 손패가 부족하여 플랫라인(Flatline) 상태가 되었습니다. Corp가 승리합니다!`, 'System');
      break;
    }
    const randomIndex = Math.floor(Math.random() * hand.length);
    const trashedCard = hand.splice(randomIndex, 1)[0];
    discard.push(trashedCard);
    logs = addLog(logs, `Runner가 카드(${trashedCard.title})를 손패에서 버렸습니다.`, 'Runner');

    // Diviner 특수 능력: 카드가 데미지로 버려지면 런 종료
    if (tempState.run && sourceName === 'Diviner') {
      tempState.run = {
        ...tempState.run,
        phase: 'end',
        success: false,
      };
      logs = addLog(logs, `Diviner의 효과로 인해 런이 종료되었습니다.`, 'Corp');
    }
  }

  tempState.runner.hand = hand;
  tempState.runner.discard = discard;
  tempState.logs = logs;
  return tempState;
}

// 게임 초기화 상태 생성
export function createInitialState(gameMode: GameMode, difficulty: Difficulty): GameState {
  const corpDeck = buildCorpStarterDeck();
  const runnerDeck = buildRunnerStarterDeck();
  
  // 덱 셔플
  const shuffle = (array: Card[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
  
  shuffle(corpDeck);
  shuffle(runnerDeck);

  const state: GameState = {
    activePlayer: 'Corp',
    turn: 1,
    winner: null,
    phase: 'setup',
    gameMode,
    difficulty,
    logs: [],
    corp: {
      credits: 5,
      clicks: 0,
      deck: corpDeck,
      hand: [],
      discard: [],
      scoreArea: [],
      score: 0,
      maximumHandSize: 5,
    },
    runner: {
      credits: 5,
      clicks: 0,
      deck: runnerDeck,
      hand: [],
      discard: [],
      scoreArea: [],
      score: 0,
      rig: [],
      maximumHandSize: 5,
      memoryLimit: 4,
      memoryUsed: 0,
      tags: 0,
      brainDamage: 0,
      flatlined: false,
      successfulRunThisTurn: false,
    },
    servers: {
      HQ: { id: 'HQ', name: 'HQ', ice: [], root: [] },
      RD: { id: 'RD', name: 'R&D', ice: [], root: [] },
      Archives: { id: 'Archives', name: 'Archives', ice: [], root: [] },
    },
    run: null,
  };

  // 초기 손패 드로우 (Corp 5장, Runner 5장)
  state.logs = addLog(state.logs, '게임을 시작합니다. 양 플레이어가 카드 5장을 드로우합니다.', 'System');
  for (let i = 0; i < 5; i++) {
    const cCard = state.corp.deck.pop();
    if (cCard) state.corp.hand.push(cCard);
    
    const rCard = state.runner.deck.pop();
    if (rCard) state.runner.hand.push(rCard);
  }

  // 멀리건 단계로 게임 시작
  state.phase = 'corp-mulligan';
  state.logs = addLog(state.logs, '멀리건 단계: 각 플레이어가 시작 손패 5장 중 교체할 카드를 선택합니다. (양쪽 다 1회 가능)', 'System');
  
  return state;
}

// 턴 및 페이즈 체크 도우미
export function checkTurnEnd(state: GameState): GameState {
  let tempState = cloneState(state);
  if (tempState.activePlayer === 'Corp' && tempState.corp.clicks === 0) {
    if (tempState.corp.hand.length > tempState.corp.maximumHandSize) {
      tempState.phase = 'corp-discard';
      tempState.logs = addLog(tempState.logs, `Corp의 손패가 제한(${tempState.corp.maximumHandSize}장)을 초과했습니다. 버릴 카드를 선택하십시오.`, 'System');
    } else {
      // Runner 턴 시작
      tempState.activePlayer = 'Runner';
      tempState.runner.clicks = 4;
      tempState.runner.successfulRunThisTurn = false;
      tempState.phase = 'runner-action';
      tempState.logs = addLog(tempState.logs, `Turn ${tempState.turn}: Runner의 차례입니다.`, 'System');

      // Smartware Distributor 시작 시 작동
      tempState.runner.rig = tempState.runner.rig.map(c => {
        if (c.codeName === 'smartware_distributor' && c.hostedCounters > 0) {
          tempState.runner.credits += 1;
          tempState.logs = addLog(tempState.logs, `Smartware Distributor의 효과로 1 [Credit]을 획득합니다.`, 'Runner');
          return { ...c, hostedCounters: c.hostedCounters - 1 };
        }
        return c;
      });
    }
  } else if (tempState.activePlayer === 'Runner' && tempState.runner.clicks === 0) {
    // 러너 클릭이 0일 때 자동으로 기업 턴으로 넘어가던 기존 로직 제거
    // 플레이어가 수동으로 [차례 종료] 버튼을 클릭할 때까지 대기
  }
  return tempState;
}

// Runner 차례 수동 종료
export function endRunnerTurn(state: GameState): GameState {
  let tempState = cloneState(state);
  if (tempState.activePlayer !== 'Runner') return state;

  // 클릭 강제 소모 (남은 상태에서 눌렀을 수도 있으므로)
  tempState.runner.clicks = 0;

  // 러너 손패 초과 검사
  if (tempState.runner.hand.length > tempState.runner.maximumHandSize) {
    tempState.phase = 'runner-discard';
    tempState.logs = addLog(tempState.logs, `Runner의 손패가 제한(${tempState.runner.maximumHandSize}장)을 초과했습니다. 버릴 카드를 선택하십시오.`, 'System');
  } else {
    // Corporation 턴 시작 처리
    tempState.runner.successfulRunThisTurn = false;
    tempState.activePlayer = 'Corp';
    tempState.corp.clicks = 3;
    tempState.turn += 1;
    tempState.phase = 'corp-draw';
    tempState.logs = addLog(tempState.logs, `Turn ${tempState.turn}: Corporation의 차례입니다.`, 'System');

    // Nico Campaign 시작 시 작동
    tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
      const server = tempState.servers[serverKey];
      const newRoot = server.root.map(c => {
        if (c.codeName === 'nico_campaign' && c.rezzed) {
          const gain = Math.min(3, c.hostedCredits);
          tempState.corp.credits += gain;
          c.hostedCredits -= gain;
          tempState.logs = addLog(tempState.logs, `Nico Campaign에서 ${gain} [Credits]를 수령했습니다. (남은 크레딧: ${c.hostedCredits})`, 'Corp');
          
          if (c.hostedCredits === 0) {
            tempState.corp.discard.push(c);
            return null; // 아카이브로 버림
          }
        }
        return c;
      }).filter(c => c !== null) as Card[];
      
      acc[serverKey] = { ...server, root: newRoot };
      return acc;
    }, {} as { [key: string]: typeof tempState.servers[string] });

    // Corp 의무 드로우
    const mandatoryDrawCard = tempState.corp.deck.pop();
    if (mandatoryDrawCard) {
      tempState.corp.hand.push(mandatoryDrawCard);
      tempState.logs = addLog(tempState.logs, 'Corp가 의무 드로우로 카드 1장을 뽑았습니다.', 'Corp');
      tempState.phase = 'corp-action';
    } else {
      tempState.winner = 'Runner';
      tempState.phase = 'game-over';
      tempState.logs = addLog(tempState.logs, 'Corp의 R&D에 카드가 없습니다. Runner가 승리합니다!', 'System');
    }
  }

  return tempState;
}

// 득점 계산 및 게임 오버 판정
export function checkVictory(state: GameState): GameState {
  let tempState = cloneState(state);
  if (tempState.corp.score >= 6) {
    tempState.winner = 'Corp';
    tempState.phase = 'game-over';
    tempState.logs = addLog(tempState.logs, `Corp가 의제 점수 ${tempState.corp.score}점을 획득하여 승리했습니다!`, 'System');
  } else if (tempState.runner.score >= 6) {
    tempState.winner = 'Runner';
    tempState.phase = 'game-over';
    tempState.logs = addLog(tempState.logs, `Runner가 의제 점수 ${tempState.runner.score}점을 획득하여 승리했습니다!`, 'System');
  }
  return tempState;
}

// 원격 서버 자동 생성 도우미
function getNextRemoteName(servers: { [key: string]: any }): string {
  let idx = 1;
  while (servers[`Remote ${idx}`]) {
    idx++;
  }
  return `Remote ${idx}`;
}

// 플레이어 공통 기본 액션
export function executeBasicAction(state: GameState, actionType: 'gain-credit' | 'draw-card'): GameState {
  let tempState = cloneState(state);
  const player = tempState.activePlayer;

  if (player === 'Corp') {
    if (tempState.corp.clicks <= 0 || tempState.phase !== 'corp-action') return state;
    tempState.corp.clicks -= 1;

    if (actionType === 'gain-credit') {
      tempState.corp.credits += 1;
      tempState.logs = addLog(tempState.logs, 'Corp가 [Click]을 소모하여 1 [Credit]을 획득했습니다.', 'Corp');
    } else {
      const card = tempState.corp.deck.pop();
      if (card) {
        tempState.corp.hand.push(card);
        tempState.logs = addLog(tempState.logs, 'Corp가 [Click]을 소모하여 카드 1장을 드로우했습니다.', 'Corp');
      } else {
        tempState.winner = 'Runner';
        tempState.phase = 'game-over';
        tempState.logs = addLog(tempState.logs, 'Corp의 R&D에 카드가 없습니다. Runner가 승리합니다!', 'System');
      }
    }
  } else {
    if (tempState.runner.clicks <= 0 || tempState.phase !== 'runner-action') return state;
    tempState.runner.clicks -= 1;

    if (actionType === 'gain-credit') {
      tempState.runner.credits += 1;
      tempState.logs = addLog(tempState.logs, 'Runner가 [Click]을 소모하여 1 [Credit]을 획득했습니다.', 'Runner');
    } else {
      const extraDraw = tempState.runner.rig.some(c => c.codeName === 'verbal_plasticity') && 
        !tempState.logs.some(l => l.sender === 'Runner' && l.message.includes('드로우') && !l.message.includes('시작 시'));

      const card = tempState.runner.deck.pop();
      if (card) {
        tempState.runner.hand.push(card);
        tempState.logs = addLog(tempState.logs, 'Runner가 [Click]을 소모하여 카드 1장을 드로우했습니다.', 'Runner');
        
        if (extraDraw) {
          const secondCard = tempState.runner.deck.pop();
          if (secondCard) {
            tempState.runner.hand.push(secondCard);
            tempState.logs = addLog(tempState.logs, 'Verbal Plasticity 효과로 추가 카드 1장을 드로우했습니다.', 'Runner');
          }
        }
      }
    }
  }

  return checkTurnEnd(tempState);
}

// 카드 설치 액션 (Corp / Runner 공통)
export function installCard(state: GameState, cardId: string, serverName: ServerName): GameState {
  let tempState = cloneState(state);
  
  if (tempState.activePlayer === 'Corp') {
    if (tempState.corp.clicks <= 0 || tempState.phase !== 'corp-action') return state;
    const cardIndex = tempState.corp.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return state;
    const card = tempState.corp.hand[cardIndex];

    let targetServerName = serverName;
    if (serverName === 'New Remote') {
      targetServerName = getNextRemoteName(tempState.servers);
      tempState.servers[targetServerName] = { id: targetServerName, name: targetServerName, ice: [], root: [] };
    }

    const server = tempState.servers[targetServerName];
    if (!server) return state;

    if (card.type === 'ICE') {
      // ICE 설치 비용 계산 (기존 설치된 ICE의 수만큼 추가 크레딧 필요)
      const cost = server.ice.length;
      if (tempState.corp.credits < cost) {
        tempState.logs = addLog(tempState.logs, `크레딧이 부족하여 ICE를 설치할 수 없습니다. (필요: ${cost} [Credits])`, 'System');
        return state;
      }
      tempState.corp.credits -= cost;
      tempState.corp.clicks -= 1;
      
      // 손패에서 제거 및 ICE 목록 맨 바깥쪽(배열 끝)에 추가
      tempState.corp.hand.splice(cardIndex, 1);
      server.ice.push(card);
      tempState.logs = addLog(tempState.logs, `Corp가 ${targetServerName} 서버 외곽에 ICE를 설치했습니다. (설치비용: ${cost} [Credits])`, 'Corp');

    } else if (card.type === 'Asset' || card.type === 'Agenda' || card.type === 'Upgrade') {
      // Remote 서버에는 하나의 Asset 또는 Agenda만 설치 가능 (Upgrade는 무제한 설치 가능)
      if (card.type !== 'Upgrade') {
        const hasAssetOrAgenda = server.root.some(c => c.type === 'Asset' || c.type === 'Agenda');
        if (hasAssetOrAgenda) {
          tempState.logs = addLog(tempState.logs, `원격 서버 루트에는 하나의 자산 또는 의제만 올릴 수 있습니다.`, 'System');
          return state;
        }
      }
      // 중앙 서버(HQ/RD/Archives)에는 Upgrade만 설치 가능
      if (['HQ', 'RD', 'Archives'].includes(targetServerName) && card.type !== 'Upgrade') {
        tempState.logs = addLog(tempState.logs, `중앙 서버 루트에는 업그레이드만 설치 가능합니다.`, 'System');
        return state;
      }

      tempState.corp.clicks -= 1;
      tempState.corp.hand.splice(cardIndex, 1);
      server.root.push(card);
      tempState.logs = addLog(tempState.logs, `Corp가 ${targetServerName} 서버 루트에 카드를 미공개 설치했습니다.`, 'Corp');
    }

  } else {
    // Runner 카드 설치
    if (tempState.runner.clicks <= 0 || tempState.phase !== 'runner-action') return state;
    const cardIndex = tempState.runner.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return state;
    const card = tempState.runner.hand[cardIndex];

    let finalCost = card.cost;
    
    // Carmen 특수 능력 할인 계산
    if (card.codeName === 'carmen') {
       if (tempState.runner.successfulRunThisTurn) {
        finalCost = 3;
      }
    }

    if (tempState.runner.credits < finalCost) {
      tempState.logs = addLog(tempState.logs, `크레딧이 부족하여 카드를 설치할 수 없습니다. (필요: ${finalCost} [Credits])`, 'System');
      return state;
    }

    // 프로그램 메모리 체크
    if (card.type === 'Program') {
      const requiredMU = card.memoryCost || 0;
      // 메모리 제한 계산
      const limit = tempState.runner.memoryLimit;
      const currentMU = tempState.runner.rig.reduce((sum, c) => sum + (c.memoryCost || 0), 0);
      
      if (currentMU + requiredMU > limit) {
        tempState.logs = addLog(tempState.logs, `메모리 유닛(MU)이 부족합니다. (한도: ${limit} MU, 현재: ${currentMU} MU)`, 'System');
        return state;
      }
    }

    tempState.runner.credits -= finalCost;
    tempState.runner.clicks -= 1;
    tempState.runner.hand.splice(cardIndex, 1);

    // 특수 장착 처리 (Telework, Red Team 등 충전 리소스 및 콘솔)
    let installedCard = { ...card };
    if (card.codeName === 'telework_contract') {
      installedCard.hostedCredits = 9;
    } else if (card.codeName === 'red_team') {
      installedCard.hostedCredits = 12;
    } else if (card.codeName === 'pennyshaver') {
      tempState.runner.memoryLimit = 5;
    }

    tempState.runner.rig.push(installedCard);
    tempState.logs = addLog(tempState.logs, `Runner가 ${installedCard.title} 카드를 설치했습니다. (비용: ${finalCost} [Credits])`, 'Runner');
  }

  return checkTurnEnd(tempState);
}

// 회사 카드 레즈(Rez) 처리
export function rezCard(state: GameState, cardId: string): GameState {
  let tempState = cloneState(state);
  
  // 서버에 있는 카드를 찾아 레즈 처리
  
  tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
    const server = tempState.servers[serverKey];
    
    // ICE 레즈 처리
    const newIce = server.ice.map(c => {
      if (c.id === cardId && !c.rezzed) {
        let cost = c.cost;
        // Tread Lightly 영향으로 비용 인상 여부 확인
        if (tempState.run && tempState.logs.some(l => l.sender === 'Runner' && l.message.includes('Tread Lightly'))) {
          cost += 3;
        }

        if (tempState.corp.credits >= cost) {
          tempState.corp.credits -= cost;
          c.rezzed = true;
          tempState.logs = addLog(tempState.logs, `Corp가 ${server.name} 보호선 상의 ${c.title} 카드를 Rez했습니다. (비용: ${cost} [Credits])`, 'Corp');
          
          if (tempState.run && tempState.run.currentIce && tempState.run.currentIce.id === cardId) {
            tempState.run = {
              ...tempState.run,
              currentIce: { ...c },
              subroutines: c.subroutines ? c.subroutines.map(s => ({ ...s })) : []
            };
          }
        } else {
          tempState.logs = addLog(tempState.logs, `크레딧이 부족하여 ICE를 Rez할 수 없습니다. (필요: ${cost} [Credits])`, 'System');
        }
      }
      return c;
    });

    // Root 카드 레즈 처리
    const newRoot = server.root.map(c => {
      if (c.id === cardId && !c.rezzed) {
        if (tempState.corp.credits >= c.cost) {
          tempState.corp.credits -= c.cost;
          c.rezzed = true;
          
          if (c.codeName === 'nico_campaign') {
            c.hostedCredits = 9;
          } else if (c.codeName === 'regolith_mining_license') {
            c.hostedCredits = 15;
          }
          
          tempState.logs = addLog(tempState.logs, `Corp가 ${server.name} 내부의 ${c.title} 카드를 Rez했습니다. (비용: ${c.cost} [Credits])`, 'Corp');
        } else {
          tempState.logs = addLog(tempState.logs, `크레딧이 부족하여 자산을 Rez할 수 없습니다.`, 'System');
        }
      }
      return c;
    });

    acc[serverKey] = { ...server, ice: newIce, root: newRoot };
    return acc;
  }, {} as typeof tempState.servers);

  return tempState;
}

// 회사 의제/아셋 발전(Advance) 행동
export function advanceCard(state: GameState, cardId: string): GameState {
  let tempState = cloneState(state);
  if (tempState.corp.clicks <= 0 || tempState.corp.credits <= 0 || tempState.phase !== 'corp-action') return state;

  let advanced = false;
  tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
    const server = tempState.servers[serverKey];
    const newRoot = server.root.map(c => {
      if (c.id === cardId) {
        if (c.type === 'Agenda' || c.codeName === 'urtica_cipher') {
          c.advancedCounters += 1;
          advanced = true;
          tempState.corp.credits -= 1;
          tempState.corp.clicks -= 1;
          tempState.logs = addLog(tempState.logs, `Corp가 ${serverKey} 서버의 카드를 발전시켰습니다.`, 'Corp');
        }
      }
      return c;
    });
    acc[serverKey] = { ...server, root: newRoot };
    return acc;
  }, {} as typeof tempState.servers);

  if (advanced) {
    return checkTurnEnd(tempState);
  }
  return state;
}

// 회사 의제 득점(Score) 행동
export function scoreAgenda(state: GameState, cardId: string): GameState {
  let tempState = cloneState(state);
  
  let targetCard: Card | null = null;
  let fromServer = '';

  tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
    const server = tempState.servers[serverKey];
    const newRoot = server.root.map(c => {
      if (c.id === cardId && c.type === 'Agenda') {
        const advCost = c.advancementCost || 3;
        if (c.advancedCounters >= advCost) {
          targetCard = c;
          fromServer = serverKey;
          return null; // 서버 루트에서 제거
        }
      }
      return c;
    }).filter(c => c !== null) as Card[];

    acc[serverKey] = { ...server, root: newRoot };
    return acc;
  }, {} as typeof tempState.servers);

  if (targetCard) {
    const card = targetCard as Card;
    tempState.corp.scoreArea.push(card);
    tempState.corp.score += card.agendaPoints || 0;
    tempState.logs = addLog(tempState.logs, `Corp가 의제 ${card.title}를 득점했습니다! (+${card.agendaPoints} 점)`, 'Corp');

    // 득점 카드별 특수 효과 처리
    if (card.codeName === 'offworld_office') {
      tempState.corp.credits += 7;
      tempState.logs = addLog(tempState.logs, `Offworld Office 효과로 7 [Credits]를 획득합니다.`, 'Corp');
    } else if (card.codeName === 'superconducting_hub') {
      tempState.corp.maximumHandSize += 2;
      tempState.logs = addLog(tempState.logs, `Superconducting Hub 효과로 최대 손패 크기가 +2가 되었습니다.`, 'Corp');
      // 카드 2장 바로 드로우
      for (let i = 0; i < 2; i++) {
        const c = tempState.corp.deck.pop();
        if (c) tempState.corp.hand.push(c);
      }
    } else if (card.codeName === 'send_a_message') {
      tempState.logs = addLog(tempState.logs, `Send a Message 효과로 임의의 ICE 하나를 공짜로 Rez할 수 있는 기회를 가집니다.`, 'System');
      // 임의의 첫 비레즈 ICE 자동 레즈
      let rezzed = false;
      tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
        const server = tempState.servers[serverKey];
        const newIce = server.ice.map(ice => {
          if (!ice.rezzed && !rezzed) {
            ice.rezzed = true;
            rezzed = true;
            tempState.logs = addLog(tempState.logs, `Send a Message 보상으로 ${ice.title} 카드를 무상 Rez했습니다.`, 'Corp');
          }
          return ice;
        });
        acc[serverKey] = { ...server, ice: newIce };
        return acc;
      }, {} as typeof tempState.servers);
    }

    // 원격 서버가 비게 되었다면 서버 삭제 정리 (기본서버 HQ/RD/Archives 제외)
    if (fromServer.startsWith('Remote')) {
      const server = tempState.servers[fromServer];
      if (server.ice.length === 0 && server.root.length === 0) {
        delete tempState.servers[fromServer];
      }
    }

    tempState = checkVictory(tempState);
  }

  return tempState;
}

// 이벤트 및 작전(Operation/Event) 플레이 행동
export function playCard(state: GameState, cardId: string): GameState {
  let tempState = cloneState(state);
  const player = tempState.activePlayer;

  if (player === 'Corp') {
    if (tempState.corp.clicks <= 0 || tempState.phase !== 'corp-action') return state;
    const cardIndex = tempState.corp.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return state;
    const card = tempState.corp.hand[cardIndex];

    if (tempState.corp.credits < card.cost) {
      tempState.logs = addLog(tempState.logs, `크레딧이 부족하여 작전 카드를 사용할 수 없습니다.`, 'System');
      return state;
    }

    tempState.corp.credits -= card.cost;
    tempState.corp.clicks -= 1;
    tempState.corp.hand.splice(cardIndex, 1);
    tempState.corp.discard.push(card);

    tempState.logs = addLog(tempState.logs, `Corp가 작전 카드 ${card.title}를 사용했습니다.`, 'Corp');

    // 카드별 효과
    if (card.codeName === 'hedge_fund') {
      tempState.corp.credits += 9;
      tempState.logs = addLog(tempState.logs, 'Hedge Fund 효과로 9 [Credits]를 획득했습니다.', 'Corp');
    } else if (card.codeName === 'government_subsidy') {
      tempState.corp.credits += 15;
      tempState.logs = addLog(tempState.logs, 'Government Subsidy 효과로 15 [Credits]를 획득했습니다.', 'Corp');
    } else if (card.codeName === 'seamless_launch') {
      tempState.logs = addLog(tempState.logs, 'Seamless Launch 사용: 발전할 카드를 고르십시오. (수동 UI 지연)', 'System');
      // 실제 발전 효과는 컴포넌트 레벨 혹은 AI 상에서 후속 연결 (간소화: 득점원격의 Agenda/Cipher 1개 탐지 후 발전 2개)
      let applied = false;
      tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
        const server = tempState.servers[serverKey];
        const newRoot = server.root.map(c => {
          if (!applied && (c.type === 'Agenda' || c.codeName === 'urtica_cipher')) {
            c.advancedCounters += 2;
            applied = true;
            tempState.logs = addLog(tempState.logs, `Seamless Launch의 효과로 ${serverKey} 서버의 카드를 발전시켰습니다.`, 'Corp');
          }
          return c;
        });
        acc[serverKey] = { ...server, root: newRoot };
        return acc;
      }, {} as typeof tempState.servers);
    }

  } else {
    // Runner Event 플레이
    if (tempState.runner.clicks <= 0 || tempState.phase !== 'runner-action') return state;
    const cardIndex = tempState.runner.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return state;
    const card = tempState.runner.hand[cardIndex];

    if (tempState.runner.credits < card.cost) {
      tempState.logs = addLog(tempState.logs, `크레딧이 부족하여 이벤트를 사용할 수 없습니다.`, 'System');
      return state;
    }

    // 기본 비용 처리
    tempState.runner.credits -= card.cost;
    tempState.runner.clicks -= 1;

    // Creative Commission / VRcation 특수 클릭 코스트
    if (card.codeName === 'creative_commission' || card.codeName === 'vrcation') {
      if (tempState.runner.clicks > 0) {
        tempState.runner.clicks -= 1;
        tempState.logs = addLog(tempState.logs, `${card.title} 플레이의 추가 비용으로 1 [Click]을 소모했습니다.`, 'Runner');
      }
    }

    tempState.runner.hand.splice(cardIndex, 1);
    tempState.runner.discard.push(card);
    tempState.logs = addLog(tempState.logs, `Runner가 이벤트 카드 ${card.title}를 사용했습니다.`, 'Runner');

    if (card.codeName === 'sure_gamble') {
      tempState.runner.credits += 9;
      tempState.logs = addLog(tempState.logs, 'Sure Gamble 효과로 9 [Credits]를 획득했습니다.', 'Runner');
    } else if (card.codeName === 'creative_commission') {
      tempState.runner.credits += 5;
      tempState.logs = addLog(tempState.logs, 'Creative Commission 효과로 5 [Credits]를 획득했습니다.', 'Runner');
    } else if (card.codeName === 'vrcation') {
      for (let i = 0; i < 4; i++) {
        const c = tempState.runner.deck.pop();
        if (c) tempState.runner.hand.push(c);
      }
      tempState.logs = addLog(tempState.logs, 'VRcation 효과로 카드 4장을 드로우했습니다.', 'Runner');
    } else if (card.codeName === 'overclock') {
      // Overclock 런 시작
      tempState.logs = addLog(tempState.logs, 'Overclock: 런을 시작합니다. 5 임시 크레딧이 런 도중 제공됩니다.', 'Runner');
      // 런은 이후 initiateRun에서 연동
    } else if (card.codeName === 'jailbreak') {
      // Jailbreak 런 시작
      tempState.logs = addLog(tempState.logs, 'Jailbreak: 중앙 서버 런을 시작합니다.', 'Runner');
    } else if (card.codeName === 'tread_lightly') {
      tempState.logs = addLog(tempState.logs, 'Tread Lightly 효과로 이번 런 동안 방어 ICE의 Rez 비용이 +3 됩니다.', 'Runner');
    }
  }

  return checkTurnEnd(tempState);
}

// 캠페인 / 자원 회수 액션
export function executeResourceClick(state: GameState, cardId: string): GameState {
  let tempState = cloneState(state);
  const player = tempState.activePlayer;

  if (player === 'Corp') {
    if (tempState.corp.clicks <= 0 || tempState.phase !== 'corp-action') return state;
    
    // Regolith Mining License의 자금 회수 처리
    let found = false;
    tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
      const server = tempState.servers[serverKey];
      const newRoot = server.root.map(c => {
        if (c.id === cardId && c.codeName === 'regolith_mining_license' && c.rezzed && c.hostedCredits > 0) {
          const gain = Math.min(3, c.hostedCredits);
          tempState.corp.credits += gain;
          c.hostedCredits -= gain;
          tempState.corp.clicks -= 1;
          found = true;
          tempState.logs = addLog(tempState.logs, `Regolith Mining License 채굴: ${gain} [Credits] 수령 (남은 수량: ${c.hostedCredits})`, 'Corp');
          if (c.hostedCredits === 0) {
            tempState.corp.discard.push(c);
            return null;
          }
        }
        return c;
      }).filter(c => c !== null) as Card[];
      
      acc[serverKey] = { ...server, root: newRoot };
      return acc;
    }, {} as typeof tempState.servers);

    if (found) return checkTurnEnd(tempState);

  } else {
    // Runner Resource
    if (tempState.runner.clicks <= 0 || tempState.phase !== 'runner-action') return state;
    
    let updated = false;
    tempState.runner.rig = tempState.runner.rig.map(c => {
      if (c.id === cardId) {
        if (c.codeName === 'telework_contract' && c.hostedCredits > 0) {
          // 턴당 1회 제약은 UI나 임시 로그로 우회 체크
          const gain = Math.min(3, c.hostedCredits);
          tempState.runner.credits += gain;
          c.hostedCredits -= gain;
          tempState.runner.clicks -= 1;
          updated = true;
          tempState.logs = addLog(tempState.logs, `Telework Contract 업무: ${gain} [Credits] 수령 (남은 수량: ${c.hostedCredits})`, 'Runner');
        } else if (c.codeName === 'smartware_distributor') {
          c.hostedCounters += 2;
          tempState.runner.clicks -= 1;
          updated = true;
          tempState.logs = addLog(tempState.logs, `Smartware Distributor에 파워 카운터 2개를 충전했습니다.`, 'Runner');
        }
      }
      return c;
    }).filter(c => {
      if (c.codeName === 'telework_contract' && c.hostedCredits === 0) {
        tempState.runner.discard.push(c);
        return false;
      }
      return true;
    });

    if (updated) return checkTurnEnd(tempState);
  }
  return state;
}

// 버리기 단계 액션
export function discardCard(state: GameState, cardId: string): GameState {
  let tempState = cloneState(state);
  if (tempState.phase === 'corp-discard') {
    const idx = tempState.corp.hand.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      const trashed = tempState.corp.hand.splice(idx, 1)[0];
      tempState.corp.discard.push(trashed);
      tempState.logs = addLog(tempState.logs, `Corp가 손패 초과로 카드(${trashed.title})를 Archives로 버렸습니다.`, 'Corp');
      
      // 손패가 제한 이하로 떨어지면 턴 종료 후 Runner 차례 개시
      if (tempState.corp.hand.length <= tempState.corp.maximumHandSize) {
        tempState.activePlayer = 'Runner';
        tempState.runner.clicks = 4;
        tempState.phase = 'runner-action';
        tempState.logs = addLog(tempState.logs, `Turn ${tempState.turn}: Runner의 차례입니다.`, 'System');
      }
    }
  } else if (tempState.phase === 'runner-discard') {
    const idx = tempState.runner.hand.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      const trashed = tempState.runner.hand.splice(idx, 1)[0];
      tempState.runner.discard.push(trashed);
      tempState.logs = addLog(tempState.logs, `Runner가 손패 초과로 카드(${trashed.title})를 Heap으로 버렸습니다.`, 'Runner');
      
      if (tempState.runner.hand.length <= tempState.runner.maximumHandSize) {
        tempState.activePlayer = 'Corp';
        tempState.corp.clicks = 3;
        tempState.turn += 1;
        tempState.phase = 'corp-draw';
        tempState.logs = addLog(tempState.logs, `Turn ${tempState.turn}: Corporation의 차례입니다.`, 'System');
        
        // 의무 드로우
        const card = tempState.corp.deck.pop();
        if (card) {
          tempState.corp.hand.push(card);
          tempState.logs = addLog(tempState.logs, 'Corp가 의무 드로우로 카드 1장을 뽑았습니다.', 'Corp');
          tempState.phase = 'corp-action';
        } else {
          tempState.winner = 'Runner';
          tempState.phase = 'game-over';
          tempState.logs = addLog(tempState.logs, 'Corp의 R&D에 카드가 없습니다. Runner가 승리합니다!', 'System');
        }
      }
    }
  }
  return tempState;
}

// ----------------------------------------------------
// 런 (Run) 시퀀스 제어 핵심 코드
// ----------------------------------------------------

export function initiateRun(state: GameState, serverName: ServerName, viaCardCode?: string): GameState {
  let tempState = cloneState(state);
  
  const needsClick = !viaCardCode || viaCardCode === 'red_team';
  if (needsClick && tempState.runner.clicks <= 0) return state;

  if (needsClick) {
    tempState.runner.clicks -= 1;
  }

  const server = tempState.servers[serverName];
  if (!server) return state;

  if (viaCardCode === 'red_team') {
    tempState.logs = addLog(tempState.logs, `Runner가 Red Team을 통해 ${serverName} 서버에 런을 개시했습니다!`, 'Runner');
  } else {
    tempState.logs = addLog(tempState.logs, `Runner가 ${serverName} 서버에 런을 개시했습니다!`, 'Runner');
  }

  // ICE 유무 체크
  const iceCount = server.ice.length;
  if (iceCount === 0) {
    const hasSkunk = server.root.some(c => c.codeName === 'manegarm_skunkworks' && c.rezzed);
    if (hasSkunk) {
      tempState.run = {
        target: serverName,
        iceIndex: -1,
        phase: 'success',
        currentIce: null,
        bypassed: false,
        subroutines: [],
        jackedOut: false,
        success: false,
        accessedCards: [],
        accessIndex: 0,
        overclockCreditsUsed: 0,
        overclockCredits: viaCardCode === 'overclock' ? 5 : 0,
        needSkunkworksPay: true,
        viaCardCode: viaCardCode,
      };
      tempState.logs = addLog(tempState.logs, `방어선(ICE)이 없지만 Manegarm Skunkworks 방해 요소가 작동 중입니다.`, 'System');
      return tempState;
    }

    // ICE가 없으면 바로 진입 성공
    tempState.run = {
      target: serverName,
      iceIndex: -1,
      phase: 'success',
      currentIce: null,
      bypassed: false,
      subroutines: [],
      jackedOut: false,
      success: true,
      accessedCards: [],
      accessIndex: 0,
      overclockCreditsUsed: 0,
      overclockCredits: viaCardCode === 'overclock' ? 5 : 0,
      viaCardCode: viaCardCode,
    };
    tempState.logs = addLog(tempState.logs, `방어선(ICE)이 없어 Runner가 즉시 서버 진입에 성공했습니다!`, 'System');
    return transitionRun(tempState);
  } else {
    // 가장 외곽의 ICE부터 시작 (Index = iceCount - 1)
    const outermostIce = server.ice[iceCount - 1];
    tempState.run = {
      target: serverName,
      iceIndex: iceCount - 1,
      phase: 'approach',
      currentIce: outermostIce,
      bypassed: false,
      subroutines: outermostIce.subroutines ? outermostIce.subroutines.map(s => ({ ...s })) : [],
      jackedOut: false,
      success: false,
      accessedCards: [],
      accessIndex: 0,
      overclockCreditsUsed: 0,
      overclockCredits: viaCardCode === 'overclock' ? 5 : 0,
      viaCardCode: viaCardCode,
    };
    tempState.logs = addLog(tempState.logs, `Runner가 ${outermostIce.title} ICE에 접근(Approach)합니다.`, 'System');
  }

  return tempState;
}

// 런 단계 진행 처리
export function transitionRun(state: GameState): GameState {
  let tempState = cloneState(state);
  if (!tempState.run) return state;

  const run = tempState.run;
  const server = tempState.servers[run.target];
  
  if (run.phase === 'approach') {
    if (run.currentIce && server) {
      const matchingIce = server.ice.find(ice => ice.id === run.currentIce!.id);
      if (matchingIce) {
        run.currentIce = { ...matchingIce };
        if (matchingIce.rezzed && (!run.subroutines || run.subroutines.length === 0)) {
          run.subroutines = matchingIce.subroutines ? matchingIce.subroutines.map(s => ({ ...s })) : [];
        }
      }
    }

    const currentIce = run.currentIce;
    if (currentIce && currentIce.rezzed) {
      // 레즈 상태면 조우(Encounter) 페이즈로 전환
      tempState.run.phase = 'encounter';
      tempState.logs = addLog(tempState.logs, `Runner가 레즈된 ${currentIce.title} ICE와 조우(Encounter)합니다.`, 'System');
    } else {
      // 비레즈 상태면 자동으로 통과(Pass)
      tempState.logs = addLog(tempState.logs, `${currentIce?.title || 'ICE'}가 Rez되지 않아 통과했습니다.`, 'System');
      tempState.run.phase = 'approach'; // 다음 ICE 혹은 진입으로 루프 전환
      return passIce(tempState);
    }
  } else if (run.phase === 'success') {
    // 진입 성공 시점에 런 완료 플래그 활성화
    tempState.run.success = true;
    tempState.run.phase = 'breach';
    tempState.runner.successfulRunThisTurn = true;

    // Jailbreak 카드 성공 시 1 드로우 사전 지급
    if (run.viaCardCode === 'jailbreak') {
      const drawn = tempState.runner.deck.pop();
      if (drawn) {
        tempState.runner.hand.push(drawn);
        tempState.logs = addLog(tempState.logs, `Jailbreak 성공 효과로 카드 1장을 드로우했습니다.`, 'Runner');
      }
    }
    
    // R&D, HQ, Archives 또는 원격 서버 카드 수집
    let accessed: Card[] = [];
    if (run.target === 'HQ') {
      const hand = [...tempState.corp.hand];
      if (hand.length > 0) {
        // 무작위로 HQ 카드 선택
        const idx = Math.floor(Math.random() * hand.length);
        accessed.push(hand[idx]);
        
        // Docklands Pass 나 Jailbreak로 추가 액세스
        const hasDocklands = tempState.runner.rig.some(c => c.codeName === 'docklands_pass');
        const jailbreakActive = run.viaCardCode === 'jailbreak';
        const extraCount = (hasDocklands ? 1 : 0) + (jailbreakActive ? 1 : 0);
        
        for (let i = 0; i < extraCount; i++) {
          if (hand.length > accessed.length) {
            const available = hand.filter(hCard => !accessed.includes(hCard));
            const extraIdx = Math.floor(Math.random() * available.length);
            accessed.push(available[extraIdx]);
          }
        }
      }
    } else if (run.target === 'RD') {
      const deck = [...tempState.corp.deck];
      if (deck.length > 0) {
        // 덱 맨 위 액세스
        accessed.push(deck[deck.length - 1]);
        
        const jailbreakActive = run.viaCardCode === 'jailbreak';
        if (jailbreakActive && deck.length > 1) {
          accessed.push(deck[deck.length - 2]); // R&D 위에서 두번째 카드 추가 액세스
        }
      }
    } else if (run.target === 'Archives') {
      // 아카이브 전체 공개 액세스
      accessed = [...tempState.corp.discard];
    } else {
      // Remote 서버 루트에 있는 모든 카드 액세스
      accessed = [...server.root];
    }

    tempState.run.accessedCards = accessed;
    tempState.run.accessIndex = 0;

    tempState.logs = addLog(tempState.logs, `Runner가 ${run.target} 서버를 Breach하여 ${accessed.length}장의 카드를 액세스합니다.`, 'System');

    // 만약 액세스할 카드가 아예 없다면 런 종료
    if (accessed.length === 0) {
      return endRun(tempState);
    }
  }

  return tempState;
}

// ICE 서브루틴 임시 해제
export function breakSubroutine(state: GameState, subId: string): GameState {
  let tempState = cloneState(state);
  if (!tempState.run || tempState.run.phase !== 'encounter') return state;

  tempState.run.subroutines = tempState.run.subroutines.map(sub => {
    if (sub.id === subId) {
      return { ...sub, broken: true };
    }
    return sub;
  });

  return tempState;
}

// Bioroid 클릭 서브루틴 해제
export function breakSubWithClick(state: GameState, subId: string): GameState {
  let tempState = cloneState(state);
  if (!tempState.run || tempState.run.phase !== 'encounter') return state;
  if (tempState.runner.clicks <= 0) return state;

  tempState.runner.clicks -= 1;
  tempState.run.subroutines = tempState.run.subroutines.map(sub => {
    if (sub.id === subId) {
      tempState.logs = addLog(tempState.logs, `Bioroid 능력을 통해 [Click]을 지불하여 서브루틴을 해제했습니다.`, 'Runner');
      return { ...sub, broken: true };
    }
    return sub;
  });

  return checkTurnEnd(tempState);
}

// 조우 종료 후 남은 서브루틴 발동 처리
export function resolveSubroutines(state: GameState): GameState {
  let tempState = cloneState(state);
  if (!tempState.run || tempState.run.phase !== 'encounter') return state;

  const run = tempState.run;
  const currentIce = run.currentIce;
  if (!currentIce) return state;

  tempState.logs = addLog(tempState.logs, `${currentIce.title}의 미해제 서브루틴들이 작동합니다.`, 'System');

  let runEndedBySub = false;

  for (const sub of run.subroutines) {
    if (!sub.broken) {
      tempState.logs = addLog(tempState.logs, `[작동] ↳ ${sub.text}`, 'Corp');
      
      if (sub.effectType === 'end-run') {
        runEndedBySub = true;
      } else if (sub.effectType === 'damage') {
        // 넷 데미지
        const damageAmt = currentIce.codeName === 'karuna' ? 2 : 1;
        tempState = applyNetDamage(tempState, damageAmt, currentIce.title);
        
        // 플랫라인 체크
        if (tempState.winner) return tempState;

        // Karuna 잭아웃 선택 분기 처리 (AI 혹은 단순 진행용)
        if (currentIce.codeName === 'karuna' && sub.id === 'karuna_sub_1') {
          // 간소화: 러너가 잭아웃하지 않음 (만약 잭아웃하고 싶다면 아래 주석 활용)
          tempState.logs = addLog(tempState.logs, `Runner가 Karuna의 첫 서브루틴 데미지를 받고 런을 계속 진행합니다.`, 'Runner');
        }
      } else if (sub.effectType === 'lose-credits') {
        // Whitespace의 3원 소실
        tempState.runner.credits = Math.max(0, tempState.runner.credits - 3);
        tempState.logs = addLog(tempState.logs, `Runner가 3 [Credits]를 소실했습니다.`, 'System');
      } else if (sub.effectType === 'gain-credits-corp') {
        // Tithe의 1원 획득
        tempState.corp.credits += 1;
        tempState.logs = addLog(tempState.logs, `Corp가 1 [Credit]을 획득했습니다.`, 'System');
      } else if (sub.effectType === 'install') {
        // Bran 1.0의 ICE 무상 안쪽 설치
        const hIndex = tempState.corp.hand.findIndex(c => c.type === 'ICE');
        if (hIndex !== -1) {
          const newIce = tempState.corp.hand.splice(hIndex, 1)[0];
          // Bran 바로 안쪽(index 0에 가까운 쪽)에 삽입
          const server = tempState.servers[run.target];
          server.ice.unshift(newIce);
          tempState.logs = addLog(tempState.logs, `Bran 1.0 효과로 ${newIce.title}가 무상으로 안쪽에 추가 설치되었습니다.`, 'Corp');
        }
      }
    }
  }

  // Whitespace 6원 이하 강제 종결 처리
  if (currentIce.codeName === 'whitespace' && tempState.runner.credits <= 6) {
    const secondSubBroken = run.subroutines.find(s => s.id === 'whitespace_sub_2')?.broken;
    if (!secondSubBroken) {
      runEndedBySub = true;
      tempState.logs = addLog(tempState.logs, `Runner가 6 [Credits] 이하이므로 Whitespace 효과로 런이 강제 종결됩니다.`, 'System');
    }
  }

  if (runEndedBySub && tempState.run) {
    tempState.run.phase = 'end';
    tempState.run.success = false;
    tempState.logs = addLog(tempState.logs, `런이 실패로 종료되었습니다.`, 'System');
    return endRun(tempState);
  }

  return passIce(tempState);
}

// ICE 무사 통과 처리
export function passIce(state: GameState): GameState {
  let tempState = cloneState(state);
  if (!tempState.run) return state;

  const run = tempState.run;
  const server = tempState.servers[run.target];

  // 만약 이 서버에 레즈된 Skunkworks가 있고 아직 지불하지 않았다면 비용 청구
  const hasSkunk = server.root.some(c => c.codeName === 'manegarm_skunkworks' && c.rezzed);
  if (hasSkunk && !run.manegarmSkunkworksCostPaid && !run.needSkunkworksPay) {
    tempState.run.needSkunkworksPay = true;
    tempState.logs = addLog(tempState.logs, `Manegarm Skunkworks 보안 시스템이 작동했습니다. 계속 진행하려면 비용을 지불해야 합니다.`, 'System');
    return tempState;
  }

  // Mayfly 소모성 처리
  if (tempState.runner.rig.some(c => c.codeName === 'mayfly')) {
    // 런 동안 Mayfly가 사용되었으면 기록
    // (간단하게 Mayfly 장착 상태 체크)
  }

  // 다음 ICE로 들어가기
  const nextIndex = run.iceIndex - 1;
  if (nextIndex < 0) {
    // 모든 ICE를 통과했으므로 진입 성공
    tempState.run.phase = 'success';
    tempState.run.iceIndex = -1;
    tempState.run.currentIce = null;
    tempState.logs = addLog(tempState.logs, `Runner가 모든 방어선을 지나 서버 진입에 성공했습니다!`, 'System');
    return transitionRun(tempState);
  } else {
    // 안쪽에 ICE가 더 있음. Runner에게 잭아웃 의사 확인 필요
    const nextIce = server.ice[nextIndex];
    tempState.run.iceIndex = nextIndex;
    tempState.run.currentIce = nextIce;
    tempState.run.subroutines = nextIce.subroutines ? nextIce.subroutines.map(s => ({ ...s })) : [];
    tempState.run.phase = 'approach';
    tempState.logs = addLog(tempState.logs, `Runner가 다음 방어선인 ${nextIce.title} ICE에 접근합니다.`, 'System');
  }

  return tempState;
}

// 런 중도 중단 (Jack Out)
export function jackOut(state: GameState): GameState {
  let tempState = cloneState(state);
  if (!tempState.run) return state;

  tempState.run.phase = 'end';
  tempState.run.jackedOut = true;
  tempState.run.success = false;
  tempState.logs = addLog(tempState.logs, 'Runner가 잭아웃(Jack Out)하여 런을 안전하게 중단했습니다.', 'Runner');

  return endRun(tempState);
}

// 액세스 카드 분기 처리
export function resolveAccessCard(state: GameState, trash = false): GameState {
  let tempState = cloneState(state);
  if (!tempState.run || tempState.run.phase !== 'breach') return state;

  const run = tempState.run;
  const card = run.accessedCards[run.accessIndex];
  if (!card) return state;

  // 액세스 로그 추가
  tempState.logs = addLog(tempState.logs, `[액세스] Runner가 ${run.target} 서버에서 '${card.title}' (${card.type}) 카드를 액세스했습니다.`, 'System');

  // 1. 함정 작동 여부 확인 (액세스 시점 즉각 작동)
  let trapTriggered = false;
  if (card.codeName === 'urtica_cipher' && card.advancedCounters > 0) {
    if (tempState.corp.credits >= 1) {
      tempState.corp.credits -= 1;
      const damage = card.advancedCounters * 2;
      tempState.logs = addLog(tempState.logs, `Corp가 1 [Credit]을 지불하여 Urtica Cipher 함정을 작동시킵니다! (데미지: ${damage}점)`, 'Corp');
      tempState = applyNetDamage(tempState, damage, 'Urtica Cipher');
      trapTriggered = true;

      // 플랫라인(패배) 시 즉시 복귀
      if (tempState.winner) {
        return endRun(tempState);
      }
    }
  }

  // 2. Agenda인 경우 자동 탈취
  if (card.side === 'Corp' && card.type === 'Agenda') {
    // Corp 덱, 핸드, 또는 원격 루트에서 해당 카드를 완전히 빼서 러너 득점영역으로 이동
    if (run.target === 'HQ') {
      const idx = tempState.corp.hand.findIndex(c => c.id === card.id);
      if (idx !== -1) tempState.corp.hand.splice(idx, 1);
    } else if (run.target === 'RD') {
      const idx = tempState.corp.deck.findIndex(c => c.id === card.id);
      if (idx !== -1) tempState.corp.deck.splice(idx, 1);
    } else if (run.target === 'Archives') {
      const idx = tempState.corp.discard.findIndex(c => c.id === card.id);
      if (idx !== -1) tempState.corp.discard.splice(idx, 1);
    } else {
      const server = tempState.servers[run.target];
      if (server) {
        server.root = server.root.filter(c => c.id !== card.id);
      }
    }

    tempState.runner.scoreArea.push(card);
    tempState.runner.score += card.agendaPoints || 0;
    tempState.logs = addLog(tempState.logs, `Runner가 의제 ${card.title}를 훔쳐 득점했습니다! (+${card.agendaPoints} 점)`, 'Runner');

    // Send a Message 훔칠 시 콥 무료 레즈
    if (card.codeName === 'send_a_message') {
      // 콥 무료 레즈 발동 (가장 바깥 ICE 자동 Rez)
      let rezzed = false;
      tempState.servers = Object.keys(tempState.servers).reduce((acc, serverKey) => {
        const server = tempState.servers[serverKey];
        const newIce = server.ice.map(ice => {
          if (!ice.rezzed && !rezzed) {
            ice.rezzed = true;
            rezzed = true;
            tempState.logs = addLog(tempState.logs, `Send a Message 탈취 반작용으로 ${ice.title} 카드가 Rez되었습니다.`, 'Corp');
          }
          return ice;
        });
        acc[serverKey] = { ...server, ice: newIce };
        return acc;
      }, {} as typeof tempState.servers);
    }

    tempState = checkVictory(tempState);

  } else if (trash && card.trashCost !== undefined && tempState.runner.credits >= card.trashCost) {
    // 러너가 크레딧을 내고 자산/업그레이드를 파괴(Trash)
    tempState.runner.credits -= card.trashCost;
    
    // 원본 위치에서 삭제
    if (run.target === 'HQ') {
      tempState.corp.hand = tempState.corp.hand.filter(c => c.id !== card.id);
    } else if (run.target === 'RD') {
      tempState.corp.deck = tempState.corp.deck.filter(c => c.id !== card.id);
    } else {
      const server = tempState.servers[run.target];
      if (server) {
        server.root = server.root.filter(c => c.id !== card.id);
      }
    }
    
    tempState.corp.discard.push(card);
    tempState.logs = addLog(tempState.logs, `Runner가 ${card.trashCost} [Credits]를 지불하고 ${card.title}를 폐기(Trash)했습니다.`, 'Runner');

  } else {
    // 일반적인 단순 액세스 로그
    if (!trapTriggered) {
      tempState.logs = addLog(tempState.logs, `Runner가 카드(${card.title})를 액세스하고 그냥 둡니다.`, 'Runner');
    }
  }

  // 다음 카드로 이동
  const nextAccessIdx = run.accessIndex + 1;
  if (nextAccessIdx >= run.accessedCards.length || tempState.winner) {
    // 모든 카드 액세스 끝났거나 패배했다면 종료
    return endRun(tempState);
  } else {
    if (tempState.run) {
      tempState.run.accessIndex = nextAccessIdx;
    }
  }

  return tempState;
}

// 런 완결 및 정리
export function endRun(state: GameState): GameState {
  let tempState = cloneState(state);
  if (!tempState.run) return state;

  const run = tempState.run;
  const success = run.success;

  // Pennyshaver 콘솔 금융 보상 작동
  if (success && ['HQ', 'RD'].includes(run.target)) {
    const hasPennyshaver = tempState.runner.rig.find(c => c.codeName === 'pennyshaver');
    if (hasPennyshaver) {
      const accessCount = run.accessedCards.length;
      tempState.runner.credits += accessCount;
      tempState.logs = addLog(tempState.logs, `Pennyshaver 보상: 이번 런에서 액세스한 ${accessCount}장 대비 ${accessCount} [Credits]를 획득합니다.`, 'Runner');
    }
  }

  // Red Team 효과
  if (success && run.viaCardCode === 'red_team' && ['HQ', 'RD', 'Archives'].includes(run.target)) {
    tempState.runner.rig = tempState.runner.rig.map(c => {
      if (c.codeName === 'red_team' && c.hostedCredits > 0) {
        const gain = Math.min(3, c.hostedCredits);
        tempState.runner.credits += gain;
        c.hostedCredits -= gain;
        tempState.logs = addLog(tempState.logs, `Red Team 성공 보상으로 ${gain} [Credits]를 수령합니다. (잔량: ${c.hostedCredits}🪙)`, 'Runner');
      }
      return c;
    });
  }

  // Overclock 임시 크레딧 소멸 처리
  if (run.overclockCredits !== undefined && run.overclockCredits > 0) {
    tempState.logs = addLog(tempState.logs, `Overclock 임시 크레딧 ${run.overclockCredits}🪙이 런 완료 후 소멸되었습니다.`, 'System');
  }

  // Mayfly 런 종료 시 폐기 처리
  tempState.runner.rig = tempState.runner.rig.filter(c => {
    if (c.codeName === 'mayfly') {
      tempState.runner.discard.push(c);
      tempState.logs = addLog(tempState.logs, `Mayfly를 사용했으므로 런이 끝나고 폐기합니다.`, 'System');
      return false;
    }
    return true;
  });

  tempState.run = null;
  tempState.logs = addLog(tempState.logs, `런(Run) 과정이 완전히 정리되었습니다.`, 'System');
  
  return checkTurnEnd(tempState);
}

export function paySkunkworksCost(state: GameState, paymentType: 'credits' | 'clicks' | 'jackout'): GameState {
  let tempState = cloneState(state);
  if (!tempState.run || !tempState.run.needSkunkworksPay) return state;

  if (paymentType === 'jackout') {
    tempState.run.needSkunkworksPay = false;
    return jackOut(tempState);
  }

  if (paymentType === 'credits') {
    const totalAvailable = tempState.runner.credits + (tempState.run.overclockCredits || 0);
    if (totalAvailable < 5) return state;

    let cost = 5;
    // 임시 Overclock 크레딧에서 차감 우선
    if (tempState.run.overclockCredits !== undefined && tempState.run.overclockCredits > 0) {
      const fromTemp = Math.min(tempState.run.overclockCredits, cost);
      tempState.run.overclockCredits -= fromTemp;
      cost -= fromTemp;
    }
    if (cost > 0) {
      tempState.runner.credits -= cost;
    }

    tempState.run.manegarmSkunkworksCostPaid = true;
    tempState.run.needSkunkworksPay = false;
    tempState.logs = addLog(tempState.logs, `Runner가 5 [Credits]를 지불하여 Manegarm Skunkworks 비용을 결제했습니다.`, 'Runner');
  } else if (paymentType === 'clicks') {
    if (tempState.runner.clicks < 2) return state;
    tempState.runner.clicks -= 2;
    tempState.run.manegarmSkunkworksCostPaid = true;
    tempState.run.needSkunkworksPay = false;
    tempState.logs = addLog(tempState.logs, `Runner가 2 [Clicks]를 소모하여 Manegarm Skunkworks 비용을 결제했습니다.`, 'Runner');
  }

  // 결제 완료 후 원래 가려던 방향으로 진행 재개
  return passIce(tempState);
}

// 런 이벤트 카드 통합 플레이
export function playRunEventCard(state: GameState, cardId: string, serverName: ServerName): GameState {
  let tempState = cloneState(state);
  const cardIndex = tempState.runner.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;
  const card = tempState.runner.hand[cardIndex];

  // 클릭 및 크레딧 소모 여부 체크
  if (tempState.runner.clicks <= 0 || tempState.phase !== 'runner-action') return state;
  if (tempState.runner.credits < card.cost) return state;

  // 카드 비용 및 클릭 소모 (런 이벤트이므로 1클릭만 소모)
  tempState.runner.credits -= card.cost;
  tempState.runner.clicks -= 1;

  // 손패에서 버림 더미로 이동
  tempState.runner.hand.splice(cardIndex, 1);
  tempState.runner.discard.push(card);

  tempState.logs = addLog(tempState.logs, `Runner가 런 이벤트 카드 ${card.title}를 사용했습니다.`, 'Runner');

  // 즉시 런 실행!
  return initiateRun(tempState, serverName, card.codeName);
}

// 시작 손패 멀리건 실행
export function resolveMulligan(state: GameState, side: 'Corp' | 'Runner', selectedIds: string[]): GameState {
  let tempState = cloneState(state);
  
  const shuffle = (array: Card[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  if (side === 'Corp') {
    if (tempState.phase !== 'corp-mulligan') return state;

    if (selectedIds.length > 0) {
      const toReplace = tempState.corp.hand.filter(c => selectedIds.includes(c.id));
      tempState.corp.hand = tempState.corp.hand.filter(c => !selectedIds.includes(c.id));
      
      tempState.corp.deck.push(...toReplace);
      shuffle(tempState.corp.deck);
      
      for (let i = 0; i < toReplace.length; i++) {
        const drawn = tempState.corp.deck.pop();
        if (drawn) tempState.corp.hand.push(drawn);
      }
      
      tempState.logs = addLog(tempState.logs, `Corp가 손패에서 카드 ${selectedIds.length}장을 멀리건(교체)했습니다.`, 'Corp');
    } else {
      tempState.logs = addLog(tempState.logs, `Corp가 손패를 그대로 유지(Keep)합니다.`, 'Corp');
    }
    
    // 다음은 러너 멀리건 단계로
    tempState.phase = 'runner-mulligan';
    tempState.activePlayer = 'Runner';
    
  } else if (side === 'Runner') {
    if (tempState.phase !== 'runner-mulligan') return state;

    if (selectedIds.length > 0) {
      const toReplace = tempState.runner.hand.filter(c => selectedIds.includes(c.id));
      tempState.runner.hand = tempState.runner.hand.filter(c => !selectedIds.includes(c.id));
      
      tempState.runner.deck.push(...toReplace);
      shuffle(tempState.runner.deck);
      
      for (let i = 0; i < toReplace.length; i++) {
        const drawn = tempState.runner.deck.pop();
        if (drawn) tempState.runner.hand.push(drawn);
      }
      
      tempState.logs = addLog(tempState.logs, `Runner가 손패에서 카드 ${selectedIds.length}장을 멀리건(교체)했습니다.`, 'Runner');
    } else {
      tempState.logs = addLog(tempState.logs, `Runner가 손패를 그대로 유지(Keep)합니다.`, 'Runner');
    }
    
    // 멀리건 완료 및 본 게임 시작
    tempState.logs = addLog(tempState.logs, '멀리건 단계가 완료되었습니다. 본 게임을 개시합니다.', 'System');
    tempState.phase = 'corp-draw';
    tempState.activePlayer = 'Corp';
    tempState.corp.clicks = 3;
    tempState.logs = addLog(tempState.logs, '턴 1: Corporation의 차례입니다.', 'System');
    
    // Corp 의무 드로우
    const mandatoryDrawCard = tempState.corp.deck.pop();
    if (mandatoryDrawCard) {
      tempState.corp.hand.push(mandatoryDrawCard);
      tempState.logs = addLog(tempState.logs, 'Corp가 의무 드로우로 카드 1장을 뽑았습니다.', 'Corp');
      tempState.phase = 'corp-action';
    } else {
      tempState.winner = 'Runner';
      tempState.phase = 'game-over';
      tempState.logs = addLog(tempState.logs, 'Corp의 R&D에 카드가 없습니다. Runner가 승리합니다!', 'System');
    }
  }

  return tempState;
}
