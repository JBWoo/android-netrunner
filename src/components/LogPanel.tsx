import { useEffect, useRef } from 'react';
import type { LogEntry } from '../game/types';

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 새로운 로그가 찍힐 때 자동으로 스크롤 하단 이동
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getSenderColor = (sender: LogEntry['sender']) => {
    switch (sender) {
      case 'Corp':
        return 'text-rose-500 font-bold';
      case 'Runner':
        return 'text-cyan-400 font-bold';
      case 'System':
        return 'text-amber-400 font-semibold';
      default:
        return 'text-slate-400';
    }
  };

  const getRowBg = (sender: LogEntry['sender']) => {
    switch (sender) {
      case 'Corp':
        return 'bg-rose-950/10 border-l-2 border-rose-600';
      case 'Runner':
        return 'bg-cyan-950/10 border-l-2 border-cyan-500';
      case 'System':
        return 'bg-amber-950/10 border-l-2 border-amber-500';
      default:
        return 'border-l-2 border-slate-700';
    }
  };

  return (
    <div className="glass-panel border-slate-800 p-4 flex flex-col h-full bg-slate-950/40">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
        <h3 className="font-orbitron font-extrabold text-sm tracking-widest text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          NETWORK LOGS (활동 로그)
        </h3>
        <span className="text-[9px] font-orbitron text-slate-500">LIVE FEED</span>
      </div>

      {/* 로그 리스트 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[300px] md:max-h-[500px]"
      >
        {logs.length === 0 ? (
          <div className="text-xs text-slate-600 italic text-center my-auto">
            활동 감지되지 않음. 네트워크 연결 대기 중...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-2 rounded text-[11px] leading-relaxed transition-all duration-200 border-y border-r border-slate-900 ${getRowBg(
                log.sender
              )}`}
            >
              <div className="flex justify-between items-center mb-1 text-[9px] opacity-60 font-orbitron">
                <span className={getSenderColor(log.sender)}>
                  {log.sender === 'System' ? '⚡ SYSTEM' : log.sender.toUpperCase()}
                </span>
                <span>{log.timestamp}</span>
              </div>
              <p className="text-slate-200 font-light select-text">{log.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
