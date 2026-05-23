import type { GameState } from '../game/types';
import { CardComponent } from './CardComponent';

interface RunPanelProps {
  state: GameState;
  onRezIce: (cardId: string) => void;
  onLetPass: () => void;
  onBreakSub: (subId: string) => void;
  onBreakWithClick: (subId: string) => void;
  onResolveSubs: () => void;
  onJackOut: () => void;
  onAccessCard: (trash: boolean) => void;
  onProceedRun: () => void;
  onPaySkunkworks: (paymentType: 'credits' | 'clicks' | 'jackout') => void;
}

export const RunPanel: React.FC<RunPanelProps> = ({
  state,
  onRezIce,
  onLetPass,
  onBreakSub,
  onBreakWithClick,
  onResolveSubs,
  onJackOut,
  onAccessCard,
  onProceedRun,
  onPaySkunkworks,
}) => {
  const { run, gameMode, runner, corp } = state;
  if (!run) return null;

  const isRunnerHuman = gameMode === 'runner-human';
  const isCorpHuman = gameMode === 'corp-human';
  
  const currentIce = run.currentIce;
  const isIceRezzed = currentIce?.rezzed;

  // 카드 텍스트 포맷터
  const formatText = (text: string) => {
    return text.replace(/\[Click\]/g, '⚡').replace(/\[Credits\]/g, '🪙').replace(/\[Credit\]/g, '🪙');
  };

  // 러너 리그에서 매칭되는 아이스브레이커 탐색
  const matchingBreakers = runner.rig.filter(c => {
    if (c.type !== 'Program' || !currentIce) return false;
    if (c.codeName === 'mayfly') return true; // AI 범용
    if (currentIce.subTypes.includes('Barrier') && c.subTypes.includes('Barrier')) return true;
    if (currentIce.subTypes.includes('Code Gate') && c.subTypes.includes('Code Gate')) return true;
    if (currentIce.subTypes.includes('Sentry') && c.subTypes.includes('Sentry')) return true;
    return false;
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel border-cyan-500/30 max-w-2xl w-full p-6 flex flex-col gap-4 text-left shadow-[0_0_30px_rgba(0,240,255,0.15)]">
        
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-orbitron font-extrabold text-cyan-400 flex items-center gap-2">
              <span>🌐 RUN IN PROGRESS:</span>
              <span className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-sm">
                {run.target}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              러너가 대상 서버의 중앙 전산망을 공격하여 의제와 데이터를 추출하고 있습니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-orbitron text-slate-400">자금 상태</div>
            <div className="text-sm font-bold font-orbitron flex items-center justify-end gap-1">
              <span>R:</span>
              <span className="text-cyan-400">{runner.credits}🪙</span>
              {run.overclockCredits !== undefined && run.overclockCredits > 0 && (
                <span className="text-purple-400 text-xs">({run.overclockCredits} 임시🪙)</span>
              )}
              <span className="text-slate-600">|</span>
              <span>C:</span>
              <span className="text-rose-500">{corp.credits}🪙</span>
            </div>
          </div>
        </div>

        {/* 런 진행 단계 시각화 */}
        <div className="flex justify-between text-center bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[10px] font-orbitron">
          <div className={`flex-1 py-1 rounded ${run.phase === 'initiation' ? 'bg-cyan-950/80 text-cyan-400' : 'opacity-40'}`}>
            1. 시도 (Start)
          </div>
          <div className="flex items-center opacity-30">➔</div>
          <div className={`flex-1 py-1 rounded ${run.phase === 'approach' ? 'bg-cyan-950/80 text-cyan-400' : 'opacity-40'}`}>
            2. ICE 접근 (Approach)
          </div>
          <div className="flex items-center opacity-30">➔</div>
          <div className={`flex-1 py-1 rounded ${run.phase === 'encounter' ? 'bg-cyan-950/80 text-cyan-400' : 'opacity-40'}`}>
            3. 조우 (Encounter)
          </div>
          <div className="flex items-center opacity-30">➔</div>
          <div className={`flex-1 py-1 rounded ${run.phase === 'success' ? 'bg-emerald-950/80 text-emerald-400' : 'opacity-40'}`}>
            4. 돌파 성공 (Success)
          </div>
          <div className="flex items-center opacity-30">➔</div>
          <div className={`flex-1 py-1 rounded ${run.phase === 'breach' ? 'bg-amber-950/80 text-amber-400' : 'opacity-40'}`}>
            5. 해킹/탈취 (Breach)
          </div>
        </div>

        {/* 메인 내용 영역 */}
        <div className="flex flex-col md:flex-row gap-6 my-2">
          
          {/* 좌측: 접근 중인 방어 카드 또는 액세스 카드 시각화 */}
          <div className="flex-shrink-0 flex justify-center items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 w-full md:w-44 min-h-[160px]">
            {currentIce && (run.phase === 'approach' || run.phase === 'encounter') ? (
              <div className="text-center flex flex-col items-center gap-2">
                <div className="text-xs text-slate-400 mb-1">인카운터 방어 ICE</div>
                <CardComponent card={currentIce} showFaceDown={!isIceRezzed} />
                <span className="text-[10px] font-orbitron font-semibold text-slate-400">
                  {isIceRezzed ? 'REZ (공개됨)' : 'UNREZ (숨겨짐)'}
                </span>
              </div>
            ) : run.phase === 'breach' && run.accessedCards[run.accessIndex] ? (
              <div className="text-center flex flex-col items-center gap-2">
                <div className="text-xs text-amber-400 mb-1">
                  액세스 카드 ({run.accessIndex + 1}/{run.accessedCards.length})
                </div>
                <CardComponent card={run.accessedCards[run.accessIndex]} forceFaceUp={true} />
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic text-center">보안 구역 통과 중...</div>
            )}
          </div>

          {/* 우측: 상태 지시어 및 플레이어 인터랙션 패널 */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Manegarm Skunkworks 비용 결제 대기 단계 */}
              {run.needSkunkworksPay && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-orbitron font-bold text-rose-400 text-sm animate-pulse flex items-center gap-1.5">
                    ⚠️ SECURITY ALARM: MANEGARM SKUNKWORKS ACTIVE
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    서버 보안망에 <strong className="text-cyan-400">Manegarm Skunkworks</strong>가 가동 중입니다. 
                    런을 계속하려면 <strong className="text-cyan-400">5🪙</strong>를 지불하거나 <strong className="text-cyan-400">2⚡</strong>를 소모해야 합니다. 
                    지불하지 않거나 불가능한 경우, 즉시 잭아웃(Jack Out)해야 합니다.
                  </p>
                  
                  {isRunnerHuman ? (
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={() => onPaySkunkworks('credits')}
                        disabled={runner.credits < 5}
                        className="neon-button runner w-full py-2 text-center justify-center"
                      >
                        5🪙 지불하고 런 계속하기 (소지: {runner.credits}🪙)
                      </button>
                      <button
                        onClick={() => onPaySkunkworks('clicks')}
                        disabled={runner.clicks < 2}
                        className="neon-button runner w-full py-2 border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white text-center justify-center"
                      >
                        2⚡ 소모하고 런 계속하기 (소지: {runner.clicks}⚡)
                      </button>
                      <button 
                        onClick={() => onPaySkunkworks('jackout')} 
                        className="neon-button w-full py-2 hover:bg-slate-800 text-slate-300 text-center justify-center"
                      >
                        지불 거부 및 즉시 잭아웃 (Jack Out)
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="text-xs text-cyan-400 italic mb-2">Runner AI가 보안 통행료 지불을 연산하고 있습니다...</div>
                      <button onClick={onProceedRun} className="neon-button runner w-full">
                        시뮬레이션 진행 (Proceed)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 1단계: 접근(Approach) - Corp Rez 결정 단계 */}
              {!run.needSkunkworksPay && run.phase === 'approach' && currentIce && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-orbitron font-bold text-white text-sm">
                    방어선 접근: {currentIce.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    러너가 비공개 방어 프로그램(ICE)에 도달했습니다. Corp는 이 카드를 레즈(Rez)하여 러너의 접근을 격퇴하거나, 크레딧이 부족한 경우 그냥 통과시켜야 합니다.
                  </p>
                  
                  {isCorpHuman ? (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => onRezIce(currentIce.id)}
                        disabled={corp.credits < currentIce.cost}
                        className="neon-button corp flex-1"
                      >
                        ICE Rez하기 ({currentIce.cost}🪙 소모)
                      </button>
                      <button onClick={onLetPass} className="neon-button flex-1 hover:bg-slate-800">
                        그냥 통과시키기 (Pass)
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="text-xs text-rose-400 italic mb-2">Corp AI가 Rez 결정을 내리는 중...</div>
                      <button onClick={onProceedRun} className="neon-button runner w-full">
                        시뮬레이션 진행 (Proceed)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2단계: 조우(Encounter) - 브레이커 작동 및 해제 단계 */}
              {!run.needSkunkworksPay && run.phase === 'encounter' && currentIce && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-orbitron font-bold text-white text-sm">
                      {currentIce.title} ICE 조우중! (강도: {currentIce.strength})
                    </h3>
                  </div>

                  {/* 서브루틴 상태 목록 */}
                  <div className="flex flex-col gap-1.5 bg-slate-950/80 p-2 rounded border border-slate-800">
                    <span className="text-[9px] uppercase font-orbitron text-slate-400">보안 위협 요소 (서브루틴):</span>
                    {run.subroutines.map((sub) => (
                      <div
                        key={sub.id}
                        className={`subroutine-item ${sub.broken ? 'broken text-slate-500' : 'text-slate-200'}`}
                      >
                        <span>{sub.broken ? '✅' : '❌'}</span>
                        <span className="font-mono text-xs">{formatText(sub.text)}</span>
                        {isRunnerHuman && !sub.broken && currentIce.subTypes.includes('Bioroid') && runner.clicks > 0 && (
                          <button
                            onClick={() => onBreakWithClick(sub.id)}
                            className="ml-auto text-[8px] bg-amber-950 text-amber-400 border border-amber-800 px-1 rounded hover:bg-amber-900"
                          >
                            1⚡로 해제
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 사용 가능한 아이스브레이커 및 비용 지불 상호작용 */}
                  {isRunnerHuman ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[9px] uppercase font-orbitron text-slate-400">아이스브레이커 리그 작동:</span>
                      {matchingBreakers.length === 0 ? (
                        <p className="text-xs text-rose-400 italic">
                          이 장벽을 해제할 수 있는 알맞은 아이스브레이커가 설치되어 있지 않습니다!
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                           {matchingBreakers.map((breaker) => {
                             // 강도 매칭 검증
                             const strengthDiff = (currentIce.strength || 0) - (breaker.strength || 0);
                             const needStrengthBoost = strengthDiff > 0;
                             const boostCost = breaker.codeName === 'carmen' ? 2 : 1; // 카르멘은 2크레딧당 +3
                             const boostAmt = breaker.codeName === 'carmen' ? 3 : 1;
                             
                             const totalAvailableCredits = runner.credits + (run.overclockCredits || 0);
                             const canAffordBoost = totalAvailableCredits >= boostCost;
                             
                             const breakCost = breaker.codeName === 'carmen' ? 2 : 1;
                             const canAffordBreak = totalAvailableCredits >= breakCost;
                             
                             return (
                               <div
                                 key={breaker.id}
                                 className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 text-xs"
                               >
                                 <div>
                                   <span className="font-bold text-cyan-400">{breaker.title}</span>
                                   <span className="text-slate-400 ml-2">(강도: {breaker.strength})</span>
                                 </div>
                                 <div className="flex gap-1.5">
                                   {needStrengthBoost && (
                                     <button
                                       onClick={() => {
                                         // 임시적으로 UI 단에서 강도를 올려주는 엔진 액션 연동 (강도 업)
                                         breaker.strength = (breaker.strength || 0) + boostAmt;
                                         
                                         // Overclock 임시 크레딧 차감 우선
                                         let remainingCost = boostCost;
                                         if (run.overclockCredits !== undefined && run.overclockCredits > 0) {
                                           const usedFromTemp = Math.min(run.overclockCredits, remainingCost);
                                           run.overclockCredits -= usedFromTemp;
                                           remainingCost -= usedFromTemp;
                                         }
                                         if (remainingCost > 0) {
                                           runner.credits -= remainingCost;
                                         }
                                         
                                         onProceedRun(); // 강도 변경 후 UI 강제 리렌더
                                       }}
                                       disabled={!canAffordBoost}
                                       className="bg-purple-950 text-purple-400 border border-purple-800 px-2 py-0.5 rounded text-[10px] hover:bg-purple-900 cursor-pointer"
                                     >
                                       강도+{boostAmt} ({boostCost}🪙)
                                     </button>
                                   )}
                                   
                                   {/* 서브루틴 깨기 버튼 */}
                                   <button
                                     onClick={() => {
                                       // 무작위로 첫 번째 안 깨진 서브루틴 격파
                                       const unbroken = run.subroutines.find(s => !s.broken);
                                       if (unbroken) {
                                         // Overclock 임시 크레딧 차감 우선
                                         let remainingCost = breakCost;
                                         if (run.overclockCredits !== undefined && run.overclockCredits > 0) {
                                           const usedFromTemp = Math.min(run.overclockCredits, remainingCost);
                                           run.overclockCredits -= usedFromTemp;
                                           remainingCost -= usedFromTemp;
                                         }
                                         if (remainingCost > 0) {
                                           runner.credits -= remainingCost;
                                         }
                                         onBreakSub(unbroken.id);
                                       }
                                     }}
                                     disabled={needStrengthBoost || !canAffordBreak || !run.subroutines.some(s => !s.broken)}
                                     className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded text-[10px] hover:bg-cyan-900 cursor-pointer"
                                   >
                                     서브루틴 해제 ({breakCost}🪙)
                                   </button>
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <button onClick={onResolveSubs} className="neon-button runner flex-1">
                          서브루틴 작동 및 해결 (Proceed)
                        </button>
                        {run.iceIndex > 0 && (
                          <button onClick={onJackOut} className="neon-button flex-1 hover:bg-slate-800 text-slate-300">
                            잭아웃 (중단 후 이탈)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="text-xs text-cyan-400 italic mb-2">Runner AI가 해킹 및 연산을 수행하는 중...</div>
                      <button onClick={onResolveSubs} className="neon-button runner w-full">
                        서브루틴 결과 처리 (Resolve)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3단계: 해킹/액세스 성공(Breach) 단계 */}
              {!run.needSkunkworksPay && run.phase === 'breach' && run.accessedCards[run.accessIndex] && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-orbitron font-bold text-amber-400 text-sm">
                    중앙 서버 해킹 성공: 카드 열람중
                  </h3>
                  
                  {(() => {
                    const card = run.accessedCards[run.accessIndex];
                    const isAgenda = card.type === 'Agenda';
                    const hasTrashCost = card.trashCost !== undefined;

                    return (
                      <div className="flex flex-col gap-2 mt-2">
                        <p className="text-xs text-slate-300">
                          {isAgenda 
                            ? '의제(Agenda) 데이터 파일을 발견했습니다! 러너가 즉시 득점 영역으로 다운로드하여 승점을 획득합니다.'
                            : `보안 노드 또는 자산 카드를 확인했습니다. ${hasTrashCost ? `추가 크레딧을 지불하면 이 자산을 영구 폐쇄(Trash)하여 Corp의 경제 순환을 타격할 수 있습니다.` : '이 카드는 폐기할 수 없는 운영체제 작전/방어 카드입니다.'}`}
                        </p>

                        {isRunnerHuman ? (
                          <div className="flex gap-2 mt-4">
                            {isAgenda ? (
                              <button onClick={() => onAccessCard(false)} className="neon-button runner flex-1">
                                의제 다운로드/탈취 완료 (Score)
                              </button>
                            ) : (
                              <>
                                {hasTrashCost && (
                                  <button
                                    onClick={() => onAccessCard(true)}
                                    disabled={runner.credits < (card.trashCost || 0)}
                                    className="neon-button runner flex-1"
                                  >
                                    자산 폐기하기 ({card.trashCost}🪙 지불)
                                  </button>
                                )}
                                <button onClick={() => onAccessCard(false)} className="neon-button flex-1 hover:bg-slate-800">
                                  그냥 두고 나가기 (Close)
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4">
                            <div className="text-xs text-cyan-400 italic mb-2">Runner AI가 탈취 및 폐기 결정중...</div>
                            <button onClick={() => onAccessCard(false)} className="neon-button runner w-full">
                              확인 완료 (Next)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
