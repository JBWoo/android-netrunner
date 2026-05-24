import { useState, useEffect, useRef } from 'react';
import type { GameState, GameMode, Difficulty, ServerName, Card, Subroutine } from './game/types';
import { 
  createInitialState, executeBasicAction, installCard, rezCard, 
  advanceCard, scoreAgenda, playCard, executeResourceClick, 
  discardCard, initiateRun, transitionRun, breakSubroutine, 
  breakSubWithClick, resolveSubroutines, passIce, jackOut, 
  resolveAccessCard, checkVictory, checkTurnEnd, endRunnerTurn,
  paySkunkworksCost, playRunEventCard, resolveMulligan,
  endCorpTurn, boostBreakerStrength, continueAfterKarunaSub,
  takePennyshaverCredits, swapIce, skipTaoSwap,
  retrieveCardFromArchives, skipHbRetrieve,
  resolvePublicTrailChoice, resolveWildcatStrikeChoice, resolveNbnRealityPlusChoice, useLeech,
  resolveTraceCorpBid, resolveTraceRunnerBid
} from './game/engine';
import { corpPlayTurnStep, runnerPlayTurnStep } from './game/ai';
import { Board } from './components/Board';
import { CardComponent } from './components/CardComponent';
import { RunPanel } from './components/RunPanel';
import { LogPanel } from './components/LogPanel';
import { QAPanel } from './components/QAPanel';
import { HelpPanel } from './components/HelpPanel';
import { 
  playBGM, setBGMVolume, setMute,
  playClickSFX, playInstallSFX, playAlarmSFX, playGlitchSFX, playSuccessSFX, playFailureSFX
} from './game/sound';
import { CARD_DATABASE } from './game/cards';

function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>('runner-human');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [selectedRunnerDeck, setSelectedRunnerDeck] = useState<'loup' | 'zahya' | 'tao' | 'starter'>('starter');
  const [selectedCorpDeck, setSelectedCorpDeck] = useState<'haas' | 'jinteki' | 'nbn' | 'weyland' | 'starter'>('starter');
  const [bgmVolume, setBgmVolumeState] = useState<number>(0.15);
  const [isAudioMuted, setIsAudioMutedState] = useState<boolean>(false);
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);
  
  const [rightPanelTab, setRightPanelTab] = useState<'logs' | 'qa' | 'help'>('logs');
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [mulliganSelectedIds, setMulliganSelectedIds] = useState<Set<string>>(new Set());
  const [focusedMulliganIndex, setFocusedMulliganIndex] = useState<number>(0);
  const [traceBidValue, setTraceBidValue] = useState<number>(0);

  const toggleMulliganSelect = (cardId: string) => {
    setMulliganSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const prevStateRef = useRef<GameState | null>(null);

  const [activeEffect, setActiveEffect] = useState<{
    type: 'install' | 'run' | 'steal' | 'score' | 'advance';
    title?: string;
    server?: string;
  } | null>(null);

  const triggerEffect = (type: 'install' | 'run' | 'steal' | 'score' | 'advance', title?: string, server?: string) => {
    setActiveEffect({ type, title, server });
  };

  useEffect(() => {
    if (activeEffect) {
      const timer = setTimeout(() => {
        setActiveEffect(null);
      }, 1300);
      return () => clearTimeout(timer);
    }
  }, [activeEffect]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCardId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMulliganActive = !!(state && ((state.phase === 'corp-mulligan' && state.gameMode === 'corp-human') || (state.phase === 'runner-mulligan' && state.gameMode === 'runner-human')));
  const hand = state && isMulliganActive ? (state.phase === 'corp-mulligan' ? state.corp.hand : state.runner.hand) : [];

  useEffect(() => {
    if (!isMulliganActive || hand.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedMulliganIndex(prev => (prev > 0 ? prev - 1 : hand.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedMulliganIndex(prev => (prev < hand.length - 1 ? prev + 1 : 0));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const card = hand[focusedMulliganIndex];
        if (card) {
          toggleMulliganSelect(card.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMulliganActive, hand, focusedMulliganIndex]);

  // 오디오 초기화/음량 헬퍼
  const initAudio = () => {
    if (!audioInitialized) {
      playBGM();
      setAudioInitialized(true);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setBgmVolumeState(vol);
    setBGMVolume(vol);
    if (vol > 0 && isAudioMuted) {
      setIsAudioMutedState(false);
      setMute(false);
    }
  };

  const handleToggleMute = () => {
    const newMuted = !isAudioMuted;
    setIsAudioMutedState(newMuted);
    setMute(newMuted);
    if (!newMuted && !audioInitialized) {
      playBGM();
      setAudioInitialized(true);
    }
  };

  // 게임 상태 변화에 따른 SFX 격발 감지
  useEffect(() => {
    if (!state) {
      prevStateRef.current = null;
      return;
    }
    
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!prev) return;

    // 1. 런 개시 감지
    if (!prev.run && state.run) {
      playAlarmSFX();
      triggerEffect('run', undefined, state.run.target);
    }

    // 2. ICE 인카운터 감지 (run.phase === 'encounter')
    if (state.run && state.run.phase === 'encounter' && (!prev.run || prev.run.phase !== 'encounter')) {
      playGlitchSFX();
    }

    // 3. 아젠다 득점/탈취 감지
    const prevCorpScore = prev.corp.score;
    const curCorpScore = state.corp.score;
    const prevRunnerScore = prev.runner.score;
    const curRunnerScore = state.runner.score;

    if (curCorpScore > prevCorpScore) {
      playSuccessSFX();
      const scoredCard = state.corp.scoreArea[state.corp.scoreArea.length - 1];
      triggerEffect('score', scoredCard ? scoredCard.title : 'Agenda');
    } else if (curRunnerScore > prevRunnerScore) {
      playSuccessSFX();
      const stolenCard = state.runner.scoreArea[state.runner.scoreArea.length - 1];
      triggerEffect('steal', stolenCard ? stolenCard.title : 'Agenda');
    }

    // 4. 피해 피격 / 플랫라인 패배 감지
    if (state.logs.length > prev.logs.length) {
      const newLogs = state.logs.slice(prev.logs.length);
      const hasDamage = newLogs.some(log => log.message.includes('피해') || log.message.includes('데미지') || log.message.includes('버립니다'));
      const hasFailure = newLogs.some(log => log.message.includes('실패') || log.message.includes('플랫라인') || log.message.includes('패배'));
      if (hasFailure) {
        playFailureSFX();
      } else if (hasDamage && !newLogs.some(log => log.message.includes('디스카드'))) {
        playFailureSFX();
      }
    }
  }, [state]);

  // 게임 시작 처리
  const handleStartGame = (
    mode: GameMode, 
    difficulty: Difficulty,
    runnerDeck?: 'loup' | 'zahya' | 'tao' | 'starter',
    corpDeck?: 'haas' | 'jinteki' | 'nbn' | 'weyland' | 'starter'
  ) => {
    const initialState = createInitialState(
      mode, 
      difficulty, 
      runnerDeck || selectedRunnerDeck, 
      corpDeck || selectedCorpDeck
    );
    setState(initialState);
    setAutoPlay(true);
    setSelectedCardId(null);
    setMulliganSelectedIds(new Set());
    
    // 첫 인터랙션 시점에 오디오 초기화 및 재생
    initAudio();
  };

  // 게임 강제 리셋
  const handleResetGame = () => {
    setState(null);
    setAutoPlay(true);
    setSelectedCardId(null);
    setMulliganSelectedIds(new Set());
  };

  // AI 한단계 행동 실행
  const handleAIAction = () => {
    if (!state || state.phase === 'game-over') return;

    setState((prevState) => {
      if (!prevState) return null;

      // 이전 상태 핵심 지표 백업 (mutative 수정 이전의 값을 보존)
      const prevActivePlayer = prevState.activePlayer;
      const prevPhase = prevState.phase;
      const prevCorpClicks = prevState.corp.clicks;
      const prevRunnerClicks = prevState.runner.clicks;
      const prevCorpCredits = prevState.corp.credits;
      const prevRunnerCredits = prevState.runner.credits;
      const prevCorpHandLength = prevState.corp.hand.length;
      const prevRunnerHandLength = prevState.runner.hand.length;
      const prevRunPhase = prevState.run?.phase;

      let nextState = { ...prevState };

      if (nextState.activePlayer === 'Corp') {
        nextState = corpPlayTurnStep(nextState);
      } else {
        nextState = runnerPlayTurnStep(nextState);
      }

      // 교착상태 (Deadlock) 방지용 안전망
      // 이전 상태와 핵심 지표(clicks, credits, hand length, phase, activePlayer, run phase)가 동일한 경우
      const isSame = 
        prevActivePlayer === nextState.activePlayer &&
        prevPhase === nextState.phase &&
        prevCorpClicks === nextState.corp.clicks &&
        prevRunnerClicks === nextState.runner.clicks &&
        prevCorpCredits === nextState.corp.credits &&
        prevRunnerCredits === nextState.runner.credits &&
        prevCorpHandLength === nextState.corp.hand.length &&
        prevRunnerHandLength === nextState.runner.hand.length &&
        prevRunPhase === nextState.run?.phase;

      if (isSame) {
        console.warn("AI Deadlock detected - enforcing basic action or turn end.", {
          activePlayer: nextState.activePlayer,
          phase: nextState.phase,
          corpClicks: nextState.corp.clicks,
          runnerClicks: nextState.runner.clicks,
          corpCredits: nextState.corp.credits,
          runnerCredits: nextState.runner.credits,
          corpHand: nextState.corp.hand.map(c => c.title),
          runnerHand: nextState.runner.hand.map(c => c.title),
          run: nextState.run
        });
        // 강제로 클릭을 소모하거나 강제 턴 전환
        if (nextState.activePlayer === 'Corp') {
          if (nextState.corp.clicks > 0) {
            nextState = executeBasicAction(nextState, 'gain-credit');
          } else {
            // 클릭이 0인데 턴이 안넘어간 경우 강제 턴 전환
            nextState.corp.clicks = 0;
            nextState = checkTurnEnd(nextState);
            if (nextState.phase === 'corp-discard' && nextState.corp.hand.length > 0) {
              // 디스카드 강제 수행
              nextState = discardCard(nextState, nextState.corp.hand[0].id);
            }
          }
        } else {
          if (nextState.runner.clicks > 0) {
            nextState = executeBasicAction(nextState, 'gain-credit');
          } else {
            nextState.runner.clicks = 0;
            nextState = checkTurnEnd(nextState);
            if (nextState.phase === 'runner-discard' && nextState.runner.hand.length > 0) {
              nextState = discardCard(nextState, nextState.runner.hand[0].id);
            }
          }
        }
      }

      // 최종 승리조건 검증 강제 동기화
      return checkVictory(nextState);
    });
  };

  // AI 자동 행동 진행 (Auto-Play) 루프
  useEffect(() => {
    if (!autoPlay || !state || state.phase === 'game-over') {
      if (state?.phase === 'game-over' && autoPlay) {
        setAutoPlay(false);
      }
      return;
    }

    const isCorpActive = state.activePlayer === 'Corp';
    const isRunnerActive = state.activePlayer === 'Runner';
    const isCorpAI = state.gameMode === 'runner-human' || state.gameMode === 'ai-vs-ai';
    const isRunnerAI = state.gameMode === 'corp-human' || state.gameMode === 'ai-vs-ai';
    
    // 현재 진행 단계가 AI 차례이거나, 런 진행 도중이고 AI 차례인 경우 자동 실행
    const isAIPending = 
      (isCorpActive && isCorpAI) || 
      (isRunnerActive && isRunnerAI) ||
      (state.run !== null && (
        (state.run.phase === 'approach' && !isCorpActive && isCorpAI) || // approach는 Corp의 Rez 기회
        (state.run.phase === 'encounter' && isRunnerActive && isRunnerAI) ||
        (state.run.phase === 'breach' && isRunnerActive && isRunnerAI)
      ));

    if (isAIPending) {
      const timer = setTimeout(() => {
        handleAIAction();
      }, 500);
      return () => clearTimeout(timer);
    } else if (state.gameMode !== 'ai-vs-ai') {
      // 사람 차례가 되면 자동 플레이 루프를 잠시 대기
    }
  }, [autoPlay, state]);

  const handleSelectCard = (cardId: string | null) => {
    playClickSFX();
    
    if (state && state.phase === 'tao-swap-ice' && cardId) {
      let clickedCard: Card | null = null;
      for (const serverKey of Object.keys(state.servers)) {
        const server = state.servers[serverKey];
        const ice = server.ice.find(i => i.id === cardId);
        if (ice) {
          clickedCard = ice;
          break;
        }
      }
      
      if (clickedCard && clickedCard.type === 'ICE') {
        if (!state.taoSelectedIceId1) {
          setState(prev => {
            if (!prev) return null;
            return {
              ...prev,
              taoSelectedIceId1: cardId
            };
          });
        } else {
          if (state.taoSelectedIceId1 === cardId) {
            setState(prev => {
              if (!prev) return null;
              return {
                ...prev,
                taoSelectedIceId1: undefined
              };
            });
          } else {
            setState(prev => {
              if (!prev) return null;
              return swapIce(prev, prev.taoSelectedIceId1!, cardId);
            });
          }
        }
        return;
      }
    }
    
    setSelectedCardId(cardId);
  };

  const handleMulligan = (side: 'Corp' | 'Runner', confirm: boolean) => {
     playClickSFX();
     const selectedList = confirm ? Array.from(mulliganSelectedIds) : [];
     setState(prev => prev ? resolveMulligan(prev, side, selectedList) : null);
     setMulliganSelectedIds(new Set());
     setSelectedCardId(null);
     setFocusedMulliganIndex(0);
   };

  // --- 플레이어 기본 행동 핸들러 ---
  const handleBasicAction = (actionType: 'gain-credit' | 'draw-card' | 'remove-tag') => {
    playClickSFX();
    setState(prev => prev ? executeBasicAction(prev, actionType) : null);
    setSelectedCardId(null);
  };

  const handleInstall = (cardId: string, serverName: ServerName) => {
    playInstallSFX();
    if (state) {
      const card = state.runner.hand.find(c => c.id === cardId) || state.corp.hand.find(c => c.id === cardId);
      if (card) {
        triggerEffect('install', card.title);
      }
    }
    setState(prev => prev ? installCard(prev, cardId, serverName) : null);
    setSelectedCardId(null);
  };

  const handlePlay = (cardId: string) => {
    playInstallSFX();
    if (state) {
      const card = state.runner.hand.find(c => c.id === cardId) || state.corp.hand.find(c => c.id === cardId);
      if (card) {
        triggerEffect('install', card.title);
      }
    }
    setState(prev => prev ? playCard(prev, cardId) : null);
    setSelectedCardId(null);
  };

  const handleTakePennyshaverCredits = (cardId: string) => {
    playInstallSFX();
    setState(prev => prev ? takePennyshaverCredits(prev, cardId) : null);
    setSelectedCardId(null);
  };

  const handleRez = (cardId: string) => {
    playInstallSFX();
    setState(prev => prev ? rezCard(prev, cardId) : null);
  };

  const handleAdvance = (cardId: string) => {
    playInstallSFX();
    if (state) {
      let card: Card | undefined;
      for (const serverName of Object.keys(state.servers)) {
        const s = state.servers[serverName];
        const found = s.root.find(c => c.id === cardId);
        if (found) {
          card = found;
          break;
        }
      }
      if (card) {
        triggerEffect('advance', card.title);
      }
    }
    setState(prev => prev ? advanceCard(prev, cardId) : null);
  };

  const handleScore = (cardId: string) => {
    setState(prev => prev ? scoreAgenda(prev, cardId) : null);
  };

  const handleResourceClick = (cardId: string) => {
    setState(prev => prev ? executeResourceClick(prev, cardId) : null);
  };

  const handleDiscard = (cardId: string) => {
    setState(prev => prev ? discardCard(prev, cardId) : null);
    setSelectedCardId(null);
  };

  const handleInitiateRun = (serverName: ServerName, viaCardCode?: string) => {
    setState(prev => prev ? initiateRun(prev, serverName, viaCardCode) : null);
    setSelectedCardId(null);
  };

  const handlePlayRunEventCard = (cardId: string, serverName: ServerName) => {
    setState(prev => prev ? playRunEventCard(prev, cardId, serverName) : null);
    setSelectedCardId(null);
  };

  const handleEndRunnerTurn = () => {
    setState(prev => prev ? endRunnerTurn(prev) : null);
    setSelectedCardId(null);
  };

  const handleEndCorpTurn = () => {
    setState(prev => prev ? endCorpTurn(prev) : null);
    setSelectedCardId(null);
  };

  // --- 런 상태 가이드 상호작용 핸들러 ---
  const handleRezIce = (cardId: string) => {
    setState(prev => prev ? rezCard(prev, cardId) : null);
  };

  const handleLetPass = () => {
    setState(prev => prev ? passIce(prev) : null);
  };

  const handleBreakSub = (subId: string, breakerId?: string) => {
    setState(prev => prev ? breakSubroutine(prev, subId, breakerId) : null);
  };

  const handleBreakWithClick = (subId: string) => {
    setState(prev => prev ? breakSubWithClick(prev, subId) : null);
  };

  const handleResolveSubs = () => {
    setState(prev => prev ? resolveSubroutines(prev) : null);
  };

  const handleJackOut = () => {
    setState(prev => prev ? jackOut(prev) : null);
  };

  const handleAccessCard = (trash: boolean) => {
    setState(prev => prev ? resolveAccessCard(prev, trash) : null);
  };

  const handleProceedRun = () => {
    setState(prev => prev ? transitionRun(prev) : null);
  };

  const handlePaySkunkworksCost = (paymentType: 'credits' | 'clicks' | 'jackout') => {
    setState(prev => prev ? paySkunkworksCost(prev, paymentType) : null);
  };

  const handleBoostStrength = (cardId: string) => {
    setState(prev => prev ? boostBreakerStrength(prev, cardId) : null);
  };

  const handleContinueAfterKarunaSub = (jackout: boolean) => {
    setState(prev => prev ? continueAfterKarunaSub(prev, jackout) : null);
  };

  const handleUseLeech = (cardId: string) => {
    setState(prev => prev ? useLeech(prev, cardId) : null);
  };

  // --- 메인 렌더링 분기 ---
  if (!state) {
    const runnerDecks = [
      {
        id: 'starter',
        codeName: 'the_catalyst',
        faction: 'Starter',
        color: 'text-slate-400 border-slate-700/20 bg-[#161d24]/30 hover:border-slate-500/50 hover:shadow-[0_0_15px_rgba(100,116,139,0.15)]',
        selectedColor: 'border-slate-400 bg-[#202933]/40 shadow-[0_0_20px_rgba(148,163,184,0.4)] pulse-glow-cyan text-slate-300',
      },
      {
        id: 'tao',
        codeName: 'tao_salonga_telepresence_magician',
        faction: 'Shaper',
        color: 'text-emerald-400 border-emerald-500/20 bg-[#0c1f19]/30 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        selectedColor: 'border-emerald-400 bg-[#0d2d23]/40 shadow-[0_0_20px_rgba(16,185,129,0.4)] pulse-glow-cyan text-emerald-300',
      },
      {
        id: 'loup',
        codeName: 'rene_loup_arcemont_party_animal',
        faction: 'Anarch',
        color: 'text-orange-500 border-orange-500/20 bg-[#25130b]/30 hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]',
        selectedColor: 'border-orange-500 bg-[#351a0e]/40 shadow-[0_0_20px_rgba(249,115,22,0.4)] pulse-glow-cyan text-orange-400',
      },
      {
        id: 'zahya',
        codeName: 'zahya_sadeghi_versatile_smuggler',
        faction: 'Criminal',
        color: 'text-sky-400 border-sky-500/20 bg-[#0a1e2f]/30 hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)]',
        selectedColor: 'border-sky-400 bg-[#0e2c45]/40 shadow-[0_0_20px_rgba(56,189,248,0.4)] pulse-glow-cyan text-sky-300',
      }
    ];

    const corpDecks = [
      {
        id: 'starter',
        codeName: 'the_syndicate',
        faction: 'Starter',
        color: 'text-slate-400 border-slate-700/20 bg-[#161d24]/30 hover:border-slate-500/50 hover:shadow-[0_0_15px_rgba(100,116,139,0.15)]',
        selectedColor: 'border-slate-400 bg-[#202933]/40 shadow-[0_0_20px_rgba(148,163,184,0.4)] pulse-glow-magenta text-slate-300',
      },
      {
        id: 'jinteki',
        codeName: 'jinteki_restoring_humanity',
        faction: 'Jinteki',
        color: 'text-red-400 border-red-500/20 bg-[#240e11]/30 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        selectedColor: 'border-red-400 bg-[#381318]/40 shadow-[0_0_20px_rgba(239,68,68,0.4)] pulse-glow-magenta text-red-300',
      },
      {
        id: 'haas',
        codeName: 'haas_bioroid_precision_design',
        faction: 'Haas-Bioroid',
        color: 'text-violet-400 border-violet-500/20 bg-[#1b0e2f]/30 hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]',
        selectedColor: 'border-violet-400 bg-[#271345]/40 shadow-[0_0_20px_rgba(139,92,246,0.4)] pulse-glow-magenta text-violet-300',
      },
      {
        id: 'nbn',
        codeName: 'nbn_reality_plus',
        faction: 'NBN',
        color: 'text-amber-400 border-amber-500/20 bg-[#241a0d]/30 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        selectedColor: 'border-amber-400 bg-[#35250f]/40 shadow-[0_0_20px_rgba(245,158,11,0.4)] pulse-glow-magenta text-amber-300',
      },
      {
        id: 'weyland',
        codeName: 'weyland_consortium_built_to_last',
        faction: 'Weyland',
        color: 'text-teal-400 border-teal-500/20 bg-[#0a2324]/30 hover:border-teal-500/50 hover:shadow-[0_0_15px_rgba(20,184,166,0.15)]',
        selectedColor: 'border-teal-400 bg-[#0d3435]/40 shadow-[0_0_20px_rgba(20,184,166,0.4)] pulse-glow-magenta text-teal-300',
      }
    ];

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0b0914] fui-grid-bg relative overflow-hidden fui-screen">
        {/* CRT scanline 가상 백그라운드 효과 */}
        <div className="fui-scanlines"></div>

        {/* 네온 배경 장식 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="glass-panel border-purple-500/20 max-w-4xl w-full p-8 text-center flex flex-col gap-6 shadow-[0_0_50px_rgba(30,19,54,0.3)] relative">
          
          {/* 코너 데코 브래킷 */}
          <div className="fui-corner-bracket fui-corner-tl text-purple-500/60"></div>
          <div className="fui-corner-bracket fui-corner-tr text-purple-500/60"></div>
          <div className="fui-corner-bracket fui-corner-bl text-purple-500/60"></div>
          <div className="fui-corner-bracket fui-corner-br text-purple-500/60"></div>

          <div>
            <h1 className="text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500 font-orbitron drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              ANDROID: NETRUNNER
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-orbitron tracking-widest uppercase">
              System Gateway Faction Specialization Edition (v2.0)
            </p>
          </div>

          <p className="text-sm max-w-xl mx-auto leading-relaxed text-slate-300">
            사이버펑크 세계관의 최고봉 비대칭 전술 카드 게임 <strong>안드로이드 넷러너</strong>에 오신 것을 환영합니다.
            회사의 방어망을 해킹하는 러너, 혹은 방어벽을 구축하고 의제를 실현하는 기업이 되어 두뇌 싸움을 펼쳐보세요.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-2 text-left">
            {/* 러너 선택 카드 */}
            <div 
              onClick={() => {
                playClickSFX();
                setSelectedMode('runner-human');
              }}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${selectedMode === 'runner-human' ? 'bg-cyan-950/20 border-cyan-500 shadow-[0_0_20px_rgba(0,240,255,0.15)]' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
            >
              <div>
                <span className="text-[10px] font-orbitron font-extrabold text-cyan-400 tracking-wider block mb-1">
                  [RUNNER ROLE]
                </span>
                <h3 className="text-lg font-bold text-white">러너로 플레이</h3>
                <p className="text-xs text-slate-400 mt-2 leading-normal">
                  장비와 프로그램을 설치하여 기업의 R&D 및 손패를 강습하고 의제 데이터를 다운로드합니다.
                </p>
              </div>
              <span className="text-[10px] text-cyan-400/70 font-semibold font-orbitron">THE CATALYST ➔</span>
            </div>

            {/* 기업 선택 카드 */}
            <div 
              onClick={() => {
                playClickSFX();
                setSelectedMode('corp-human');
              }}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${selectedMode === 'corp-human' ? 'bg-rose-950/20 border-rose-500 shadow-[0_0_20px_rgba(255,0,85,0.15)]' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
            >
              <div>
                <span className="text-[10px] font-orbitron font-extrabold text-rose-500 tracking-wider block mb-1">
                  [CORP ROLE]
                </span>
                <h3 className="text-lg font-bold text-white">기업으로 플레이</h3>
                <p className="text-xs text-slate-400 mt-2 leading-normal">
                  아이스(ICE) 방어선을 심어 서버 침입을 원천 차단하고 비밀 의제 카드를 안전하게 발전시킵니다.
                </p>
              </div>
              <span className="text-[10px] text-rose-500/70 font-semibold font-orbitron">THE SYNDICATE ➔</span>
            </div>

            {/* AI 관전 선택 카드 */}
            <div 
              onClick={() => {
                playClickSFX();
                setSelectedMode('ai-vs-ai');
              }}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${selectedMode === 'ai-vs-ai' ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
            >
              <div>
                <span className="text-[10px] font-orbitron font-extrabold text-purple-400 tracking-wider block mb-1">
                  [OBSERVER MODE]
                </span>
                <h3 className="text-lg font-bold text-white">AI 대 AI 관전</h3>
                <p className="text-xs text-slate-400 mt-2 leading-normal">
                  고도로 훈련된 기업 휴리스틱 AI와 러너 해킹 AI 간의 자체 모의 대결을 실시간 관전합니다.
                </p>
              </div>
              <span className="text-[10px] text-purple-400/70 font-semibold font-orbitron">SIMULATOR ➔</span>
            </div>
          </div>

          {/* 7종 Faction 덱 선택 리스트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-2 text-left">
            {/* 러너 덱 선택 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-orbitron font-extrabold text-cyan-400 tracking-wider uppercase border-b border-cyan-950 pb-2 flex justify-between items-center">
                <span>1. RUNNER DECK IDENTITY (러너 덱 선택)</span>
                <span className="text-[9px] text-cyan-500 font-mono">3 OPTIONS AVAILABLE</span>
              </h3>
              <div className="flex flex-col gap-2">
                {runnerDecks.map((deck) => {
                  const cardInfo = CARD_DATABASE[deck.codeName];
                  if (!cardInfo) return null;
                  const isSelected = selectedRunnerDeck === deck.id;
                  return (
                    <div 
                      key={deck.id}
                      onClick={() => {
                        playClickSFX();
                        setSelectedRunnerDeck(deck.id as any);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 relative overflow-hidden ${isSelected ? deck.selectedColor : deck.color}`}
                    >
                      {/* 코너 브래킷 데코 */}
                      {isSelected && (
                        <>
                          <div className="fui-corner-bracket fui-corner-tl text-cyan-400"></div>
                          <div className="fui-corner-bracket fui-corner-tr text-cyan-400"></div>
                          <div className="fui-corner-bracket fui-corner-bl text-cyan-400"></div>
                          <div className="fui-corner-bracket fui-corner-br text-cyan-400"></div>
                        </>
                      )}
                      <img 
                        src={cardInfo.imageUrl} 
                        alt={cardInfo.title} 
                        className="w-12 h-16 object-cover border border-slate-800 rounded shadow flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white block truncate">{cardInfo.title.split(':')[0]}</span>
                          <span className="text-[8px] font-orbitron font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {deck.faction}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {cardInfo.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 기업 덱 선택 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-orbitron font-extrabold text-rose-500 tracking-wider uppercase border-b border-rose-950 pb-2 flex justify-between items-center">
                <span>2. CORP DECK IDENTITY (기업 덱 선택)</span>
                <span className="text-[9px] text-rose-500 font-mono">4 OPTIONS AVAILABLE</span>
              </h3>
              <div className="flex flex-col gap-2">
                {corpDecks.map((deck) => {
                  const cardInfo = CARD_DATABASE[deck.codeName];
                  if (!cardInfo) return null;
                  const isSelected = selectedCorpDeck === deck.id;
                  return (
                    <div 
                      key={deck.id}
                      onClick={() => {
                        playClickSFX();
                        setSelectedCorpDeck(deck.id as any);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 relative overflow-hidden ${isSelected ? deck.selectedColor : deck.color}`}
                    >
                      {/* 코너 브래킷 데코 */}
                      {isSelected && (
                        <>
                          <div className="fui-corner-bracket fui-corner-tl text-rose-500"></div>
                          <div className="fui-corner-bracket fui-corner-tr text-rose-500"></div>
                          <div className="fui-corner-bracket fui-corner-bl text-rose-500"></div>
                          <div className="fui-corner-bracket fui-corner-br text-rose-500"></div>
                        </>
                      )}
                      <img 
                        src={cardInfo.imageUrl} 
                        alt={cardInfo.title} 
                        className="w-12 h-16 object-cover border border-slate-800 rounded shadow flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white block truncate">{cardInfo.title.split(':')[0]}</span>
                          <span className="text-[8px] font-orbitron font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {deck.faction}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {cardInfo.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 사운드 제어판 및 난이도 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {/* 사운드 제어판 */}
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl w-full flex flex-col gap-3 text-left">
              <span className="text-xs text-slate-300 font-orbitron tracking-wider block border-b border-slate-900 pb-1.5">
                AUDIO SETTINGS (오디오 제어)
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playClickSFX();
                      handleToggleMute();
                    }}
                    className={`px-3 py-1.5 rounded font-orbitron text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${isAudioMuted ? 'bg-red-950 border border-red-500 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'}`}
                  >
                    <span>{isAudioMuted ? '🔇 MUTED' : '🔊 ACTIVE'}</span>
                  </button>
                  {!audioInitialized && !isAudioMuted && (
                    <button
                      onClick={() => {
                        playClickSFX();
                        initAudio();
                      }}
                      className="bg-purple-950 border border-purple-500 text-purple-300 hover:bg-purple-900 font-orbitron text-[10px] px-2.5 py-1.5 rounded animate-pulse"
                    >
                      🎵 음악 재생 시작
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-orbitron">VOLUME:</span>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={bgmVolume}
                    onChange={(e) => {
                      handleVolumeChange(parseFloat(e.target.value));
                    }}
                    className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-[10px] font-mono text-purple-400 w-6 text-right">
                    {Math.round(bgmVolume * 200)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 난이도 설정 */}
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl w-full flex flex-col gap-3 text-left">
              <span className="text-xs text-slate-300 font-orbitron tracking-wider block border-b border-slate-900 pb-1.5">
                AI DIFFICULTY (난이도)
              </span>
              <div className="flex gap-2 justify-between items-center my-auto">
                <span className="text-[10px] text-slate-400 font-orbitron">SELECT LEVEL:</span>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        playClickSFX();
                        setSelectedDifficulty(d);
                      }}
                      className={`px-3 py-1.5 rounded text-[10px] font-orbitron font-bold uppercase transition-all ${selectedDifficulty === d ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStartGame(selectedMode, selectedDifficulty)}
            className="neon-button border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white max-w-xs mx-auto w-full py-3 text-sm tracking-wider font-extrabold mt-2 cursor-pointer"
          >
            대기 네트워크 연결 (Connect)
          </button>
        </div>
      </div>
    );
  }

  // 메인 게임 레이아웃
  const isAITurn = 
    (state.activePlayer === 'Corp' && (state.gameMode === 'runner-human' || state.gameMode === 'ai-vs-ai')) ||
    (state.activePlayer === 'Runner' && (state.gameMode === 'corp-human' || state.gameMode === 'ai-vs-ai'));

  return (
    <div className="min-h-screen bg-[#0b0914] fui-grid-bg text-slate-200 flex flex-col p-4 md:p-6 gap-6 relative fui-screen">
      {/* CRT scanline 가상 백그라운드 효과 */}
      <div className="fui-scanlines"></div>
      
      {/* 런 진행 오버레이 안내창 */}
      {state.run && (
        <RunPanel
          state={state}
          onRezIce={handleRezIce}
          onLetPass={handleLetPass}
          onBreakSub={handleBreakSub}
          onBreakWithClick={handleBreakWithClick}
          onResolveSubs={handleResolveSubs}
          onJackOut={handleJackOut}
          onAccessCard={handleAccessCard}
          onProceedRun={handleProceedRun}
          onPaySkunkworks={handlePaySkunkworksCost}
          onBoostStrength={handleBoostStrength}
          onContinueAfterKarunaSub={handleContinueAfterKarunaSub}
          onUseLeech={handleUseLeech}
        />
      )}

      {/* 상단 통합 제어 헤더 */}
      <header className="glass-panel p-4 border-slate-800 flex flex-wrap justify-between items-center gap-4 relative">
        {/* 코너 데코 브래킷 */}
        <div className="fui-corner-bracket fui-corner-tl text-slate-700"></div>
        <div className="fui-corner-bracket fui-corner-tr text-slate-700"></div>
        <div className="fui-corner-bracket fui-corner-bl text-slate-700"></div>
        <div className="fui-corner-bracket fui-corner-br text-slate-700"></div>

        <div>
          <h1 className="text-xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-500 font-orbitron flex items-center gap-2">
            <span>NETWORK SYSTEM CORE</span>
            <span className="text-[10px] text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono font-light">
              SYSTEM GATEWAY SPECIALIZED
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-1">
            현재 모드: <strong className="text-cyan-400 uppercase">{state.gameMode}</strong> | 난이도: <strong className="text-purple-400 uppercase">{state.difficulty}</strong>
          </p>
        </div>

        {/* 상단 액션 바 */}
        <div className="flex items-center gap-3">
          
          {/* 오디오 제어 추가 */}
          <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <button 
              onClick={() => {
                playClickSFX();
                handleToggleMute();
              }} 
              className="focus:outline-none hover:scale-110 transition-transform cursor-pointer text-sm"
              title={isAudioMuted ? "음소거 해제" : "음소거"}
            >
              {isAudioMuted ? '🔇' : '🔊'}
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-orbitron text-slate-400">BGM:</span>
              <input 
                type="range" 
                min="0" 
                max="0.5" 
                step="0.05" 
                value={bgmVolume} 
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* AI vs AI 관전 또는 AI 대전 시 자동진행 옵션 */}
          {isAITurn && state.phase !== 'game-over' && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <label htmlFor="auto-play-toggle" className="text-slate-400 font-orbitron cursor-pointer select-none">
                AUTO-PLAY (자동 실행):
              </label>
              <input
                id="auto-play-toggle"
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="w-3.5 h-3.5 accent-purple-500 cursor-pointer"
              />
            </div>
          )}

          {/* 수동 AI Action 트리거 */}
          {isAITurn && !autoPlay && state.phase !== 'game-over' && (
            <button
              onClick={() => {
                playClickSFX();
                handleAIAction();
              }}
              className="bg-purple-950 border border-purple-500 text-purple-300 hover:bg-purple-900 font-orbitron text-xs px-3 py-1.5 rounded animate-pulse cursor-pointer"
            >
              🤖 AI STEP
            </button>
          )}

          <button
            onClick={() => {
              playClickSFX();
              handleResetGame();
            }}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-3 py-1.5 rounded text-rose-400 font-semibold font-orbitron cursor-pointer transition-all"
          >
            역할 선택화면으로
          </button>
        </div>
      </header>

      {/* 게임 패배/승리 대형 오버레이 */}
      {state.phase === 'game-over' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-purple-500/40 max-w-md w-full p-8 text-center flex flex-col gap-5 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <h2 className="text-3xl font-extrabold font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">
              MISSION CONCLUDED
            </h2>
            <div className="my-2">
              <p className="text-xs text-slate-400 uppercase font-orbitron tracking-widest">최종 결과</p>
              <h3 className={`text-2xl font-bold mt-1 ${state.winner === 'Corp' ? 'text-rose-500' : 'text-cyan-400'}`}>
                {state.winner === 'Corp' ? 'CORPORATION (기업) 승리' : 'RUNNER (러너) 승리'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded border border-slate-900 font-mono text-left">
              {state.logs.filter(l => l.message.includes('승리')).pop()?.message || '게임이 정상적으로 종료되었습니다.'}
            </p>
            <div className="flex gap-3 justify-center mt-3">
              <button
                onClick={() => handleStartGame(state.gameMode, state.difficulty)}
                className="neon-button border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white px-4 py-2"
              >
                재대결 하기
              </button>
              <button
                onClick={handleResetGame}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded text-xs"
              >
                메인 화면으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 대형 멀리건 선택 모달 */}
      {state && ((state.phase === 'corp-mulligan' && state.gameMode === 'corp-human') || 
       (state.phase === 'runner-mulligan' && state.gameMode === 'runner-human')) && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-[12px] z-[30000] flex flex-col items-center justify-center p-6 select-none animate-tooltipFadeIn">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-4xl block mb-3 filter drop-shadow-md">🃏</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-widest text-cyan-400 uppercase">
              {state.phase === 'corp-mulligan' ? 'Corporation Mulligan' : 'Runner Mulligan'}
            </h2>
            <div className="text-[10px] text-slate-500 font-orbitron mt-1 uppercase tracking-wider">
              시작 손패 교정 단계 (Mulligan Phase)
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-4 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-900 shadow-inner">
              처음 받은 5장의 카드 중 **마음에 들지 않아 교체할 카드**들을 클릭하여 선택해 주세요.
              선택한 카드는 덱에 다시 섞이고 그 개수만큼 새로 드로우합니다. (각 플레이어당 1회 교체 가능)
            </p>
          </div>

          {/* 화살표 버튼 및 카드 배치 리스트 컨테이너 */}
          <div className="flex items-center gap-4 max-w-full my-4">
            {/* 왼쪽 화살표 */}
            <button 
              onClick={() => setFocusedMulliganIndex(prev => (prev > 0 ? prev - 1 : hand.length - 1))} 
              className="bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 p-3 rounded-xl cursor-pointer transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:scale-110 active:scale-90"
              title="이전 카드 (Left Arrow)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 카드 가로 배치 리스트 */}
            <div className="flex flex-wrap gap-5 justify-center items-center p-4 bg-slate-950/40 rounded-2xl border border-slate-900/60">
              {hand.map((card, idx) => {
                const isSelected = mulliganSelectedIds.has(card.id);
                const isFocused = idx === focusedMulliganIndex;
                const sideGlow = state.phase === 'corp-mulligan' ? 'corp' : 'runner';
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      setFocusedMulliganIndex(idx);
                      toggleMulliganSelect(card.id);
                    }}
                    className={`cursor-pointer transition-all transform duration-200 relative ${
                      isFocused ? 'scale-[1.05]' : 'opacity-80 hover:opacity-100'
                    } ${
                      isSelected ? 'filter drop-shadow-[0_0_15px_rgba(245,158,11,0.55)]' : ''
                    }`}
                  >
                    <div className={`rounded-xl transition-all duration-200 p-0.5 ${
                      isFocused ? 'bg-gradient-to-r from-cyan-400 to-amber-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-transparent'
                    }`}>
                      <CardComponent
                        card={card}
                        interactive={true}
                        onClick={() => {
                          setFocusedMulliganIndex(idx);
                          toggleMulliganSelect(card.id);
                        }}
                        isSelected={isSelected}
                        glowColor={isSelected ? sideGlow : null}
                        isMulligan={true}
                        forceFaceUp={true}
                        hasActiveSelection={true}
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-orbitron font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-md border border-slate-950 z-20 animate-pulse uppercase tracking-wider">
                        교체 (Replace)
                      </div>
                    )}
                    {isFocused && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 font-orbitron font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow border border-cyan-300 z-20 uppercase tracking-wider">
                        선택 대상
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 오른쪽 화살표 */}
            <button 
              onClick={() => setFocusedMulliganIndex(prev => (prev < hand.length - 1 ? prev + 1 : 0))} 
              className="bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 p-3 rounded-xl cursor-pointer transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:scale-110 active:scale-90"
              title="다음 카드 (Right Arrow)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="text-[10px] text-slate-400 font-orbitron mt-1 mb-4">
            ⌨️ 방향키(← / →): 이동 | Space / Enter: 교체 선택 | 마우스 클릭도 가능
          </div>

          {/* 푸터 조작 버튼 */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={() => handleMulligan(state.phase === 'corp-mulligan' ? 'Corp' : 'Runner', true)}
              disabled={mulliganSelectedIds.size === 0}
              className="bg-cyan-900 border border-cyan-400 text-white font-bold font-orbitron text-xs px-6 py-3 rounded-lg hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all uppercase tracking-wider shadow-lg disabled:shadow-none"
            >
              선택한 {mulliganSelectedIds.size}장 교체하고 시작 (Mulligan)
            </button>
            <button
              onClick={() => handleMulligan(state.phase === 'corp-mulligan' ? 'Corp' : 'Runner', false)}
              className="bg-slate-900 border border-slate-700 text-slate-300 font-bold font-orbitron text-xs px-6 py-3 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              교체 없이 그냥 시작 (Keep Hand)
            </button>
          </div>
        </div>
      )}


      {/* 디스카드 알림 배너 */}
      {(state.phase === 'corp-discard' || state.phase === 'runner-discard') && (
        <div className="glass-panel border-amber-500/50 bg-amber-950/20 p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-orbitron font-extrabold text-sm text-amber-400 uppercase tracking-widest">
                [DISCARD PHASE: 손패 한도 초과]
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                현재 손패 크기가 최대 한도(
                {state.phase === 'corp-discard' ? state.corp.maximumHandSize : state.runner.maximumHandSize}장
                )를 초과했습니다. 손패에서 버릴 카드를 클릭해 버려주세요. 
                (남은 손패: {state.phase === 'corp-discard' ? state.corp.hand.length : state.runner.hand.length}장)
              </p>
            </div>
          </div>
          <div className="text-[10px] font-orbitron font-bold text-amber-500 bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
            {state.phase === 'corp-discard' ? 'CORPORATION DISCARD' : 'RUNNER DISCARD'}
          </div>
        </div>
      )}

      {/* Tao Salonga ICE Swap Banner */}
      {state && state.phase === 'tao-swap-ice' && (
        <div className="glass-panel border-cyan-500/50 bg-cyan-950/20 p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔄</span>
            <div>
              <h3 className="font-orbitron font-extrabold text-sm text-cyan-400 uppercase tracking-widest">
                [TAO SALONGA: ICE 위치 교환]
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                아젠다가 득점/탈취되어 특수 능력이 발동했습니다. 보드에 설치된 ICE 중 서로 맞교환할 **2개의 ICE**를 차례로 클릭해 주세요.
                {state.taoSelectedIceId1 ? (
                  <span className="text-amber-400 font-bold block mt-1">
                    선택됨: {
                      (() => {
                        for (const sKey of Object.keys(state.servers)) {
                          const found = state.servers[sKey].ice.find(i => i.id === state.taoSelectedIceId1);
                          if (found) return `[${sKey} 서버]의 ${found.title}`;
                        }
                        return '';
                      })()
                    } (두 번째 ICE를 클릭하면 교환됩니다)
                  </span>
                ) : (
                  <span className="text-slate-400 block mt-1">첫 번째 ICE를 선택해 주세요.</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setState(prev => prev ? skipTaoSwap(prev) : null)}
            className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold font-orbitron text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
          >
            건너뛰기 (Skip)
          </button>
        </div>
      )}

      {/* Haas-Bioroid Precision Design Card Retrieval Modal */}
      {state && state.phase === 'hb-retrieve-card' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-[8px] z-[35000] flex flex-col items-center justify-center p-6 select-none animate-tooltipFadeIn">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-4xl block mb-3 filter drop-shadow-md">📥</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-widest text-rose-500 uppercase">
              Precision Design: Archives Retrieval
            </h2>
            <div className="text-[10px] text-slate-500 font-orbitron mt-1 uppercase tracking-wider">
              아카이브에서 손패로 카드 회수 단계
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-4 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-900 shadow-inner">
              아젠다 득점 효과로 아카이브(버려진 카드 더미)에 보관된 카드 중 **1장을 선택하여 손패(HQ)로 회수**할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 max-w-lg w-full max-h-[300px] overflow-y-auto bg-black/60 p-4 rounded-2xl border border-slate-900">
            {state.corp.discard.map((card, idx) => (
              <div key={card.id + '_' + idx} className="flex justify-between items-center text-xs font-mono py-2 px-3 border-b border-slate-800 hover:bg-rose-950/15 rounded-md transition-all">
                <div className="flex flex-col">
                  <span className="text-white font-bold">{card.title}</span>
                  <span className="text-[10px] text-slate-500">{card.type}</span>
                </div>
                <button
                  onClick={() => {
                    playInstallSFX();
                    setState(prev => prev ? retrieveCardFromArchives(prev, card.id) : null);
                  }}
                  className="bg-rose-900 hover:bg-rose-800 border border-rose-500 text-white font-bold font-orbitron text-[10px] px-3 py-1.5 rounded cursor-pointer transition-all"
                >
                  회수하기 (Retrieve)
                </button>
              </div>
            ))}
            {state.corp.discard.length === 0 && (
              <span className="text-slate-500 text-xs italic text-center py-4">아카이브가 비어 있습니다.</span>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setState(prev => prev ? skipHbRetrieve(prev) : null)}
              className="bg-slate-900 border border-slate-700 text-slate-300 font-bold font-orbitron text-xs px-6 py-3 rounded-lg hover:bg-slate-800 hover:text-white cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              회수 없이 종료 (Skip)
            </button>
          </div>
        </div>
      )}

      {/* Public Trail Choice Modal */}
      {state && state.phase === 'public-trail-choice' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-[8px] z-[35000] flex flex-col items-center justify-center p-6 select-none animate-tooltipFadeIn">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-4xl block mb-3 filter drop-shadow-md">📡</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-widest text-cyan-400 uppercase">
              Public Trail: Trace Threat
            </h2>
            <div className="text-[10px] text-slate-500 font-orbitron mt-1 uppercase tracking-wider">
              태그 회피 여부 선택 단계
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-4 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-900 shadow-inner">
              기업이 Public Trail을 사용했습니다. **8 [Credits]**를 지불하여 태그를 회피하시겠습니까, 아니면 태그 1개를 획득하시겠습니까?
            </p>
          </div>

          <div className="flex gap-4">
            <button
              disabled={state.runner.credits < 8}
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolvePublicTrailChoice(prev, true) : null);
              }}
              className="bg-cyan-950 hover:bg-cyan-900 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-500 text-cyan-400 font-bold font-orbitron text-xs px-6 py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              8 크레딧 지불 (Pay 8🪙)
            </button>
            <button
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolvePublicTrailChoice(prev, false) : null);
              }}
              className="bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-400 font-bold font-orbitron text-xs px-6 py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              태그 받기 (Take Tag 🏷️)
            </button>
          </div>
        </div>
      )}

      {/* Trace Corp Bidding Modal */}
      {state && state.phase === 'trace-corp-bid' && state.trace && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-[8px] z-[35000] flex flex-col items-center justify-center p-6 select-none animate-tooltipFadeIn">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-4xl block mb-3 filter drop-shadow-md">📡</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-widest text-cyan-400 uppercase">
              Trace Bidding (Corp)
            </h2>
            <div className="text-[10px] text-slate-500 font-orbitron mt-1 uppercase tracking-wider">
              기업 트레이스 추가 크레딧 베팅
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-4 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-900 shadow-inner">
              트레이스 기본 강도: <strong>{state.trace.base}</strong>. 크레딧을 추가로 지불하여 트레이스 세기를 높이십시오.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center gap-4 min-w-[320px]">
            <div className="text-xs font-orbitron text-slate-400">
              가용 크레딧: <span className="text-amber-400 font-bold">{state.corp.credits}🪙</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setTraceBidValue(prev => Math.max(0, prev - 1))}
                className="bg-slate-950 text-white font-bold p-3 rounded-lg border border-slate-800 hover:bg-slate-800 cursor-pointer"
              >
                -1
              </button>
              <span className="text-3xl font-orbitron font-extrabold text-cyan-400 w-16 text-center">
                {traceBidValue}
              </span>
              <button 
                onClick={() => setTraceBidValue(prev => Math.min(state.corp.credits, prev + 1))}
                className="bg-slate-950 text-white font-bold p-3 rounded-lg border border-slate-800 hover:bg-slate-800 cursor-pointer"
              >
                +1
              </button>
            </div>
            <input 
              type="range" 
              min="0" 
              max={state.corp.credits} 
              value={traceBidValue} 
              onChange={(e) => setTraceBidValue(parseInt(e.target.value) || 0)}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            
            <div className="text-sm font-orbitron text-slate-300 mt-2">
              최종 Trace 세기: <strong className="text-amber-400">{state.trace.base + traceBidValue}</strong>
            </div>

            <button
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolveTraceCorpBid(prev, traceBidValue) : null);
                setTraceBidValue(0);
              }}
              className="w-full mt-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 font-bold font-orbitron text-xs py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
            >
              베팅 완료 (Bid {traceBidValue}🪙)
            </button>
          </div>
        </div>
      )}

      {/* Trace Runner Bidding Modal */}
      {state && state.phase === 'trace-runner-bid' && state.trace && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-[8px] z-[35000] flex flex-col items-center justify-center p-6 select-none animate-tooltipFadeIn">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-4xl block mb-3 filter drop-shadow-md">📡</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-widest text-cyan-400 uppercase">
              Trace Bidding (Runner)
            </h2>
            <div className="text-[10px] text-slate-500 font-orbitron mt-1 uppercase tracking-wider">
              러너 트레이스 해제 대항 베팅
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-4 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-900 shadow-inner">
              기업의 최종 Trace 세기: <strong className="text-rose-500">{state.trace.base + (state.trace.corpBid || 0)}</strong><br />
              현재 러너 Link: <strong>0</strong>. 크레딧을 지불하여 최종 Link 세기를 트레이스 세기보다 같거나 높여야 태그를 방지할 수 있습니다.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center gap-4 min-w-[320px]">
            <div className="text-xs font-orbitron text-slate-400">
              가용 크레딧: <span className="text-amber-400 font-bold">{state.runner.credits}🪙</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setTraceBidValue(prev => Math.max(0, prev - 1))}
                className="bg-slate-950 text-white font-bold p-3 rounded-lg border border-slate-800 hover:bg-slate-800 cursor-pointer"
              >
                -1
              </button>
              <span className="text-3xl font-orbitron font-extrabold text-cyan-400 w-16 text-center">
                {traceBidValue}
              </span>
              <button 
                onClick={() => setTraceBidValue(prev => Math.min(state.runner.credits, prev + 1))}
                className="bg-slate-950 text-white font-bold p-3 rounded-lg border border-slate-800 hover:bg-slate-800 cursor-pointer"
              >
                +1
              </button>
            </div>
            <input 
              type="range" 
              min="0" 
              max={state.runner.credits} 
              value={traceBidValue} 
              onChange={(e) => setTraceBidValue(parseInt(e.target.value) || 0)}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            
            <div className="text-sm font-orbitron text-slate-300 mt-2 flex items-center gap-2">
              최종 Link 세기: <strong className="text-cyan-400">{traceBidValue}</strong>
              <span>vs</span>
              Trace 세기: <strong className="text-rose-500">{state.trace.base + (state.trace.corpBid || 0)}</strong>
            </div>

            <div className="mt-2 text-xs font-orbitron">
              {traceBidValue >= (state.trace.base + (state.trace.corpBid || 0)) ? (
                <span className="text-emerald-400 font-extrabold px-3 py-1 bg-emerald-950/40 rounded border border-emerald-500 animate-pulse">
                  ✓ 태그 방지 성공 (Avoided)
                </span>
              ) : (
                <span className="text-rose-400 font-extrabold px-3 py-1 bg-rose-950/40 rounded border border-rose-500 animate-pulse">
                  ✗ 태그 획득 예정 (Tag Acquired)
                </span>
              )}
            </div>

            <button
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolveTraceRunnerBid(prev, traceBidValue) : null);
                setTraceBidValue(0);
              }}
              className="w-full mt-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 font-bold font-orbitron text-xs py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
            >
              베팅 완료 (Bid {traceBidValue}🪙)
            </button>
          </div>
        </div>
      )}

      {/* Wildcat Strike Choice Modal */}
      {state && state.phase === 'wildcat-strike-choice' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-[8px] z-[35000] flex flex-col items-center justify-center p-6 select-none animate-tooltipFadeIn">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-4xl block mb-3 filter drop-shadow-md">💥</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-widest text-rose-500 uppercase">
              Wildcat Strike: Corp Decision
            </h2>
            <div className="text-[10px] text-slate-500 font-orbitron mt-1 uppercase tracking-wider">
              러너 이벤트에 대한 기업의 대처 선택
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-4 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-900 shadow-inner">
              러너가 Wildcat Strike를 플레이했습니다. 기업의 선택에 따라 러너는 **6 [Credits]**를 얻거나 **카드 4장**을 드로우하게 됩니다.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolveWildcatStrikeChoice(prev, 'credits') : null);
              }}
              className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-400 font-bold font-orbitron text-xs px-6 py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              6 크레딧 주기 (Give 6🪙)
            </button>
            <button
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolveWildcatStrikeChoice(prev, 'draw') : null);
              }}
              className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 font-bold font-orbitron text-xs px-6 py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              4장 드로우 허용 (Allow 4 Draws 🎴)
            </button>
          </div>
        </div>
      )}

      {/* NBN Reality Plus Choice Modal */}
      {state && state.phase === 'nbn-reality-plus-choice' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-[8px] z-[35000] flex flex-col items-center justify-center p-6 select-none animate-tooltipFadeIn">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-4xl block mb-3 filter drop-shadow-md">👁️‍🗨️</span>
            <h2 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-widest text-amber-500 uppercase">
              NBN: Reality Plus Trigger
            </h2>
            <div className="text-[10px] text-slate-500 font-orbitron mt-1 uppercase tracking-wider">
              아이덴티티 격발 효과 선택
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-4 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-900 shadow-inner">
              러너가 태그를 획득했습니다. 아이덴티티 특수 능력으로 **2 [Credits]**를 얻거나 **카드 2장**을 드로우하십시오.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolveNbnRealityPlusChoice(prev, 'credits') : null);
              }}
              className="bg-amber-950 hover:bg-amber-900 border border-amber-500 text-amber-400 font-bold font-orbitron text-xs px-6 py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              2 크레딧 획득 (+2🪙)
            </button>
            <button
              onClick={() => {
                playInstallSFX();
                setState(prev => prev ? resolveNbnRealityPlusChoice(prev, 'draw') : null);
              }}
              className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 font-bold font-orbitron text-xs px-6 py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider shadow-lg"
            >
              카드 2장 드로우 (Draw 2)
            </button>
          </div>
        </div>
      )}

      {/* 본문 레이아웃: 메인 보드와 우측 정보 영역 */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        
        {/* 왼쪽 게임보드 (70%) */}
        <section className="lg:col-span-7 w-full">
          <Board
            state={state}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            onEndRunnerTurn={handleEndRunnerTurn}
            onEndCorpTurn={handleEndCorpTurn}
            onBasicAction={handleBasicAction}
            onInitiateRun={handleInitiateRun}
            onAIAction={handleAIAction}
            onReset={handleResetGame}
            mulliganSelectedIds={mulliganSelectedIds}
          />
        </section>

        {/* 오른쪽 정보 컨트롤 영역 (30%) */}
        <section className="lg:col-span-3 flex flex-col gap-4 w-full h-full lg:max-h-[820px]">
          
          {/* 오른쪽 탭 헤더 */}
          <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-900 text-xs font-orbitron">
            <button
              onClick={() => setRightPanelTab('logs')}
              className={`flex-1 py-1.5 rounded transition-all font-bold ${rightPanelTab === 'logs' ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-900/30' : 'text-slate-400 hover:text-white'}`}
            >
              로그 (LOGS)
            </button>
            <button
              onClick={() => setRightPanelTab('qa')}
              className={`flex-1 py-1.5 rounded transition-all font-bold ${rightPanelTab === 'qa' ? 'bg-purple-950/80 text-purple-400 border border-purple-900/30' : 'text-slate-400 hover:text-white'}`}
            >
              QA 봇 (SIM)
            </button>
            <button
              onClick={() => setRightPanelTab('help')}
              className={`flex-1 py-1.5 rounded transition-all font-bold ${rightPanelTab === 'help' ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'text-slate-400 hover:text-white'}`}
            >
              규칙 (HELP)
            </button>
          </div>

          {/* 오른쪽 탭 콘텐츠 */}
          <div className="flex-1 min-h-[350px]">
            {rightPanelTab === 'logs' && <LogPanel logs={state.logs} />}
            {rightPanelTab === 'qa' && <QAPanel />}
            {rightPanelTab === 'help' && <HelpPanel />}
          </div>

        </section>
      </main>

      {/* 정중앙 고정형 액션 모달 */}
      {(() => {
        if (!state || !selectedCardId) return null;

        // selectedCard 객체 찾기
        let selectedCard: Card | null = null;
        let cardLocation: 'corp-hand' | 'runner-hand' | 'corp-field-ice' | 'corp-field-root' | 'runner-rig' | null = null;

        let card = state.corp.hand.find(c => c.id === selectedCardId);
        if (card) {
          selectedCard = card;
          cardLocation = 'corp-hand';
        }
        if (!selectedCard) {
          card = state.runner.hand.find(c => c.id === selectedCardId);
          if (card) {
            selectedCard = card;
            cardLocation = 'runner-hand';
          }
        }
        if (!selectedCard) {
          for (const serverKey of Object.keys(state.servers)) {
            const server = state.servers[serverKey];
            card = server.ice.find(c => c.id === selectedCardId);
            if (card) {
              selectedCard = card;
              cardLocation = 'corp-field-ice';
              break;
            }
          }
        }
        if (!selectedCard) {
          for (const serverKey of Object.keys(state.servers)) {
            const server = state.servers[serverKey];
            card = server.root.find(c => c.id === selectedCardId);
            if (card) {
              selectedCard = card;
              cardLocation = 'corp-field-root';
              break;
            }
          }
        }
        if (!selectedCard) {
          card = state.runner.rig.find(c => c.id === selectedCardId);
          if (card) {
            selectedCard = card;
            cardLocation = 'runner-rig';
          }
        }
        
        if (!selectedCard && state.corp.identity && state.corp.identity.id === selectedCardId) {
          selectedCard = state.corp.identity;
          cardLocation = null;
        }
        if (!selectedCard && state.runner.identity && state.runner.identity.id === selectedCardId) {
          selectedCard = state.runner.identity;
          cardLocation = null;
        }

        if (!selectedCard) return null;

        // 설치 가능한 서버 목록 가져오기
        const getInstallableServers = (c: Card): string[] => {
          if (c.type === 'ICE') {
            return ['HQ', 'RD', 'Archives', 'New Remote', ...Object.keys(state.servers).filter(s => s.startsWith('Remote'))];
          }
          if (c.type === 'Asset' || c.type === 'Agenda') {
            return ['New Remote', ...Object.keys(state.servers).filter(s => s.startsWith('Remote'))];
          }
          if (c.type === 'Upgrade') {
            return ['HQ', 'RD', 'Archives', 'New Remote', ...Object.keys(state.servers).filter(s => s.startsWith('Remote'))];
          }
          return [];
        };

        const formatText = (text: string) => {
          return text
            .replace(/\[Click\]/g, '⚡')
            .replace(/\[Credits\]/g, '🪙')
            .replace(/\[Credit\]/g, '🪙')
            .replace(/\[Memory Unit\]/g, '🧠')
            .replace(/\[Memory Units\]/g, '🧠');
        };

        const isCorpActive = state.activePlayer === 'Corp';
        const isRunnerActive = state.activePlayer === 'Runner';
        const isCorpPlayerHuman = state.gameMode === 'corp-human';
        const isRunnerPlayerHuman = state.gameMode === 'runner-human';
        
        const isUserTurn = 
          (isCorpActive && isCorpPlayerHuman && state.phase === 'corp-action') ||
          (isRunnerActive && isRunnerPlayerHuman && state.phase === 'runner-action');

        const useImage = selectedCard.imageUrl;

        return (
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[40000] flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setSelectedCardId(null)}
          >
            <div 
              className={`glass-panel border-2 rounded-2xl p-6 flex flex-col md:flex-row gap-6 max-w-[90vw] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.95)] animate-tooltipFadeIn pointer-events-auto ${
                selectedCard.side === 'Runner' 
                  ? 'border-cyan-500/60 shadow-[0_0_40px_rgba(0,240,255,0.25)] bg-[#0c1424]/98' 
                  : selectedCard.type === 'Agenda'
                    ? 'border-emerald-500/60 shadow-[0_0_40px_rgba(57,255,20,0.25)] bg-[#071a11]/98'
                    : 'border-rose-500/60 shadow-[0_0_40px_rgba(255,0,85,0.25)] bg-[#1a0812]/98'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 좌측: 고해상도 카드 그래픽 */}
              {useImage ? (
                <div className="w-full md:w-[320px] lg:w-[350px] shrink-0 flex items-center justify-center">
                  <img 
                    src={selectedCard.imageUrl!.replace('/medium/', '/large/')} 
                    alt={selectedCard.title} 
                    className="w-full h-auto object-contain rounded-xl border border-slate-700 shadow-2xl"
                  />
                </div>
              ) : (
                <div className={`w-full md:w-[320px] lg:w-[350px] aspect-[1/1.4] shrink-0 flex flex-col justify-between p-6 border rounded-xl shadow-2xl bg-slate-900 border-slate-700`}>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold font-orbitron text-white">{selectedCard.title}</h3>
                    <span className="text-lg font-orbitron font-extrabold text-amber-400">
                      {selectedCard.type === 'Agenda' ? `${selectedCard.advancementCost}/${selectedCard.agendaPoints}P` : `${selectedCard.cost}🪙`}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center my-4">
                    <div className="text-xs font-orbitron text-slate-400 mb-1">
                      {selectedCard.type} {selectedCard.subTypes.length > 0 ? `• ${selectedCard.subTypes.join(' • ')}` : ''}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-line">
                      {selectedCard.text}
                    </p>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-800 pt-2">
                    <span className="text-xs text-slate-400 font-orbitron">Netrunner Core</span>
                    {selectedCard.strength !== undefined && (
                      <span className="text-sm font-orbitron font-extrabold text-cyan-400">STR: {selectedCard.strength}</span>
                    )}
                  </div>
                </div>
              )}

              {/* 우측: 디테일한 설명 및 사용 버튼들 */}
              <div className="flex-1 flex flex-col justify-between min-w-[300px]">
                <div>
                  <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-start">
                    <div>
                      <div className="text-3xl font-extrabold text-white font-orbitron tracking-wider">{selectedCard.title}</div>
                      <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest font-orbitron">
                        {selectedCard.type} {selectedCard.subTypes.length > 0 ? `• ${selectedCard.subTypes.join(' • ')}` : ''}
                      </div>
                    </div>
                    {/* 카운터가 놓인 상태 정보가 있다면 간소화 노출 */}
                    {!selectedCard.rezzed && selectedCard.side === 'Corp' && selectedCard.type !== 'Identity' && (
                      <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-rose-500 font-orbitron font-bold">
                        미공개 (비레즈)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 bg-black/40 p-3 rounded-lg border border-slate-900 text-xs">
                    <div>
                      <span className="text-slate-500 font-orbitron block">COST / VALUE:</span>
                      <span className="text-sm font-orbitron font-extrabold text-amber-400 font-mono">
                        {selectedCard.type === 'Agenda' 
                          ? `요구 발전: ${selectedCard.advancementCost} / 점수: ${selectedCard.agendaPoints}P` 
                          : `비용: ${selectedCard.cost}🪙`}
                      </span>
                    </div>
                    {selectedCard.strength !== undefined && (
                      <div>
                        <span className="text-slate-500 font-orbitron block">STRENGTH:</span>
                        <span className="text-sm font-orbitron font-extrabold text-cyan-400 font-mono">{selectedCard.strength}</span>
                      </div>
                    )}
                    {selectedCard.memoryCost !== undefined && (
                      <div>
                        <span className="text-slate-500 font-orbitron block">MEMORY COST:</span>
                        <span className="text-sm font-orbitron font-extrabold text-purple-400 font-mono">{selectedCard.memoryCost}🧠</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 font-orbitron block">SIDE / FACTION:</span>
                      <span className={`text-sm font-orbitron font-extrabold ${selectedCard.side === 'Runner' ? 'text-cyan-400' : 'text-rose-500'}`}>
                        {selectedCard.side === 'Runner' ? 'RUNNER (러너)' : 'CORP (기업)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-line font-light bg-black/20 p-4 rounded-lg border border-slate-900/50 mb-4 min-h-[100px]">
                    {formatText(selectedCard.text)}
                  </div>

                  {selectedCard.type === 'ICE' && selectedCard.subroutines && (
                    <div className="flex flex-col gap-2 mt-2 mb-4 bg-rose-950/10 p-3 rounded-lg border border-rose-900/30">
                      <div className="text-xs uppercase font-orbitron font-extrabold tracking-wider text-rose-500">
                        🛡️ SECURITY SUBROUTINES:
                      </div>
                      {selectedCard.subroutines.map((sub: Subroutine, idx: number) => (
                        <div key={sub.id} className="text-xs bg-slate-950/60 p-2 border-l-3 border-rose-500 rounded-sm font-light text-slate-300 flex items-start gap-2">
                          <span className="text-rose-500 font-orbitron font-bold">↳ [{idx + 1}]</span>
                          <span>{sub.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active tokens summary */}
                  {(selectedCard.advancedCounters > 0 || selectedCard.hostedCredits > 0 || selectedCard.hostedCounters > 0) && (
                    <div className="flex flex-wrap gap-2.5 mt-2 mb-4 text-xs font-orbitron font-semibold">
                      {selectedCard.advancedCounters > 0 && <span className="text-red-400 bg-red-950/30 px-2.5 py-1 rounded border border-red-900/50">발전 카운터: {selectedCard.advancedCounters}</span>}
                      {selectedCard.hostedCredits > 0 && <span className="text-amber-400 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/50">호스팅 크레딧: {selectedCard.hostedCredits}🪙</span>}
                      {selectedCard.hostedCounters > 0 && <span className="text-cyan-400 bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-900/50">파워 카운터: {selectedCard.hostedCounters}</span>}
                    </div>
                  )}
                </div>

                {/* 하단 조작 패널 */}
                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-orbitron text-amber-500 font-bold block">
                      🕹️ AVAILABLE ACTIONS (사용 가능한 행동):
                    </span>
                    
                    <div className="flex flex-wrap gap-2.5">
                      {(() => {
                        const isMulliganPhase = state.phase === 'corp-mulligan' || state.phase === 'runner-mulligan';
                        if (isMulliganPhase) {
                          const isSelectedForMulligan = mulliganSelectedIds.has(selectedCard!.id);
                          return (
                            <div className="flex gap-2">
                              {isSelectedForMulligan ? (
                                <button
                                  onClick={() => {
                                    setMulliganSelectedIds(prev => {
                                      const next = new Set(prev);
                                      next.delete(selectedCard!.id);
                                      return next;
                                    });
                                    setSelectedCardId(null);
                                  }}
                                  className="bg-amber-600 hover:bg-amber-500 border border-amber-400 text-black font-bold font-orbitron text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                                >
                                  교체 대상에서 제외 (Keep)
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setMulliganSelectedIds(prev => {
                                      const next = new Set(prev);
                                      next.add(selectedCard!.id);
                                      return next;
                                    });
                                    setSelectedCardId(null);
                                  }}
                                  className="bg-red-700 hover:bg-red-600 border border-red-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg cursor-pointer transition-all animate-pulse"
                                >
                                  교체 대상으로 지정 (Replace)
                                </button>
                              )}
                            </div>
                          );
                        }

                        // 1. 기업 손패의 카드 조작
                        if (cardLocation === 'corp-hand') {
                          if (state.phase === 'corp-discard') {
                            if (!isCorpPlayerHuman) return <span className="text-slate-500 text-xs italic">기업 전용 액션입니다.</span>;
                            return (
                              <button
                                onClick={() => {
                                  handleDiscard(selectedCard!.id);
                                  setSelectedCardId(null);
                                }}
                                className="bg-amber-700 hover:bg-amber-600 border border-amber-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg cursor-pointer transition-all animate-pulse"
                              >
                                아카이브로 버리기 (Discard)
                              </button>
                            );
                          }

                          if (!isUserTurn) return <span className="text-slate-500 text-xs italic">자신의 행동 차례가 아닙니다.</span>;
                          
                          if (selectedCard.type === 'Operation') {
                            const canPlay = state.corp.credits >= selectedCard.cost && state.corp.clicks >= 1;
                            return (
                              <button
                                onClick={() => handlePlay(selectedCard!.id)}
                                disabled={!canPlay}
                                className="bg-rose-900 hover:bg-rose-800 border border-rose-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                작전 실행 (비용: {selectedCard.cost}🪙, 1⚡ 소모)
                              </button>
                            );
                          } else {
                            const servers = getInstallableServers(selectedCard);
                            return (
                              <div className="flex flex-col gap-2 w-full">
                                <span className="text-[10px] text-slate-400">설치할 서버를 선택하세요 (1⚡ 소모):</span>
                                <div className="flex flex-wrap gap-2">
                                  {servers.map(sName => {
                                    let addCost = 0;
                                    if (selectedCard!.type === 'ICE' && state.servers[sName]) {
                                      addCost = state.servers[sName].ice.length;
                                    }
                                    const canInstall = state.corp.clicks >= 1 && state.corp.credits >= addCost;
                                    return (
                                      <button
                                        key={sName}
                                        onClick={() => handleInstall(selectedCard!.id, sName)}
                                        disabled={!canInstall}
                                        className="bg-slate-900 border border-rose-850 hover:bg-rose-950 text-white font-bold font-orbitron text-xs px-3 py-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                      >
                                        {sName === 'New Remote' ? '+ 새 원격지' : sName} {addCost > 0 ? `(${addCost}🪙)` : ''}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                        }

                        // 2. 러너 손패의 카드 조작
                        if (cardLocation === 'runner-hand') {
                          if (state.phase === 'runner-discard') {
                            if (!isRunnerPlayerHuman) return <span className="text-slate-500 text-xs italic">러너 전용 액션입니다.</span>;
                            return (
                              <button
                                onClick={() => {
                                  handleDiscard(selectedCard!.id);
                                  setSelectedCardId(null);
                                }}
                                className="bg-amber-700 hover:bg-amber-600 border border-amber-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg cursor-pointer transition-all animate-pulse"
                              >
                                힙으로 버리기 (Discard)
                              </button>
                            );
                          }

                          if (!isUserTurn) return <span className="text-slate-500 text-xs italic">자신의 행동 차례가 아닙니다.</span>;

                          if (selectedCard.type === 'Event') {
                            const isRunEvent = ['overclock', 'jailbreak', 'tread_lightly'].includes(selectedCard.codeName);
                            const canPlay = state.runner.credits >= selectedCard.cost && state.runner.clicks >= 1;
                            
                            if (isRunEvent) {
                              // Jailbreak는 중앙 서버(HQ, RD, Archives)만 타겟팅 가능
                              // Overclock, Tread Lightly는 모든 서버 타겟팅 가능
                              const isJailbreak = selectedCard.codeName === 'jailbreak';
                              const servers = Object.keys(state.servers);
                              const availableServers = isJailbreak 
                                ? servers.filter(sName => ['HQ', 'RD', 'Archives'].includes(sName))
                                : servers;

                              return (
                                <div className="flex flex-col gap-2 w-full">
                                  <span className="text-[10px] text-slate-400">
                                    런을 실행할 대상 서버를 선택하세요 (비용: {selectedCard.cost}🪙, 1⚡ 소모):
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {availableServers.map(sName => {
                                      const displayServerName = sName === 'RD' ? 'R&D' : sName;
                                      return (
                                        <button
                                          key={sName}
                                          onClick={() => {
                                            handlePlayRunEventCard(selectedCard!.id, sName);
                                          }}
                                          disabled={!canPlay}
                                          className="bg-slate-900 border border-cyan-850 hover:bg-cyan-950 text-white font-bold font-orbitron text-xs px-3 py-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                        >
                                          {displayServerName} 런 개시
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={() => handlePlay(selectedCard!.id)}
                                disabled={!canPlay}
                                className="bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                이벤트 플레이 (비용: {selectedCard.cost}🪙, 1⚡ 소모)
                              </button>
                            );
                          } else {
                            let memoryLimitPassed = true;
                             if (selectedCard.type === 'Program') {
                               const reqMU = selectedCard.memoryCost || 0;
                               const limit = state.runner.memoryLimit;
                               const currentMU = state.runner.rig.reduce((sum, c) => sum + (c.memoryCost || 0), 0);
                               if (currentMU + reqMU > limit) {
                                 memoryLimitPassed = false;
                               }
                             }

                            let finalCost = selectedCard.cost;
                            if (selectedCard.codeName === 'carmen') {
                              if (state.runner.successfulRunThisTurn) {
                                finalCost = 3;
                              }
                            }

                            const canInstall = state.runner.credits >= finalCost && state.runner.clicks >= 1 && memoryLimitPassed;
                            const isTrojan = ['botulus', 'tranquilizer', 'leech'].includes(selectedCard.codeName);
                            if (isTrojan) {
                              const allIce: { ice: Card, serverName: string }[] = [];
                              Object.keys(state.servers).forEach(serverKey => {
                                state.servers[serverKey].ice.forEach(ice => {
                                  allIce.push({ ice, serverName: serverKey });
                                });
                              });

                              if (allIce.length === 0) {
                                return (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-rose-500 block italic">설치할 대상 ICE가 존재하지 않습니다.</span>
                                    <button
                                      onClick={() => handleInstall(selectedCard!.id, '')}
                                      disabled={!canInstall}
                                      className="bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    >
                                      대상 없이 임시 장착 (비용: {finalCost}🪙, 1⚡ 소모)
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-orbitron uppercase">호스트할 대상 ICE 선택:</span>
                                  {allIce.map(({ ice, serverName }) => {
                                    return (
                                      <button
                                        key={ice.id}
                                        onClick={() => handleInstall(selectedCard!.id, ice.id)}
                                        disabled={!canInstall}
                                        className="bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-700/60 text-cyan-300 font-bold font-orbitron text-[10px] px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all text-left"
                                      >
                                        [{serverName}] {ice.title} ({ice.rezzed ? 'Rez' : 'Unrez'})에 장착
                                      </button>
                                    );
                                  })}
                                  {!memoryLimitPassed && <span className="text-[10px] text-red-500 block">메모리 용량 부족 (MU 초과)</span>}
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => handleInstall(selectedCard!.id, '')}
                                  disabled={!canInstall}
                                  className="bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                                >
                                  리그 장착 (비용: {finalCost}🪙, 1⚡ 소모)
                                </button>
                                {!memoryLimitPassed && <span className="text-[10px] text-red-500 block">메모리 용량 부족 (MU 초과)</span>}
                              </div>
                            );
                          }
                        }

                        // 3. 기업 필드 ICE 조작 (Rez)
                        if (cardLocation === 'corp-field-ice') {
                          const isApproachPhase = state.run !== null && state.run.phase === 'approach';
                          const isCorpRezTurn = (isCorpActive && state.phase === 'corp-action') || isApproachPhase;
                          
                          if (!selectedCard.rezzed) {
                            if (!isCorpPlayerHuman) return <span className="text-slate-500 text-xs italic">기업 전용 액션입니다.</span>;
                            if (!isCorpRezTurn) return <span className="text-slate-500 text-xs italic">현재 Rez 기회가 아닙니다.</span>;
                            
                            let cost = selectedCard.cost;
                            if (state.run && state.logs.some(l => l.sender === 'Runner' && l.message.includes('Tread Lightly'))) {
                              cost += 3;
                            }

                            const canRez = state.corp.credits >= cost;
                            return (
                              <button
                                onClick={() => {
                                  handleRez(selectedCard!.id);
                                  setSelectedCardId(null);
                                }}
                                disabled={!canRez}
                                className="bg-rose-900 hover:bg-rose-800 border border-rose-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                ICE 레즈 (Rez) (비용: {cost}🪙)
                              </button>
                            );
                          } else {
                            return <span className="text-emerald-500 text-xs font-semibold">이미 Rez(활성화) 상태인 방어선 카드입니다.</span>;
                          }
                        }

                        // 4. 기업 필드 Root 조작 (Rez / Advance / Score)
                        if (cardLocation === 'corp-field-root') {
                          if (!isCorpPlayerHuman) return <span className="text-slate-500 text-xs italic">기업 전용 액션입니다.</span>;
                          
                          const actions = [];
                          
                          if (!selectedCard.rezzed && selectedCard.type !== 'Agenda') {
                            const canRez = state.corp.credits >= selectedCard.cost;
                            actions.push(
                              <button
                                key="rez"
                                onClick={() => {
                                  handleRez(selectedCard!.id);
                                  setSelectedCardId(null);
                                }}
                                disabled={!canRez}
                                className="bg-rose-900 hover:bg-rose-800 border border-rose-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                자산 레즈 (Rez) (비용: {selectedCard.cost}🪙)
                              </button>
                            );
                          }

                          if (isUserTurn && (selectedCard.type === 'Agenda' || selectedCard.codeName === 'urtica_cipher')) {
                            const canAdvance = state.corp.credits >= 1 && state.corp.clicks >= 1;
                            actions.push(
                              <button
                                key="advance"
                                onClick={() => handleAdvance(selectedCard!.id)}
                                disabled={!canAdvance}
                                className="bg-amber-900 hover:bg-amber-800 border border-amber-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                카드 발전 (1🪙, 1⚡ 소모)
                              </button>
                            );

                            if (selectedCard.type === 'Agenda') {
                              const required = selectedCard.advancementCost || 3;
                              if (selectedCard.advancedCounters >= required) {
                                actions.push(
                                  <button
                                    key="score"
                                    onClick={() => {
                                      handleScore(selectedCard!.id);
                                      setSelectedCardId(null);
                                    }}
                                    className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                                  >
                                    의제 득점 (Score Agenda)
                                  </button>
                                );
                              }
                            }
                          }
                          
                          if (actions.length === 0) {
                            return <span className="text-slate-500 text-xs italic">현재 이 카드에 취할 수 있는 기업 액션이 없습니다.</span>;
                          }
                          return <div className="flex gap-2">{actions}</div>;
                        }

                        // 5. 러너 리그 리소스/프로그램 조작
                        if (cardLocation === 'runner-rig') {
                          if (!isRunnerPlayerHuman) return <span className="text-slate-500 text-xs italic">러너 전용 액션입니다.</span>;
                          
                          if (
                            (selectedCard.codeName === 'telework_contract' && selectedCard.hostedCredits > 0) ||
                            selectedCard.codeName === 'smartware_distributor'
                          ) {
                            const canRelease = state.runner.clicks >= 1;
                            const btnText = selectedCard.codeName === 'telework_contract' ? '업무 수익금 수령 (3🪙 획득)' : '크레딧 충전 (+3🪙)';
                            return (
                              <button
                                onClick={() => handleResourceClick(selectedCard!.id)}
                                disabled={!canRelease}
                                className="bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                릴리즈 (1⚡ 소모) - {btnText}
                              </button>
                            );
                          }
                          
                          if (selectedCard.codeName === 'pennyshaver') {
                            const canCollect = state.runner.clicks >= 1 && selectedCard.hostedCredits > 0;
                            return (
                              <button
                                onClick={() => handleTakePennyshaverCredits(selectedCard!.id)}
                                disabled={!canCollect}
                                className="bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-white font-bold font-orbitron text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                              >
                                크레딧 수령 (1⚡ 소모) - {selectedCard.hostedCredits}🪙 가져오기
                              </button>
                            );
                          }

                          if (selectedCard.codeName === 'red_team') {
                            if (!isUserTurn) return <span className="text-slate-500 text-xs italic">자신의 행동 차례가 아닙니다.</span>;
                            if (selectedCard.hostedCredits <= 0) return <span className="text-slate-500 text-xs italic">크레딧 잔량이 없습니다.</span>;
                            
                            const runnerTurnStartIdx = state.logs.map(l => l.message).lastIndexOf(`Turn ${state.turn}: Runner의 차례입니다.`);
                            const activeLogs = runnerTurnStartIdx !== -1 ? state.logs.slice(runnerTurnStartIdx) : state.logs;
                            
                            const runTargetsThisTurn = activeLogs
                              .filter(l => l.message.includes("런을 개시했습니다!"))
                              .map(l => {
                                if (l.message.includes("HQ")) return "HQ";
                                if (l.message.includes("R&D") || l.message.includes("RD")) return "RD";
                                if (l.message.includes("Archives")) return "Archives";
                                return "";
                              })
                              .filter(t => t !== "") as string[];

                            const centralServers: string[] = ['HQ', 'RD', 'Archives'];
                            const availableCentrals = centralServers.filter(s => !runTargetsThisTurn.includes(s));
                            
                            if (availableCentrals.length === 0) {
                              return <span className="text-red-500 text-xs font-semibold">이번 턴에 모든 중앙 서버를 해킹하여 남은 타겟이 없습니다.</span>;
                            }

                            return (
                              <div className="flex flex-col gap-2 w-full">
                                <span className="text-[10px] text-slate-400">중앙 서버 해킹 선택 (1⚡ 소모, 성공 시 3🪙 수령):</span>
                                <div className="flex flex-wrap gap-2">
                                  {availableCentrals.map(targetName => {
                                    const displayServerName = targetName === 'RD' ? 'R&D' : targetName;
                                    return (
                                      <button
                                        key={targetName}
                                        onClick={() => handleInitiateRun(targetName, 'red_team')}
                                        className="bg-slate-900 border border-cyan-850 hover:bg-cyan-950 text-white font-bold font-orbitron text-xs px-3 py-1.5 rounded transition-all cursor-pointer"
                                      >
                                        {displayServerName} 해킹 런 개시
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          return <span className="text-slate-500 text-xs italic">특별한 활성 능력이 없는 설치 카드입니다.</span>;
                        }

                        if (selectedCard.type === 'Identity') {
                          const isMyIdentity = 
                            (state.gameMode === 'runner-human' && selectedCard.side === 'Runner') ||
                            (state.gameMode === 'corp-human' && selectedCard.side === 'Corp');

                          if (isMyIdentity) {
                            const deckCards = selectedCard.side === 'Runner' ? state.runner.deck : state.corp.deck;
                            const counts = deckCards.reduce((acc, card) => {
                              acc[card.title] = (acc[card.title] || 0) + 1;
                              return acc;
                            }, {} as { [title: string]: number });
                            const sortedTitles = Object.keys(counts).sort();

                            return (
                              <div className="flex flex-col gap-2 w-full">
                                <span className="text-xs font-orbitron text-amber-500 font-bold block">
                                  🗂️ REMAINING DECK LIST (덱 잔여 목록 - 총 {deckCards.length}장):
                                </span>
                                {deckCards.length === 0 ? (
                                  <span className="text-slate-500 text-xs italic">남은 카드가 없습니다.</span>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 max-h-[160px] overflow-y-auto pr-1 bg-black/40 p-3 rounded-lg border border-slate-900 font-mono text-xs">
                                    {sortedTitles.map(title => (
                                      <div key={title} className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-800/40">
                                        <span className="truncate">{title}</span>
                                        <span className="text-cyan-400 font-bold ml-2">x{counts[title]}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            return <span className="text-slate-500 text-xs italic">상대방의 아이덴티티 카드입니다. 덱 목록을 볼 수 없습니다.</span>;
                          }
                        }

                        return null;
                      })()}

                      <button
                        onClick={() => setSelectedCardId(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        모달 닫기
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-orbitron border-t border-slate-900 pt-3 mt-4 text-right">
                  SYSTEM GATEWAY • SELECTED CARD INTERACTION CONSOLE
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cyberpunk Interactive Overlay Effect */}
      {activeEffect && (
        <div className={`effect-container type-${activeEffect.type} fixed inset-0 z-50 pointer-events-none flex items-center justify-center`}>
          {activeEffect.type === 'run' && (
            <div className="effect-run-wrapper w-full h-full flex flex-col items-center justify-center bg-cyan-950/20 backdrop-blur-[1px]">
              <div className="effect-scanline"></div>
              <div className="effect-scanner-glow"></div>
              <div className="font-orbitron font-extrabold text-2xl tracking-[0.2em] text-cyan-400 animate-pulse drop-shadow-[0_0_12px_#00f0ff] uppercase flex flex-col items-center gap-2">
                <span className="text-[10px] text-cyan-500/80 tracking-[0.4em] font-semibold">INITIALIZING DATA BREACH</span>
                <span>RUNNING: {activeEffect.server === 'RD' ? 'R&D' : activeEffect.server || 'SERVER'}</span>
                <span className="text-xs font-mono text-cyan-500/60 mt-1 animate-flicker">BYPASSING GATEWAY FIREWALLS...</span>
              </div>
              <div className="grid-laser-lines"></div>
            </div>
          )}

          {activeEffect.type === 'install' && (
            <div className="effect-install-wrapper w-full h-full flex flex-col items-center justify-center bg-slate-950/10">
              <div className="install-grid-bracket"></div>
              <div className="font-orbitron font-extrabold text-xl tracking-[0.15em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] uppercase flex flex-col items-center gap-1.5 animate-scale-up">
                <span className="text-[9px] text-cyan-400 tracking-[0.3em] font-bold">COMPILING SYSTEM MODULE</span>
                <span className="border-b border-cyan-500 pb-1 px-4 text-center">{activeEffect.title}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1">ALLOCATING SECTOR ADDR [0x7FF01A...]</span>
              </div>
            </div>
          )}

          {activeEffect.type === 'steal' && (
            <div className="effect-steal-wrapper w-full h-full flex flex-col items-center justify-center bg-rose-950/40 backdrop-blur-sm pointer-events-auto">
              <div className="fui-scanlines"></div>
              <div className="absolute top-4 left-4 font-mono text-[9px] text-rose-500/80 animate-flicker select-none leading-relaxed">
                SYS_ALERT: ACCESS_VIOLATION<br />
                ENCRYPTION_LAYER_0xDEADBEEF: DECRYPTED<br />
                DOWNLOADING_SECURE_COGNITIVE_MODULES...
              </div>
              <div className="steal-warning-box border border-rose-500/50 p-8 rounded-lg bg-black/85 flex flex-col items-center gap-4 text-center max-w-md shadow-[0_0_50px_rgba(255,0,85,0.4)] animate-glitch-shake">
                <div className="w-16 h-16 rounded-full border-2 border-rose-500 flex items-center justify-center text-rose-500 text-3xl font-bold animate-pulse">
                  ⚠️
                </div>
                <div>
                  <h2 className="font-orbitron font-black text-rose-500 text-xl tracking-[0.2em] animate-pulse">
                    ACCESS GRANTED
                  </h2>
                  <p className="text-[10px] text-rose-400 tracking-wider font-orbitron uppercase mt-1">
                    Secure Agenda Data Compromised
                  </p>
                </div>
                <div className="bg-rose-950/50 border border-rose-500/40 px-6 py-3 rounded text-sm font-bold text-white tracking-wide animate-pulse">
                  {activeEffect.title}
                </div>
                <div className="text-[9px] font-mono text-rose-500/60 uppercase">
                  Data Stream Diverted to Runner Score Area
                </div>
              </div>
            </div>
          )}

          {activeEffect.type === 'score' && (
            <div className="effect-score-wrapper w-full h-full flex flex-col items-center justify-center bg-emerald-950/40 backdrop-blur-sm pointer-events-auto">
              <div className="fui-scanlines"></div>
              <div className="absolute top-4 right-4 font-mono text-[9px] text-emerald-500/80 animate-flicker select-none leading-relaxed text-right">
                CORP_SECURE_CORE: INTEGRATION_ACTIVE<br />
                HOST_MODULE_ID_0x00FF88: VERIFIED<br />
                UPLOADING_COGNITIVE_RESOURCES...
              </div>
              <div className="score-success-box border border-emerald-500/50 p-8 rounded-lg bg-black/85 flex flex-col items-center gap-4 text-center max-w-md shadow-[0_0_50px_rgba(57,255,20,0.3)] animate-scale-up">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-3xl font-bold animate-pulse">
                  🛡️
                </div>
                <div>
                  <h2 className="font-orbitron font-black text-emerald-400 text-xl tracking-[0.2em]">
                    SYSTEM INTEGRATED
                  </h2>
                  <p className="text-[10px] text-emerald-400/80 tracking-wider font-orbitron uppercase mt-1">
                    Agenda Secured & Mainframe Synchronized
                  </p>
                </div>
                <div className="bg-emerald-950/50 border border-emerald-500/40 px-6 py-3 rounded text-sm font-bold text-white tracking-wide">
                  {activeEffect.title}
                </div>
                <div className="text-[9px] font-mono text-emerald-500/60 uppercase">
                  Cognitive Module Scored to Corp Database
                </div>
              </div>
            </div>
          )}

          {activeEffect.type === 'advance' && (
            <div className="effect-advance-wrapper w-full h-full flex flex-col items-center justify-center bg-amber-950/10">
              <div className="advance-ripple"></div>
              <div className="font-orbitron font-extrabold text-lg tracking-[0.25em] text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] uppercase flex flex-col items-center gap-1 animate-scale-up">
                <span className="text-[8px] text-amber-500 tracking-[0.4em] font-bold">POWER INJECTION ACTIVE</span>
                <span>ADVANCED: {activeEffect.title || 'PROJECT'}</span>
                <span className="text-[9px] text-amber-600/70 font-mono mt-0.5">INJECTING ENCRYPTED DATA CELLS...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
