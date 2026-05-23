import React from 'react';
import type { GameState, Card, ServerName } from '../game/types';
import { CardComponent } from './CardComponent';

interface BoardProps {
  state: GameState;
  selectedCardId: string | null;
  onSelectCard: (cardId: string | null) => void;
  onEndRunnerTurn: () => void;
  onBasicAction: (actionType: 'gain-credit' | 'draw-card') => void;
  onInitiateRun: (serverName: ServerName) => void;
  onAIAction: () => void;
  onReset: () => void;
  mulliganSelectedIds?: Set<string>;
}

export const Board: React.FC<BoardProps> = ({
  state,
  selectedCardId,
  onSelectCard,
  onEndRunnerTurn,
  onBasicAction,
  onInitiateRun,
  onAIAction,
  onReset,
  mulliganSelectedIds = new Set(),
}) => {
  const { activePlayer, turn, phase, corp, runner, servers, gameMode } = state;

  const isCorpActive = activePlayer === 'Corp';
  const isRunnerActive = activePlayer === 'Runner';
  
  const isCorpPlayerHuman = gameMode === 'corp-human';
  const isRunnerPlayerHuman = gameMode === 'runner-human';

  // 현재 유저가 수동 조작 가능한 차례인지 여부
  const isUserTurn = 
    (isCorpActive && isCorpPlayerHuman && phase === 'corp-action') ||
    (isRunnerActive && isRunnerPlayerHuman && phase === 'runner-action');

  const isDiscardMode = phase === 'corp-discard' || phase === 'runner-discard';

  const handleCardClick = (card: Card) => {
    // 이미 선택된 카드를 다시 클릭하면 선택 해제
    if (selectedCardId === card.id) {
      onSelectCard(null);
      return;
    }

    // 카드 선택하기 (2단계 제어)
    onSelectCard(card.id);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* ----------------- CORPORATION AREA (상단) ----------------- */}
      <div className={`p-4 rounded-xl border transition-all ${isCorpActive ? 'bg-rose-950/5 border-rose-500/30' : 'bg-slate-900/10 border-slate-800'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <span className="font-orbitron font-extrabold text-sm text-rose-500 tracking-wider">
              [CORP] THE SYNDICATE
            </span>
            <div className="flex gap-2 text-xs font-orbitron">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Score: <strong className="text-rose-400">{corp.score} / 6P</strong>
              </span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Credits: <strong className="text-amber-400">{corp.credits}🪙</strong>
              </span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Clicks: <strong className="text-white">{isCorpActive ? corp.clicks : 0}⚡</strong>
              </span>
            </div>
          </div>
          
          {/* Corp 기본행동 커맨드 */}
          {isCorpActive && isCorpPlayerHuman && phase === 'corp-action' && (
            <div className="flex gap-2">
              <button onClick={() => onBasicAction('gain-credit')} className="neon-button corp py-1 text-[10px]">
                +1 크레딧 (1⚡)
              </button>
              <button onClick={() => onBasicAction('draw-card')} className="neon-button corp py-1 text-[10px]">
                카드 드로우 (1⚡)
              </button>
            </div>
          )}
        </div>

        {/* 회사 득점 영역 (Scored Agendas) */}
        {corp.scoreArea && corp.scoreArea.length > 0 && (
          <div className="mb-4 bg-rose-950/15 p-2 rounded-lg border border-rose-900/30">
            <span className="text-[9px] text-rose-400 font-orbitron uppercase block mb-1.5 font-extrabold tracking-wider">
              Scored Agendas (득점한 의제)
            </span>
            <div className="flex gap-2 flex-wrap">
              {corp.scoreArea.map((card) => (
                <div key={card.id} className="scale-85 origin-top-left -mr-4 -mb-4">
                  <CardComponent card={card} interactive={false} forceFaceUp={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 회사 손패 (HQ) */}
        <div className="mb-4">
          <span className="text-[10px] text-slate-400 font-orbitron uppercase block mb-1">
            HQ (Corp Hand - 손패 {corp.hand.length}장)
          </span>
          <div className="flex gap-3 overflow-x-auto py-1 min-h-[140px] md:min-h-[200px] bg-slate-950/20 p-2 rounded border border-slate-900/80 z-10 relative">
            {corp.hand.map((card) => (
              <CardComponent
                key={card.id}
                card={card}
                showFaceDown={!isCorpPlayerHuman} // 러너 화면에서는 Corp 손패 감춤
                interactive={isCorpPlayerHuman && (phase === 'corp-mulligan' || (isCorpActive && phase === 'corp-action') || phase === 'corp-discard')}
                onClick={() => handleCardClick(card)}
                glowColor={mulliganSelectedIds.has(card.id) ? 'amber' : null}
                isSelected={selectedCardId === card.id || mulliganSelectedIds.has(card.id)}
                hasActiveSelection={selectedCardId !== null || mulliganSelectedIds.size > 0}
                isHand={isCorpPlayerHuman}
              />
            ))}
            {corp.hand.length === 0 && (
              <div className="text-xs text-slate-600 italic my-auto mx-auto">손패 비어있음</div>
            )}
          </div>
        </div>

        {/* 기존 수동 조작 및 설치 대기 패널 제거됨 */}

        {/* Corp 전 서버 레이아웃 시각화 (Archives, R&D, HQ) */}
        <div>
          <span className="text-[10px] text-slate-400 font-orbitron uppercase block mb-1.5">
            CENTRAL NETWORK ARCHITECTURE (중앙 서버 방어망)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            
            {/* R&D 서버 */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-center flex flex-col justify-between gap-3">
              <div className="font-orbitron font-bold text-[11px] text-rose-500 border-b border-slate-900 pb-1">
                R&D (덱: {corp.deck.length}장)
              </div>
              
              {/* 보호 ICE 리스트 (가로 배치) */}
              <div className="flex flex-row-reverse gap-1.5 min-h-[50px] justify-center items-center overflow-x-auto py-1">
                {servers.RD.ice.map((ice) => {
                  const isRezzed = ice.rezzed;
                  return (
                    <div 
                      key={ice.id} 
                      className={`transition-all duration-300 ${isRezzed ? 'w-[128px] h-[90px] flex items-center justify-center scale-95 mx-1.5' : 'w-[90px] h-[128px]'}`}
                    >
                      <div className={isRezzed ? 'rotate-90 origin-center' : ''}>
                        <CardComponent
                          card={ice}
                          interactive={isCorpPlayerHuman}
                          onClick={() => handleCardClick(ice)}
                          isSelected={selectedCardId === ice.id}
                          hasActiveSelection={selectedCardId !== null}
                        />
                      </div>
                    </div>
                  );
                })}
                {servers.RD.ice.length === 0 && <span className="text-[9px] text-slate-600 italic">ICE 방어 없음</span>}
              </div>
              
              <button
                onClick={() => isRunnerPlayerHuman && isRunnerActive && onInitiateRun('RD')}
                disabled={!isRunnerPlayerHuman || !isRunnerActive}
                className={`neon-button runner w-full py-1 text-[9px] cursor-pointer ${state.run?.target === 'RD' ? 'running-target' : ''}`}
              >
                R&D 해킹 (Run)
              </button>
            </div>

            {/* HQ 서버 */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-center flex flex-col justify-between gap-3">
              <div className="font-orbitron font-bold text-[11px] text-rose-500 border-b border-slate-900 pb-1">
                HQ (Corp 중앙서버)
              </div>
              
              {/* 보호 ICE 리스트 (가로 배치) */}
              <div className="flex flex-row-reverse gap-1.5 min-h-[50px] justify-center items-center overflow-x-auto py-1">
                {servers.HQ.ice.map((ice) => {
                  const isRezzed = ice.rezzed;
                  return (
                    <div 
                      key={ice.id} 
                      className={`transition-all duration-300 ${isRezzed ? 'w-[128px] h-[90px] flex items-center justify-center scale-95 mx-1.5' : 'w-[90px] h-[128px]'}`}
                    >
                      <div className={isRezzed ? 'rotate-90 origin-center' : ''}>
                        <CardComponent
                          card={ice}
                          interactive={isCorpPlayerHuman}
                          onClick={() => handleCardClick(ice)}
                          isSelected={selectedCardId === ice.id}
                          hasActiveSelection={selectedCardId !== null}
                        />
                      </div>
                    </div>
                  );
                })}
                {servers.HQ.ice.length === 0 && <span className="text-[9px] text-slate-600 italic">ICE 방어 없음</span>}
              </div>

              <button
                onClick={() => isRunnerPlayerHuman && isRunnerActive && onInitiateRun('HQ')}
                disabled={!isRunnerPlayerHuman || !isRunnerActive}
                className={`neon-button runner w-full py-1 text-[9px] cursor-pointer ${state.run?.target === 'HQ' ? 'running-target' : ''}`}
              >
                HQ 해킹 (Run)
              </button>
            </div>

            {/* Archives 서버 (버린 카드 더미) */}
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-center flex flex-col justify-between gap-3">
              <div className="font-orbitron font-bold text-[11px] text-rose-500 border-b border-slate-900 pb-1">
                Archives (버린카드: {corp.discard.length}장)
              </div>
              
              {/* 보호 ICE 리스트 (가로 배치) */}
              <div className="flex flex-row-reverse gap-1.5 min-h-[50px] justify-center items-center overflow-x-auto py-1">
                {servers.Archives.ice.map((ice) => {
                  const isRezzed = ice.rezzed;
                  return (
                    <div 
                      key={ice.id} 
                      className={`transition-all duration-300 ${isRezzed ? 'w-[128px] h-[90px] flex items-center justify-center scale-95 mx-1.5' : 'w-[90px] h-[128px]'}`}
                    >
                      <div className={isRezzed ? 'rotate-90 origin-center' : ''}>
                        <CardComponent
                          card={ice}
                          interactive={isCorpPlayerHuman}
                          onClick={() => handleCardClick(ice)}
                          isSelected={selectedCardId === ice.id}
                          hasActiveSelection={selectedCardId !== null}
                        />
                      </div>
                    </div>
                  );
                })}
                {servers.Archives.ice.length === 0 && <span className="text-[9px] text-slate-600 italic">ICE 방어 없음</span>}
              </div>

              <button
                onClick={() => isRunnerPlayerHuman && isRunnerActive && onInitiateRun('Archives')}
                disabled={!isRunnerPlayerHuman || !isRunnerActive}
                className={`neon-button runner w-full py-1 text-[9px] cursor-pointer ${state.run?.target === 'Archives' ? 'running-target' : ''}`}
              >
                Archives 해킹 (Run)
              </button>
            </div>

          </div>
        </div>

        {/* 원격 서버 단독 구역 (대형 확장 및 가로 배치) */}
        <div className="mt-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/20">
          <span className="text-[11px] text-cyan-400 font-orbitron uppercase block border-b border-slate-900 pb-1.5 mb-3 font-extrabold tracking-wider">
            🛰️ REMOTE SECTOR (원격 서버 기지)
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(servers)
              .filter(s => s.startsWith('Remote'))
              .map((sName) => {
                const s = servers[sName];
                return (
                  <div key={sName} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5 shadow-lg">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-800/50 pb-1">
                      <span className="font-bold text-slate-200 font-orbitron">{sName}</span>
                      <button
                        onClick={() => isRunnerPlayerHuman && isRunnerActive && onInitiateRun(sName)}
                        disabled={!isRunnerPlayerHuman || !isRunnerActive}
                        className="bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-[8px] text-cyan-400 px-2 py-0.5 rounded font-orbitron cursor-pointer transition-all"
                      >
                        RUN
                      </button>
                    </div>

                    {/* ICE 보호막 (가로 배치) */}
                    <div className="flex flex-row-reverse gap-1.5 justify-center bg-slate-900/30 p-1.5 rounded-lg min-h-[45px] items-center overflow-x-auto">
                      {s.ice.map(ice => {
                        const isRezzed = ice.rezzed;
                        return (
                          <div 
                            key={ice.id} 
                            className={`transition-all duration-300 ${isRezzed ? 'w-[128px] h-[90px] flex items-center justify-center scale-95 mx-1.5' : 'w-[90px] h-[128px]'}`}
                          >
                            <div className={isRezzed ? 'rotate-90 origin-center' : ''}>
                              <CardComponent
                                card={ice}
                                interactive={isCorpPlayerHuman}
                                onClick={() => handleCardClick(ice)}
                                isSelected={selectedCardId === ice.id}
                                hasActiveSelection={selectedCardId !== null}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {s.ice.length === 0 && <span className="text-[8px] text-slate-600 italic">보호 없음</span>}
                    </div>

                    {/* 원격 서버 내부 카드 (Root: Asset / Agenda) */}
                    <div className="flex justify-center gap-1.5 bg-slate-900/60 p-1.5 rounded-lg">
                      {s.root.map(c => (
                        <div key={c.id} className="flex flex-col gap-1 items-center">
                          <CardComponent
                            card={c}
                            interactive={isCorpPlayerHuman}
                            onClick={() => handleCardClick(c)}
                            isSelected={selectedCardId === c.id}
                            hasActiveSelection={selectedCardId !== null}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            
            {Object.keys(servers).filter(s => s.startsWith('Remote')).length === 0 && (
              <div className="text-[10px] text-slate-600 italic text-center w-full col-span-3 py-6">활성 원격 서버 기지가 존재하지 않습니다.</div>
            )}
          </div>
        </div>

      </div>

      {/* ----------------- GAME CONTROLLER SECTOR (중단) ----------------- */}
      <div className="glass-panel border-slate-800 p-3 bg-slate-950/60 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-orbitron">TURN:</span>
            <span className="font-bold text-white font-orbitron ml-1">{turn}</span>
          </div>
          <div>
            <span className="text-slate-400">ACTIVE PLAYER:</span>
            <span className={`font-bold ml-1 ${isCorpActive ? 'text-rose-500' : 'text-cyan-400'}`}>
              {activePlayer === 'Corp' ? 'CORPORATION (회사)' : 'RUNNER (러너)'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">STATUS:</span>
            <span className="font-mono text-amber-400 ml-1 uppercase">{phase}</span>
          </div>
        </div>

        {/* AI 행동 제어 버튼 */}
        <div className="flex gap-2">
          {(!isUserTurn && !isDiscardMode && state.phase !== 'game-over') && (
            <button
              onClick={onAIAction}
              className="bg-cyan-950 border border-cyan-500 text-cyan-300 hover:bg-cyan-900 font-orbitron font-bold text-xs px-4 py-1.5 rounded animate-pulse"
            >
              🤖 AI ACTION (진행하기)
            </button>
          )}
          
          <button
            onClick={onReset}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs px-3 py-1 rounded text-slate-300"
          >
            게임 초기화
          </button>
        </div>
      </div>

      {/* ----------------- RUNNER AREA (하단) ----------------- */}
      <div className={`p-4 rounded-xl border transition-all ${isRunnerActive ? 'bg-cyan-950/5 border-cyan-500/30' : 'bg-slate-900/10 border-slate-800'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <span className="font-orbitron font-extrabold text-sm text-cyan-400 tracking-wider">
              [RUNNER] THE CATALYST
            </span>
            <div className="flex gap-2 text-xs font-orbitron">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Score: <strong className="text-cyan-400">{runner.score} / 6P</strong>
              </span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Credits: <strong className="text-amber-400">{runner.credits}🪙</strong>
              </span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Clicks: <strong className="text-white">{isRunnerActive ? runner.clicks : 0}⚡</strong>
              </span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Memory: <strong className="text-purple-400">
                  {runner.rig.reduce((sum, r) => sum + (r.memoryCost || 0), 0)} / {runner.rig.some(c => c.codeName === 'pennyshaver') ? 5 : 4}🧠
                </strong>
              </span>
            </div>
          </div>
          
          {/* Runner 기본행동 커맨드 및 차례 종료 */}
          {isRunnerActive && isRunnerPlayerHuman && phase === 'runner-action' && (
            <div className="flex gap-2">
              <button onClick={() => onBasicAction('gain-credit')} className="neon-button runner py-1 text-[10px]">
                +1 크레딧 (1⚡)
              </button>
              <button onClick={() => onBasicAction('draw-card')} className="neon-button runner py-1 text-[10px]">
                카드 드로우 (1⚡)
              </button>
              <button 
                onClick={onEndRunnerTurn} 
                className={`neon-button py-1 text-[10px] transition-all font-bold ${
                  runner.clicks === 0 
                    ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse' 
                    : 'border-slate-500 text-slate-400 hover:border-amber-500 hover:text-amber-500'
                }`}
              >
                차례 종료 (End Turn)
              </button>
            </div>
          )}
        </div>

        {/* 러너 리그 장비구역 (Installed Programs / Hardware / Resources) */}
        <div className="mb-4">
          <span className="text-[10px] text-slate-400 font-orbitron uppercase block mb-1">
            RUNNER RIG (장착 리그 및 하드웨어/리소스 장비창)
          </span>
          <div className="flex gap-3 overflow-x-auto py-2 min-h-[140px] bg-slate-950/40 p-2 rounded border border-slate-900">
            {runner.rig.map((card) => (
              <div key={card.id} className="flex flex-col gap-1 items-center">
                <CardComponent
                  card={card}
                  interactive={isRunnerPlayerHuman}
                  onClick={() => handleCardClick(card)}
                  isSelected={selectedCardId === card.id}
                  hasActiveSelection={selectedCardId !== null}
                />
              </div>
            ))}
            {runner.rig.length === 0 && (
              <div className="text-xs text-slate-600 italic my-auto mx-auto">설치된 장비 없음 (리그 공석)</div>
            )}
          </div>
        </div>

        {/* 기존 러너 손패 조작 패널 제거됨 */}

        {/* 러너 득점/탈취 영역 (Stolen Agendas) */}
        {runner.scoreArea && runner.scoreArea.length > 0 && (
          <div className="mb-4 bg-cyan-950/15 p-2 rounded-lg border border-cyan-900/30">
            <span className="text-[9px] text-cyan-400 font-orbitron uppercase block mb-1.5 font-extrabold tracking-wider">
              Stolen Agendas (탈취한 의제)
            </span>
            <div className="flex gap-2 flex-wrap">
              {runner.scoreArea.map((card) => (
                <div key={card.id} className="scale-85 origin-top-left -mr-4 -mb-4">
                  <CardComponent card={card} interactive={false} forceFaceUp={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 러너 손패 (Grip) */}
        <div>
          <span className="text-[10px] text-slate-400 font-orbitron uppercase block mb-1">
            Grip (Runner Hand - 손패 {runner.hand.length}장)
          </span>
          <div className="flex gap-3 overflow-x-auto py-1 min-h-[140px] md:min-h-[200px] bg-slate-950/20 p-2 rounded border border-slate-900/80 z-10 relative">
            {runner.hand.map((card) => (
              <CardComponent
                key={card.id}
                card={card}
                showFaceDown={!isRunnerPlayerHuman} // Corp 화면에서는 러너 손패 가림
                interactive={isRunnerPlayerHuman && (phase === 'runner-mulligan' || (isRunnerActive && phase === 'runner-action') || phase === 'runner-discard')}
                onClick={() => handleCardClick(card)}
                glowColor={mulliganSelectedIds.has(card.id) ? 'amber' : null}
                isSelected={selectedCardId === card.id || mulliganSelectedIds.has(card.id)}
                hasActiveSelection={selectedCardId !== null || mulliganSelectedIds.size > 0}
                isHand={isRunnerPlayerHuman}
              />
            ))}
            {runner.hand.length === 0 && (
              <div className="text-xs text-slate-600 italic my-auto mx-auto">손패 비어있음</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
