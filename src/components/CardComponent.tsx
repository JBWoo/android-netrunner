import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Card } from '../game/types';

interface CardComponentProps {
  card: Card;
  onClick?: () => void;
  interactive?: boolean;
  showFaceDown?: boolean; // 항상 뒷면으로 보일지 여부
  forceFaceUp?: boolean; // 레즈 여부 상관없이 무조건 앞면 노출 여부
  glowColor?: 'runner' | 'corp' | 'agenda' | null;
  isHand?: boolean; // TCG 스타일 손패 카드 여부
  isSelected?: boolean; // 선택 상태 여부
  hasActiveSelection?: boolean; // 현재 클릭 모달 활성화 여부
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  onClick,
  interactive = false,
  showFaceDown = false,
  forceFaceUp = false,
  glowColor = null,
  isHand = false,
  isSelected = false,
  hasActiveSelection = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isCorp = card.side === 'Corp';
  
  // 회사 카드고 레즈되지 않은 경우 뒷면 처리 (단 forceFaceUp이면 앞면 고정)
  const isFaceDown = !forceFaceUp && (showFaceDown || (isCorp && !card.rezzed && card.type !== 'Identity'));

  // 글로우 클래스 설정
  let glowClass = '';
  if (glowColor === 'runner') glowClass = 'runner-border';
  else if (glowColor === 'corp') glowClass = 'corp-border';
  else if (glowColor === 'agenda') {
    glowClass = 'border-green-400 shadow-[0_0_10px_rgba(57,255,20,0.5)]';
  } else if (interactive) {
    glowClass = isCorp 
      ? 'hover:shadow-[0_0_12px_rgba(255,0,85,0.8)] hover:border-[#ff0055] transition-all' 
      : 'hover:shadow-[0_0_12px_rgba(0,240,255,0.8)] hover:border-[#00f0ff] transition-all';
  }

  // 텍스트 변환: [Click] -> ⚡, [Credit] -> 🪙, [Memory Unit] -> 🧠
  const formatText = (text: string) => {
    return text
      .replace(/\[Click\]/g, '⚡')
      .replace(/\[Credits\]/g, '🪙')
      .replace(/\[Credit\]/g, '🪙')
      .replace(/\[Memory Unit\]/g, '🧠')
      .replace(/\[Memory Units\]/g, '🧠');
  };

  // 카드 유형별 배경색상
  const getCardBg = () => {
    if (isFaceDown) return '';
    if (card.type === 'Identity') {
      return isCorp ? 'bg-gradient-to-br from-purple-950 to-slate-900 border-purple-500' : 'bg-gradient-to-br from-cyan-950 to-slate-900 border-cyan-500';
    }
    switch (card.type) {
      case 'Agenda':
        return 'bg-gradient-to-br from-emerald-950 to-slate-950 border-emerald-500';
      case 'Asset':
        return 'bg-gradient-to-br from-indigo-950 to-slate-950 border-indigo-500';
      case 'ICE':
        return 'bg-gradient-to-br from-slate-900 to-zinc-950 border-slate-600';
      case 'Operation':
        return 'bg-gradient-to-br from-rose-950 to-slate-950 border-rose-500';
      case 'Event':
        return 'bg-gradient-to-br from-teal-950 to-slate-950 border-teal-500';
      case 'Program':
        return 'bg-gradient-to-br from-sky-950 to-slate-950 border-sky-500';
      case 'Hardware':
        return 'bg-gradient-to-br from-slate-800 to-zinc-900 border-slate-400';
      case 'Resource':
        return 'bg-gradient-to-br from-amber-950 to-slate-950 border-amber-600';
      default:
        return 'bg-slate-900 border-slate-700';
    }
  };

  const useImage = card.imageUrl && !imgError && !isFaceDown;

  return (
    <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* 실제 카드 몸체 */}
      <div
        onClick={interactive ? onClick : undefined}
        className={`netrunner-card border text-left flex flex-col justify-between glass-panel ${
          useImage ? 'p-0 overflow-hidden' : (isHand ? 'p-3 ' : 'p-2 ') + getCardBg()
        } ${glowClass} ${
          isFaceDown ? (isCorp ? 'card-back-corp' : 'card-back-runner') : ''
        } ${isHand ? 'hand-card shadow-lg' : ''} ${isSelected ? 'selected-card' : ''}`}
      >
        {!isFaceDown ? (
          useImage ? (
            <div className="relative w-full h-full">
              <img 
                src={card.imageUrl} 
                alt={card.title} 
                className="w-full h-full object-cover rounded-[5px]"
                onError={() => setImgError(true)}
              />
              
              {/* 이미지 위 오버레이 정보 (발전, 크레딧, 카운터, 강도) */}
              <div className={`absolute inset-0 flex flex-col justify-between ${isHand ? 'p-2.5 bg-gradient-to-t from-black/90 via-black/10 to-black/50' : 'p-1.5 bg-gradient-to-t from-black/80 via-transparent to-black/30'} pointer-events-none`}>
                {/* 상단 띠: 아젠다인 경우 승점/요구량 표시 */}
                <div className="flex justify-between items-start">
                  <div className={`${isHand ? 'text-[9.5px]' : 'text-[7px]'} text-white/80 bg-black/60 px-1 rounded-sm line-clamp-1 max-w-[70%] font-semibold`}>
                    {card.title}
                  </div>
                  {card.type === 'Agenda' && (
                    <div className={`${isHand ? 'text-[10px]' : 'text-[8px]'} font-orbitron font-extrabold text-green-400 bg-black/75 px-1 rounded-sm`}>
                      {card.advancementCost}/{card.agendaPoints}P
                    </div>
                  )}
                </div>
                
                {/* 하단 띠: 토큰 정보 및 강도 */}
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-0.5">
                    {card.advancedCounters > 0 && (
                      <span className={`${isHand ? 'text-[9px] px-1.5' : 'text-[7.5px] px-1'} bg-red-600 text-white font-bold border border-red-500 rounded-sm font-orbitron shadow`}>
                        ADV:{card.advancedCounters}
                      </span>
                    )}
                    {card.hostedCredits > 0 && (
                      <span className={`${isHand ? 'text-[9px] px-1.5' : 'text-[7.5px] px-1'} bg-amber-500 text-black font-bold border border-amber-400 rounded-sm font-orbitron shadow`}>
                        🪙:{card.hostedCredits}
                      </span>
                    )}
                    {card.hostedCounters > 0 && (
                      <span className={`${isHand ? 'text-[9px] px-1.5' : 'text-[7.5px] px-1'} bg-cyan-500 text-black font-bold border border-cyan-400 rounded-sm font-orbitron shadow`}>
                        🔋:{card.hostedCounters}
                      </span>
                    )}
                  </div>
                  
                  {card.strength !== undefined && (
                    <div className={`${isHand ? 'text-[11px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5'} font-orbitron font-extrabold text-cyan-400 bg-black/85 rounded border border-cyan-800/50 shadow`}>
                      {card.strength}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Fallback (텍스트 전용 카드)
            <>
              {/* 상단: 타이틀 & 코스트 */}
              <div className="flex justify-between items-start gap-1">
                <div className={`${isHand ? 'text-[12px]' : 'text-[10px]'} font-bold leading-tight line-clamp-2 uppercase tracking-wide`}>
                  {card.title}
                </div>
                <div className={`${isHand ? 'text-[11px]' : 'text-[10px]'} font-orbitron font-extrabold text-amber-400 flex items-center`}>
                  {card.type === 'Agenda' ? `${card.advancementCost}/${card.agendaPoints}P` : `${card.cost}🪙`}
                </div>
              </div>

              {/* 중단: 텍스트 및 기본 정보 */}
              <div className="flex-1 flex flex-col justify-center my-1">
                <div className={`${isHand ? 'text-[9.5px]' : 'text-[8px]'} opacity-75 font-orbitron mb-0.5 text-slate-400`}>
                  {card.type} {card.subTypes.length > 0 ? `(${card.subTypes.join(', ')})` : ''}
                </div>
                <div className={`${isHand ? 'text-[9px] line-clamp-5' : 'text-[7.5px] line-clamp-4'} leading-snug font-light text-slate-200`}>
                  {formatText(card.text)}
                </div>
              </div>

              {/* 하단: 토큰 상태 (발전, 충전 등) 및 스펙 */}
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-0.5">
                  {card.advancedCounters > 0 && (
                    <span className={`${isHand ? 'text-[9.5px] px-1.5' : 'text-[8px] px-1'} bg-red-950 text-red-400 border border-red-800 rounded-sm font-orbitron`}>
                      ADV:{card.advancedCounters}
                    </span>
                  )}
                  {card.hostedCredits > 0 && (
                    <span className={`${isHand ? 'text-[9.5px] px-1.5' : 'text-[8px] px-1'} bg-amber-950 text-amber-400 border border-amber-800 rounded-sm font-orbitron`}>
                      🪙:{card.hostedCredits}
                    </span>
                  )}
                  {card.hostedCounters > 0 && (
                    <span className={`${isHand ? 'text-[9.5px] px-1.5' : 'text-[8px] px-1'} bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-sm font-orbitron`}>
                      🔋:{card.hostedCounters}
                    </span>
                  )}
                </div>
                
                {/* 강도 표시 (ICE 또는 브레이커) */}
                {card.strength !== undefined && (
                  <div className={`${isHand ? 'text-[11px]' : 'text-[9px]'} font-orbitron font-extrabold text-cyan-400`}>
                    STR:{card.strength}
                  </div>
                )}
              </div>
            </>
          )
        ) : (
          /* 뒷면 상태에선 발전 카운터만 노출 */
          card.advancedCounters > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white font-extrabold border border-red-500 rounded-sm font-orbitron shadow-lg animate-pulse">
                ADV:{card.advancedCounters}
              </span>
            </div>
          ) : null
        )}
      </div>

      {/* 실시간 플로팅 대형 뷰어 (호버 시 작동, 뷰포트 정중앙 배치) */}
      {isHovered && !isFaceDown && !hasActiveSelection && createPortal(
        <div className="fixed inset-0 bg-black/45 backdrop-blur-[5px] z-[9999] pointer-events-none flex items-center justify-center transition-all duration-200">
          <div className={`glass-panel border-2 rounded-2xl p-6 flex flex-col md:flex-row gap-6 max-w-[90vw] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.95)] animate-tooltipFadeIn ${
            card.side === 'Runner' 
              ? 'border-cyan-500/60 shadow-[0_0_40px_rgba(0,240,255,0.25)] bg-[#0c1424]/95' 
              : card.type === 'Agenda'
                ? 'border-emerald-500/60 shadow-[0_0_40px_rgba(57,255,20,0.25)] bg-[#071a11]/95'
                : 'border-rose-500/60 shadow-[0_0_40px_rgba(255,0,85,0.25)] bg-[#1a0812]/95'
          }`}>
            {/* Left side: Large image */}
            {card.imageUrl && !imgError ? (
              <div className="w-full md:w-[320px] lg:w-[350px] shrink-0 flex items-center justify-center">
                <img 
                  src={card.imageUrl.replace('/medium/', '/large/')} 
                  alt={card.title} 
                  className="w-full h-auto object-contain rounded-xl border border-slate-700 shadow-2xl"
                />
              </div>
            ) : (
              /* Fallback text-based card styling but huge */
              <div className={`w-full md:w-[320px] lg:w-[350px] aspect-[1/1.4] shrink-0 flex flex-col justify-between p-6 border rounded-xl shadow-2xl ${getCardBg()}`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold font-orbitron text-white">{card.title}</h3>
                  <span className="text-lg font-orbitron font-extrabold text-amber-400">
                    {card.type === 'Agenda' ? `${card.advancementCost}/${card.agendaPoints}P` : `${card.cost}🪙`}
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center my-4">
                  <div className="text-xs font-orbitron text-slate-400 mb-1">
                    {card.type} {card.subTypes.length > 0 ? `• ${card.subTypes.join(' • ')}` : ''}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-line">
                    {formatText(card.text)}
                  </p>
                </div>
                <div className="flex justify-between items-end border-t border-slate-800 pt-2">
                  <span className="text-xs text-slate-400 font-orbitron">Netrunner Core</span>
                  {card.strength !== undefined && (
                    <span className="text-sm font-orbitron font-extrabold text-cyan-400">STR: {card.strength}</span>
                  )}
                </div>
              </div>
            )}

            {/* Right side: Detailed text description */}
            <div className="flex-1 flex flex-col justify-between min-w-[300px]">
              <div>
                {/* Card Title & Type header */}
                <div className="border-b border-slate-800 pb-3 mb-4">
                  <div className="text-3xl font-extrabold text-white font-orbitron tracking-wider">{card.title}</div>
                  <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest font-orbitron">
                    {card.type} {card.subTypes.length > 0 ? `• ${card.subTypes.join(' • ')}` : ''}
                  </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-black/40 p-3 rounded-lg border border-slate-900 text-xs">
                  <div>
                    <span className="text-slate-500 font-orbitron block">COST / VALUE:</span>
                    <span className="text-sm font-orbitron font-extrabold text-amber-400 font-mono">
                      {card.type === 'Agenda' 
                        ? `요구 발전: ${card.advancementCost} / 점수: ${card.agendaPoints}P` 
                        : `비용: ${card.cost}🪙`}
                    </span>
                  </div>
                  {card.strength !== undefined && (
                    <div>
                      <span className="text-slate-500 font-orbitron block">STRENGTH (강도):</span>
                      <span className="text-sm font-orbitron font-extrabold text-cyan-400 font-mono">{card.strength}</span>
                    </div>
                  )}
                  {card.memoryCost !== undefined && (
                    <div>
                      <span className="text-slate-500 font-orbitron block">MEMORY COST (메모리):</span>
                      <span className="text-sm font-orbitron font-extrabold text-purple-400 font-mono">{card.memoryCost}🧠</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 font-orbitron block">SIDE / FACTION:</span>
                    <span className={`text-sm font-orbitron font-extrabold ${card.side === 'Runner' ? 'text-cyan-400' : 'text-rose-500'}`}>
                      {card.side === 'Runner' ? 'RUNNER (러너)' : 'CORP (기업)'}
                    </span>
                  </div>
                </div>

                {/* Main Description */}
                <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-line font-light bg-black/20 p-4 rounded-lg border border-slate-900/50 mb-4 min-h-[100px]">
                  {formatText(card.text)}
                </div>

                {/* ICE Security Subroutines */}
                {card.type === 'ICE' && card.subroutines && (
                  <div className="flex flex-col gap-2 mt-4 bg-rose-950/10 p-3 rounded-lg border border-rose-900/30">
                    <div className="text-xs uppercase font-orbitron font-extrabold tracking-wider text-rose-500 flex items-center gap-1.5">
                      <span>🛡️ SECURITY SUBROUTINES (보안 서브루틴):</span>
                    </div>
                    {card.subroutines.map((sub, idx) => (
                      <div key={sub.id} className="text-xs bg-slate-950/60 p-2 border-l-3 border-rose-500 rounded-sm font-light text-slate-300 flex items-start gap-2">
                        <span className="text-rose-500 font-orbitron font-bold">↳ [{idx + 1}]</span>
                        <span>{sub.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active tokens summary */}
                {(card.advancedCounters > 0 || card.hostedCredits > 0 || card.hostedCounters > 0) && (
                  <div className="flex flex-wrap gap-2.5 mt-4 text-xs font-orbitron font-semibold">
                    {card.advancedCounters > 0 && <span className="text-red-400 bg-red-950/30 px-2.5 py-1 rounded border border-red-900/50">발전 카운터: {card.advancedCounters}</span>}
                    {card.hostedCredits > 0 && <span className="text-amber-400 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/50">호스팅 크레딧: {card.hostedCredits}🪙</span>}
                    {card.hostedCounters > 0 && <span className="text-cyan-400 bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-900/50">파워 카운터: {card.hostedCounters}</span>}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 font-orbitron border-t border-slate-900 pt-3 mt-4 text-right">
                SYSTEM GATEWAY • NETRUNNER DB ORIGINAL DATA
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
