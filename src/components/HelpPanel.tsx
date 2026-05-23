import React, { useState } from 'react';

export const HelpPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'corp' | 'runner' | 'run' | 'cards'>('concepts');

  return (
    <div className="glass-panel border-slate-800 p-5 bg-slate-950/40 text-left flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <h3 className="font-orbitron font-extrabold text-sm text-cyan-400 tracking-wider">
            📖 NETRUNNER RULEBOOK (넷러너 가이드)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            게임 규칙과 카드의 작동 메커니즘을 상세 설명합니다.
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex bg-slate-950 p-1 rounded border border-slate-900 text-[10px] font-orbitron">
        <button
          onClick={() => setActiveTab('concepts')}
          className={`flex-1 py-1 rounded transition-all ${activeTab === 'concepts' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          기본 개념
        </button>
        <button
          onClick={() => setActiveTab('corp')}
          className={`flex-1 py-1 rounded transition-all ${activeTab === 'corp' ? 'bg-rose-950/80 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Corp 플레이
        </button>
        <button
          onClick={() => setActiveTab('runner')}
          className={`flex-1 py-1 rounded transition-all ${activeTab === 'runner' ? 'bg-cyan-950/80 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Runner 플레이
        </button>
        <button
          onClick={() => setActiveTab('run')}
          className={`flex-1 py-1 rounded transition-all ${activeTab === 'run' ? 'bg-amber-950/80 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          런(Run) 시퀀스
        </button>
      </div>

      {/* 탭 세부 내용 */}
      <div className="text-xs leading-relaxed text-slate-300 max-h-[300px] overflow-y-auto pr-1">
        
        {/* 기본 개념 탭 */}
        {activeTab === 'concepts' && (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white text-sm">Corporation VS Runner</h4>
            <p>
              넷러너는 **비대칭형 카드게임**입니다. 
              양측은 승리조건과 플레이 자원이 완전히 다르며, 서로 다른 룰로 플레이하게 됩니다.
            </p>
            <div className="border-l-2 border-amber-500 pl-3 py-1 bg-slate-900/40 my-1">
              <strong>핵심 목표: 의제(Agenda) 점수 6점 선점!</strong>
              <ul className="list-disc pl-4 mt-1 flex flex-col gap-1 text-[11px]">
                <li><strong>Corp:</strong> 원격 서버에 의제를 숨겨 설치하고, 이를 발전(Advance)시켜 득점 영역으로 가져옵니다.</li>
                <li><strong>Runner:</strong> 회사 전산망(R&D, HQ, Archives, Remote)에 런(Run)을 실행하여 의제 데이터를 해킹해 탈취합니다.</li>
              </ul>
            </div>
            <p>
              <strong>클릭(Click ⚡)과 크레딧(Credit 🪙):</strong>
              <br />
              행동을 취할 때는 ⚡을 소모하며, 카드를 깔거나 효과를 쓸 때는 🪙을 냅니다.
            </p>
          </div>
        )}

        {/* Corp 플레이 탭 */}
        {activeTab === 'corp' && (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white text-sm">Corporation (회사) 행동 규칙</h4>
            <p>Corp는 매 턴 시작 시 R&D(덱)에서 <strong>카드 1장을 의무 드로우</strong>하고 <strong>3 클릭(⚡)</strong>을 받습니다.</p>
            
            <strong className="text-slate-200 mt-1">소모 행동 (1 클릭):</strong>
            <ul className="list-disc pl-4 flex flex-col gap-1 text-[11px]">
              <li><strong>1🪙 획득</strong> 또는 <strong>카드 1장 드로우</strong></li>
              <li><strong>카드 설치 (Install):</strong> 손패에서 ICE를 서버 외곽에 올리거나, Asset/Agenda를 원격 서버 내부에 미공개(Face-down) 상태로 둡니다.</li>
              <li>
                <strong>ICE 설치 누적 세금:</strong>
                <br />
                서버에 이미 ICE가 여러 개 설치되어 있다면, 바깥쪽에 새로 심을 때마다 기존 ICE의 수만큼 크레딧을 세금으로 내야 합니다.
              </li>
              <li><strong>카드 발전 (Advance):</strong> 원격 서버에 설치된 Agenda나 Advance 가능한 카드에 1⚡과 1🪙을 지불해 발전 카운터를 1개 올립니다.</li>
              <li><strong>작전(Operation) 플레이:</strong> Play Cost를 지불하고 득점 또는 자산 효과를 얻습니다.</li>
            </ul>

            <strong className="text-slate-200 mt-1">무소모 행동 (언제든 가동):</strong>
            <ul className="list-disc pl-4 flex flex-col gap-1 text-[11px]">
              <li><strong>카드 Rez(활성화):</strong> 자산/업그레이드를 비용을 지불하고 앞면으로 공개합니다. (ICE는 런 도중 러너가 접근할 때만 Rez 가능)</li>
              <li><strong>의제 득점(Score):</strong> 발전 카운터가 요구 수치 이상 쌓인 의제를 내 득점 영역으로 가져옵니다.</li>
            </ul>
          </div>
        )}

        {/* Runner 플레이 탭 */}
        {activeTab === 'runner' && (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white text-sm">Runner (러너) 행동 규칙</h4>
            <p>Runner는 <strong>4 클릭(⚡)</strong>을 받고 턴을 시작하며 의무 드로우는 없습니다.</p>
            
            <strong className="text-slate-200 mt-1">소모 행동 (1 클릭):</strong>
            <ul className="list-disc pl-4 flex flex-col gap-1 text-[11px]">
              <li><strong>1🪙 획득</strong> 또는 <strong>카드 1장 드로우</strong></li>
              <li><strong>카드 설치 (Install):</strong> 프로그램(브레이커), 하드웨어, 리소스를 🪙을 내고 자신의 Rig(장비창)에 설치합니다.</li>
              <li><strong>메모리 유닛(🧠/MU) 한도:</strong> 설치 가능한 프로그램의 총 메모리는 기본 4 MU(콘솔 Pennyshaver 장착 시 5 MU)를 넘길 수 없습니다.</li>
              <li><strong>이벤트(Event) 플레이:</strong> 플레이 비용을 지불하고 강력한 일회성 액션을 실행합니다.</li>
              <li><strong>런 실행 (Run):</strong> Corp의 특정 서버를 지정해 공격을 들어갑니다.</li>
            </ul>

            <strong className="text-slate-200 mt-1">브리치 시 카드 파괴(Trash):</strong>
            <p className="text-[11px]">
              해킹 도중 회사 자산이나 업그레이드를 조우했을 때, 카드 우측 하단에 명시된 Trash 비용(🪙)을 러너가 지불하면 카드를 파괴하여 Corp의 아카이브로 직행시킬 수 있습니다.
            </p>
          </div>
        )}

        {/* 런 시퀀스 탭 */}
        {activeTab === 'run' && (
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white text-sm">런(Run) 공격 및 방어 시퀀스</h4>
            <p>런은 넷러너의 가장 핵심적이고 역동적인 메커니즘입니다.</p>
            
            <ol className="list-decimal pl-4 flex flex-col gap-2 text-[11px]">
              <li>
                <strong>ICE 접근 (Approach):</strong>
                <br />
                러너가 서버를 가로막는 ICE에 도달합니다. Corp는 이 ICE를 레즈(Rez)할 기회를 가지며, Rez 비용을 지불하지 않으면 러너는 그대로 통과합니다.
              </li>
              <li>
                <strong>ICE 조우 (Encounter):</strong>
                <br />
                Rez된 ICE와 조우합니다. 러너는 **ICE의 강도(Strength)**와 같거나 높은 **아이스브레이커(Icebreaker)**를 지정해 강도를 올린 후, 브레이커의 해제 명령으로 ICE에 탑재된 모든 **서브루틴(↳)**을 격파해야 합니다.
              </li>
              <li>
                <strong>서브루틴 해결 (Resolve):</strong>
                <br />
                격파되지 않은 서브루틴 효과가 순서대로 실행됩니다.
                <br />
                <span className="text-rose-400">↳ 런을 종료합니다:</span> 런이 즉각 실패로 종결됩니다.
                <br />
                <span className="text-rose-400">↳ 넷 데미지를 입힙니다:</span> 러너는 손패에서 카드를 무작위로 버려야 합니다. 손패가 없는 상태에서 데미지를 받으면 플랫라인(사망)하여 Corp가 즉시 승리합니다.
              </li>
              <li>
                <strong>통과 및 잭아웃 (Pass & Jack Out):</strong>
                <br />
                ICE의 위협을 견뎌내고 통과하면, 러너는 다음 안쪽 ICE에 계속 접근할지, 아니면 안전하게 런을 포기하고 도망칠지(잭아웃)를 선택할 수 있습니다.
              </li>
              <li>
                <strong>서버 침입 성공 (Success & Breach):</strong>
                <br />
                마지막 방어선을 뚫고 서버 내부에 진입해 카드를 열람(Access)합니다. Agenda가 노출되면 무상으로 훔칠 수 있습니다.
              </li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
};
