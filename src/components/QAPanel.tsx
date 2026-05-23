import { useState } from 'react';
import { runQASimulations } from '../game/qa';
import type { QAReport } from '../game/qa';

export const QAPanel: React.FC = () => {
  const [gameCount, setGameCount] = useState<number>(50);
  const [report, setReport] = useState<QAReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const startSimulations = () => {
    setIsRunning(true);
    // UI가 얼지 않도록 setTimeout으로 호출 지연
    setTimeout(() => {
      try {
        const rep = runQASimulations(gameCount);
        setReport(rep);
      } catch (err) {
        console.error('QA 시뮬레이션 에러:', err);
      } finally {
        setIsRunning(false);
      }
    }, 100);
  };

  const getWinRate = (wins: number) => {
    if (!report || report.totalGames === 0) return 0;
    return Math.round((wins / report.totalGames) * 100);
  };

  return (
    <div className="glass-panel border-purple-500/30 p-5 bg-slate-950/40 flex flex-col gap-4 text-left">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <h3 className="font-orbitron font-extrabold text-sm text-purple-400 tracking-wider flex items-center gap-2">
            <span>⚙️ QA BOTS & SIMULATOR</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            AI 대결 시뮬레이션을 수행하여 규정 준수 및 밸런스를 측정합니다.
          </p>
        </div>
        <span className="text-[9px] font-orbitron text-slate-500">QA ENGINE V1.0</span>
      </div>

      {/* 시뮬레이션 설정 컨트롤 */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 font-orbitron">횟수 (GAMES):</label>
          <select
            value={gameCount}
            onChange={(e) => setGameCount(Number(e.target.value))}
            className="bg-slate-950 text-xs text-white border border-slate-700 px-2 py-1 rounded focus:outline-none focus:border-purple-500"
          >
            <option value="10">10 게임</option>
            <option value="30">30 게임</option>
            <option value="50">50 게임</option>
            <option value="100">100 게임</option>
          </select>
        </div>
        
        <button
          onClick={startSimulations}
          disabled={isRunning}
          className={`neon-button flex-1 py-1.5 ${isRunning ? 'opacity-50 cursor-not-allowed' : 'border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white'}`}
        >
          {isRunning ? '시뮬레이션 분석 중...' : 'QA 시뮬레이션 시작'}
        </button>
      </div>

      {/* 로딩 표시 */}
      {isRunning && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xs text-purple-400 font-orbitron animate-pulse">Running Netrunner Game Loops...</div>
        </div>
      )}

      {/* 시뮬레이션 종합 보고서 */}
      {!isRunning && report && (
        <div className="flex flex-col gap-4 mt-2">
          
          {/* 주요 지표 대시보드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            
            {/* Corp 승률 */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-orbitron uppercase block mb-1">Corp (The Syndicate)</span>
              <div className="text-xl font-bold font-orbitron text-rose-500">{getWinRate(report.corpWins)}%</div>
              <span className="text-[9px] text-slate-500">승률 ({report.corpWins}승)</span>
            </div>

            {/* Runner 승률 */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-orbitron uppercase block mb-1">Runner (The Catalyst)</span>
              <div className="text-xl font-bold font-orbitron text-cyan-400">{getWinRate(report.runnerWins)}%</div>
              <span className="text-[9px] text-slate-500">승률 ({report.runnerWins}승)</span>
            </div>

            {/* 평균 턴 수 */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-orbitron block mb-1">평균 게임 턴수</span>
              <div className="text-xl font-bold font-orbitron text-white">{report.averageTurns} 턴</div>
              <span className="text-[9px] text-slate-500">경기당 턴 평균</span>
            </div>

            {/* 무한루프 교착 발생 건수 */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-orbitron block mb-1">교착 감지 (Deadlocks)</span>
              <div className={`text-xl font-bold font-orbitron ${report.deadlocks > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                {report.deadlocks} 건
              </div>
              <span className="text-[9px] text-slate-500">무한루프 검증 통계</span>
            </div>

            {/* 규칙 위반 건수 */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">규칙 위반 (Violations)</span>
              <div className={`text-xl font-bold font-orbitron ${report.totalViolations > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                {report.totalViolations} 건
              </div>
              <span className="text-[9px] text-slate-500">
                {report.totalViolations === 0 ? '100% 무결성 검증' : '엔진 오류 수정 필요'}
              </span>
            </div>

          </div>

          {/* 승리 방식 및 자원 데이터 보고 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 승리 원인 분포 */}
            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/60 text-xs">
              <h4 className="font-orbitron font-bold text-slate-300 border-b border-slate-800 pb-1 mb-2">
                🏆 승리 요인 분포 (Win Condition Breakdown)
              </h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">의제 득점 승리 (Agenda Score):</span>
                  <span className="font-mono text-white font-bold">{report.agendaWins}회 ({getWinRate(report.agendaWins)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">러너 킬 (Flatline):</span>
                  <span className="font-mono text-rose-400 font-bold">{report.flatlineWins}회 ({getWinRate(report.flatlineWins)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">의무 드로우 고갈 (Deckout):</span>
                  <span className="font-mono text-cyan-400 font-bold">{report.deckoutWins}회 ({getWinRate(report.deckoutWins)}%)</span>
                </div>
              </div>
            </div>

            {/* 최종 보유 재산 통계 */}
            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/60 text-xs">
              <h4 className="font-orbitron font-bold text-slate-300 border-b border-slate-800 pb-1 mb-2">
                🪙 최종 턴 자산 통계 (Final Turn Resources)
              </h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Corp 평균 크레딧:</span>
                  <span className="font-mono text-rose-500 font-bold">{report.averageCorpCredits} 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Runner 평균 크레딧:</span>
                  <span className="font-mono text-cyan-400 font-bold">{report.averageRunnerCredits} 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">게임당 평균 모델 연산 스텝수:</span>
                  <span className="font-mono text-white font-bold">{report.averageSteps} Step</span>
                </div>
              </div>
            </div>

          </div>

          {/* 규칙 무결성 검증 결과 패널 */}
          {report.totalViolations > 0 ? (
            <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/30 text-xs text-left">
              <h4 className="font-orbitron font-bold text-red-400 border-b border-red-900/40 pb-1.5 mb-2 flex items-center gap-1.5">
                <span>⚠️ 룰 위반 감지 내역 (Rule Violations Summary)</span>
              </h4>
              <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto font-mono text-[10.5px] text-red-300">
                {report.violationsSummary.map((v, idx) => (
                  <div key={idx} className="bg-red-950/40 px-2.5 py-1.5 rounded border-l-2 border-red-500">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/30 text-xs text-left">
              <h4 className="font-orbitron font-bold text-emerald-400 border-b border-emerald-900/40 pb-1.5 mb-2 flex items-center gap-1.5">
                <span>🛡️ 규칙 무결성 검증 통과 (Rule Integrity Verified)</span>
              </h4>
              <p className="text-[11px] text-slate-300 font-light leading-relaxed">
                모든 시뮬레이션 게임이 넷러너 표준 규격(<a href="file:///Users/jb_ai/test/Andriod%20Netrunner/docs/netrunner_rules.md" className="text-emerald-400 underline hover:text-emerald-300">docs/netrunner_rules.md</a>)을 <strong>100% 완벽하게 준수</strong>하였으며, 엔진 무결성이 검증되었습니다.
              </p>
            </div>
          )}

          {/* 세부 경기 로그 테이블 */}
          <div className="bg-slate-900/40 rounded-lg border border-slate-800/60 text-xs overflow-hidden">
            <div className="font-orbitron font-bold text-slate-300 bg-slate-900/80 px-4 py-2 border-b border-slate-800">
              📊 개별 매치 리포트 (Individual Match Outcomes)
            </div>
            <div className="max-h-[160px] overflow-y-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-orbitron text-[9px] uppercase border-b border-slate-800">
                    <th className="p-2">매치 #</th>
                    <th className="p-2">승리자</th>
                    <th className="p-2">승리 원인</th>
                    <th className="p-2">경기 턴수</th>
                    <th className="p-2 text-right">최종 점수 (C/R)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((res) => (
                    <tr key={res.gameIndex} className="border-b border-slate-950 hover:bg-slate-900/30">
                      <td className="p-2 font-mono text-slate-500">#{res.gameIndex}</td>
                      <td className={`p-2 font-bold ${res.winner === 'Corp' ? 'text-rose-500' : 'text-cyan-400'}`}>
                        {res.winner}
                      </td>
                      <td className="p-2 uppercase font-mono text-[9px] text-slate-300">{res.winMethod}</td>
                      <td className="p-2 font-mono">{res.turns} 턴</td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {res.corpFinalScore}P / {res.runnerFinalScore}P
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
