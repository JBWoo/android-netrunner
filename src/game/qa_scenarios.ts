import { createInitialState, executeBasicAction, installCard, paySkunkworksCost, playRunEventCard, initiateRun, resolveAccessCard, scoreAgenda, rezCard, playCard, executeResourceClick, endRunnerTurn, transitionRun, resolveSubroutines } from './engine';
import { createCardInstance } from './cards';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

console.log('🧪 ===============================================');
console.log('🧪    NETRUNNER CARD MECHANICS QA SCENARIO TESTER  ');
console.log('🧪 ===============================================');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [SUCCESS] - ${name}`);
    passedTests++;
  } catch (error: any) {
    console.error(`❌ [FAILED]  - ${name}`);
    console.error(`   👉 Reason: ${error.message}`);
  }
}

// ----------------------------------------------------
// TEST 1: Basic Actions (Click & Credit)
// ----------------------------------------------------
runTest('Basic Actions: Gain credit and draw card', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 5;
  state.phase = 'runner-action';

  const startHand = state.runner.hand.length;

  // 크레딧 획득 액션
  state = executeBasicAction(state, 'gain-credit');
  assert(state.runner.credits === 6, 'Credits should be 6');
  assert(state.runner.clicks === 3, 'Clicks should be 3');

  // 드로우 액션
  state = executeBasicAction(state, 'draw-card');
  assert(state.runner.hand.length === startHand + 1, `Hand size should increase by 1 (was ${startHand})`);
  assert(state.runner.clicks === 2, 'Clicks should be 2');
});

// ----------------------------------------------------
// TEST 2: Carmen Discount Mechanics
// ----------------------------------------------------
runTest('Carmen Discount: 5 credits normally, 3 credits if successful run this turn', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';

  // Carmen 카드 생성 후 러너 패에 주입
  const carmen = createCardInstance('carmen');
  state.runner.hand.push(carmen);

  // 1) 런 성공 전 설치 시
  state.runner.successfulRunThisTurn = false;
  let tempState = installCard(state, carmen.id, '');
  
  // 설치 후 크레딧 = 10 - 5 = 5🪙
  assert(tempState.runner.credits === 5, `Normal install should cost 5🪙 (left: ${tempState.runner.credits})`);
  assert(tempState.runner.rig.some(c => c.codeName === 'carmen'), 'Carmen must be installed on RIG');

  // 2) 런 성공 후 설치 시
  state.runner.successfulRunThisTurn = true;
  let tempState2 = installCard(state, carmen.id, '');
  
  // 설치 후 크레딧 = 10 - 3 = 7🪙
  assert(tempState2.runner.credits === 7, `Discounted install should cost 3🪙 (left: ${tempState2.runner.credits})`);
  assert(tempState2.runner.rig.some(c => c.codeName === 'carmen'), 'Carmen must be installed on RIG');
});

// ----------------------------------------------------
// TEST 3: Overclock Temporary Credits
// ----------------------------------------------------
runTest('Overclock: Play event & use temporary credits', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 5;
  state.phase = 'runner-action';

  // Overclock 카드 생성 및 주입
  const overclock = createCardInstance('overclock');
  state.runner.hand.push(overclock);

  // Overclock 플레이 (비용: 1🪙, 1⚡ 소모)
  state = playRunEventCard(state, overclock.id, 'HQ');

  assert(state.runner.credits === 4, `Overclock play should cost 1🪙 (left: ${state.runner.credits})`);
  assert(state.runner.clicks === 3, 'Clicks should be 3');
  assert(state.run !== null, 'A run must be active');
  assert(state.run!.viaCardCode === 'overclock', 'Run must be flagged as via overclock');
  assert(state.run!.overclockCredits === 5, 'Should have 5 temporary credits');

  // 임시 크레딧을 이용한 차감 모의테스트 (Manegarm Skunkworks 비용 지불 시)
  state.run!.needSkunkworksPay = true;
  state = paySkunkworksCost(state, 'credits');

  // Skunkworks 비용 5🪙 중 5🪙가 전부 임시 크레딧에서 차감되므로, 러너 실물 크레딧은 여전히 4🪙여야 함
  assert(state.runner.credits === 4, `Runner credits should remain 4🪙 (was ${state.runner.credits})`);
  assert(state.run!.overclockCredits === 0, `Temporary credits should be exhausted (was ${state.run!.overclockCredits})`);
});

// ----------------------------------------------------
// TEST 4: Jailbreak Draw & Access Bonus
// ----------------------------------------------------
runTest('Jailbreak: Successful run gives 1 draw and extra access', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 5;
  state.phase = 'runner-action';

  // HQ에 아젠다 카드 인위적 추가 (액세스용)
  const agenda = createCardInstance('offworld_office');
  state.corp.hand.push(agenda);

  const startHand = state.runner.hand.length;

  // Jailbreak 카드 생성 및 주입
  const jailbreak = createCardInstance('jailbreak');
  state.runner.hand.push(jailbreak);

  // Jailbreak 플레이 (비용: 1🪙, 1⚡ 소모)
  state = playRunEventCard(state, jailbreak.id, 'HQ');

  // ICE가 없는 HQ로의 런이므로 성공(success) 단계로 자동 도약
  assert(state.run !== null, 'A run must be active');
  assert(state.run!.phase === 'breach', `Run phase should transition to breach (is: ${state.run!.phase})`);
  
  // Jailbreak 성공 시점에 1 드로우가 연동되었으므로 러너 손패가 1장(Jailbreak 낸 크기 감안 시 동일) 증가함
  assert(state.runner.hand.length === startHand + 1, `Hand size check after Jailbreak successful run (was ${state.runner.hand.length})`);

  // HQ에 1개의 의제 카드가 포함되어 있는지 및 Jailbreak 2장 액세스 기능 활성화로 카드가 최소 1개 이상 액세스 목록에 등록되었는지 검증
  assert(state.run!.accessedCards.length > 0, 'Accessed cards list should not be empty');
});

// ----------------------------------------------------
// TEST 5: Red Team Credits Gain
// ----------------------------------------------------
runTest('Red Team: Successful central run awards hosted credits', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';

  // Red Team 리소스 생성 및 설치
  const redTeam = createCardInstance('red_team');
  state.runner.hand.push(redTeam);

  state = installCard(state, redTeam.id, ''); // 설치 비용: 5🪙
  assert(state.runner.credits === 5, 'Credits should be 5🪙 after install');

  // 설치된 Red Team 찾아서 hostedCredits 확인
  const installedRedTeam = state.runner.rig.find(c => c.codeName === 'red_team');
  assert(installedRedTeam !== undefined, 'Red Team should be on RIG');
  assert(installedRedTeam!.hostedCredits === 12, 'Hosted credits should be initialized to 12🪙');

  // Red Team을 통한 런 개시
  state = initiateRun(state, 'HQ', 'red_team');
  assert(state.run !== null, 'Run must be active');
  assert(state.run!.viaCardCode === 'red_team', 'Run must be via red_team');

  // ICE 없는 서버이므로 런 성공 후 바로 Breach 진입
  assert(state.run!.phase === 'breach', 'Run should be in breach');

  // 액세스 완료하여 런이 종료되는 시점 모의
  state = resolveAccessCard(state, false); // 의제가 없는 경우
  // 런이 끝나면 endRun이 호출되어 Red Team 보상이 지급됨
  
  const updatedRedTeam = state.runner.rig.find(c => c.codeName === 'red_team');
  assert(updatedRedTeam!.hostedCredits === 9, `Red Team hosted credits should decrease to 9🪙 (is: ${updatedRedTeam!.hostedCredits})`);
  assert(state.runner.credits === 8, `Runner credits should increase to 8🪙 (is: ${state.runner.credits})`);
});

// ----------------------------------------------------
// TEST 6: ICE Stacking Cost Rules
// ----------------------------------------------------
runTest('ICE Stacking Cost: cumulative install costs (0, 1, 2)', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Corp';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  state.phase = 'corp-action';

  const ice1 = createCardInstance('palisade');
  const ice2 = createCardInstance('whitespace');
  const ice3 = createCardInstance('diviner');

  state.corp.hand.push(ice1, ice2, ice3);

  // 1) 첫 번째 ICE 설치 (설치비용: 0🪙)
  state = installCard(state, ice1.id, 'HQ');
  assert(state.corp.credits === 10, `First ICE install cost is 0🪙 (left: ${state.corp.credits})`);
  assert(state.servers.HQ.ice.length === 1, 'HQ should have 1 ICE');

  // 2) 두 번째 ICE 설치 (설치비용: 1🪙)
  state = installCard(state, ice2.id, 'HQ');
  assert(state.corp.credits === 9, `Second ICE install cost is 1🪙 (left: ${state.corp.credits})`);
  assert(state.servers.HQ.ice.length === 2, 'HQ should have 2 ICEs');

  // 3) 세 번째 ICE 설치 (설치비용: 2🪙)
  state = installCard(state, ice3.id, 'HQ');
  assert(state.corp.credits === 7, `Third ICE install cost is 2🪙 (left: ${state.corp.credits})`);
  assert(state.servers.HQ.ice.length === 3, 'HQ should have 3 ICEs');
});

// ----------------------------------------------------
// TEST 7: Agenda Scoring/Stealing Effects
// ----------------------------------------------------
runTest('Agenda Scoring: Offworld Office awards 7 credits', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Corp';
  state.corp.credits = 5;
  state.corp.clicks = 3;
  state.phase = 'corp-action';

  const agenda = createCardInstance('offworld_office');
  state.servers.HQ.root.push(agenda);
  agenda.advancedCounters = 4;

  state = scoreAgenda(state, agenda.id);
  assert(state.corp.credits === 12, `Credits should be 12🪙 after scoring Offworld Office (is: ${state.corp.credits})`);
  assert(state.corp.score === 2, 'Corp should have 2 agenda points');
});

runTest('Agenda Scoring: Superconducting Hub awards 2 draws and +2 max hand size', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Corp';
  state.corp.clicks = 3;
  state.corp.maximumHandSize = 5;
  state.phase = 'corp-action';

  const agenda = createCardInstance('superconducting_hub');
  state.servers.HQ.root.push(agenda);
  agenda.advancedCounters = 3;

  const initialHandSize = state.corp.hand.length;

  state = scoreAgenda(state, agenda.id);
  assert(state.corp.maximumHandSize === 7, `Max hand size should be 7 (is: ${state.corp.maximumHandSize})`);
  assert(state.corp.hand.length === initialHandSize + 2, `Hand size should increase by 2 (was ${initialHandSize}, is ${state.corp.hand.length})`);
});

runTest('Agenda Scoring/Stealing: Send a Message rez fee reduction', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';

  const ice = createCardInstance('palisade');
  state.servers.RD.ice.push(ice);
  assert(state.servers.RD.ice[0].rezzed === false, 'ICE must start unrezzed');

  const agenda = createCardInstance('send_a_message');
  state.servers.HQ.root.push(agenda);
  agenda.advancedCounters = 5;

  state = scoreAgenda(state, agenda.id);
  assert(state.servers.RD.ice[0].rezzed === true, 'Palisade ICE should be rezzed automatically');
});

// ----------------------------------------------------
// TEST 8: Corp Assets (Nico Campaign & Regolith Mining License)
// ----------------------------------------------------
runTest('Corp Asset: Nico Campaign gains 3 credits at turn start', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  const nico = createCardInstance('nico_campaign');
  state.servers.HQ.root.push(nico);
  
  state = rezCard(state, nico.id); // 비용: 2🪙
  assert(state.servers.HQ.root[0].hostedCredits === 9, 'Nico Campaign should host 9🪙');
  
  // 러너 턴 강제 변경 및 Clicks 소진 모의
  state.activePlayer = 'Runner';
  state.runner.clicks = 0;
  state.phase = 'runner-action';

  const initialCredits = state.corp.credits; // Rez비용 지불 후 Corp 크레딧
  state = endRunnerTurn(state); // Corp 턴 전환 격발 (Nico Campaign 수령 작동)
  
  assert(state.corp.credits === initialCredits + 3, `Corp credits should increase by 3🪙 (was ${initialCredits}, is ${state.corp.credits})`);
  const updatedNico = state.servers.HQ.root.find(c => c.codeName === 'nico_campaign');
  assert(updatedNico !== undefined && updatedNico.hostedCredits === 6, 'Hosted credits should be 6🪙');
});

runTest('Corp Asset: Regolith Mining License click mining', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Corp';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  state.phase = 'corp-action';
  
  const regolith = createCardInstance('regolith_mining_license');
  state.servers.HQ.root.push(regolith);
  state = rezCard(state, regolith.id); // Rez 비용 2🪙 -> 8🪙
  
  assert(state.servers.HQ.root[0].hostedCredits === 15, 'Regolith should host 15🪙');
  
  state = executeResourceClick(state, regolith.id); // 1⚡ 소모, 3🪙 수령
  assert(state.corp.credits === 11, `Corp credits should be 11🪙 (is: ${state.corp.credits})`);
  assert(state.corp.clicks === 2, 'Clicks should be 2');
  assert(state.servers.HQ.root[0].hostedCredits === 12, 'Hosted credits should be 12🪙');
});

// ----------------------------------------------------
// TEST 9: Corp Asset Trap (Urtica Cipher)
// ----------------------------------------------------
runTest('Corp Asset: Urtica Cipher trap triggers on access and inflicts net damage', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 5;
  state.corp.credits = 5;
  state.phase = 'runner-action';
  
  const trap = createCardInstance('urtica_cipher');
  state.servers['Remote 1'] = { id: 'Remote 1', name: 'Remote 1', ice: [], root: [trap] };
  trap.advancedCounters = 2; // 2발전 -> 4 데미지 유발
  
  const initialHandSize = state.runner.hand.length;
  
  state = initiateRun(state, 'Remote 1'); // ICE 없으므로 바로 breach 진입
  state = resolveAccessCard(state, true); // 액세스 수행 (러너가 폐기 처리 시도하더라도 데미지를 입어야 함)
  
  // 2발전 * 2 = 4점의 넷 데미지 -> 러너 손패가 4장 감소해야 함 (5 -> 1)
  assert(state.runner.hand.length === initialHandSize - 4, `Runner hand size should decrease by 4 (was ${initialHandSize}, is ${state.runner.hand.length})`);
  // 기업 크레딧은 작동 비용 1🪙이 차감되어 4🪙여야 함
  assert(state.corp.credits === 4, `Corp credits should decrease by 1🪙 (was 5, is ${state.corp.credits})`);
});

// ----------------------------------------------------
// TEST 10: Corp Operations (Hedge Fund & Government Subsidy)
// ----------------------------------------------------
runTest('Corp Operations: Hedge Fund & Government Subsidy', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Corp';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  state.phase = 'corp-action';
  
  const hedge = createCardInstance('hedge_fund');
  state.corp.hand.push(hedge);
  
  // Hedge Fund 플레이 (비용 5🪙 소모, 9🪙 획득)
  state = playCard(state, hedge.id);
  assert(state.corp.credits === 14, `Corp credits should be 14🪙 (is: ${state.corp.credits})`);
  
  const subsidy = createCardInstance('government_subsidy');
  state.corp.hand.push(subsidy);
  
  // Government Subsidy 플레이 (비용 10🪙 소모, 15🪙 획득)
  state = playCard(state, subsidy.id);
  assert(state.corp.credits === 19, `Corp credits should be 19🪙 (is: ${state.corp.credits})`);
});

// ----------------------------------------------------
// TEST 11: Corp Operation (Seamless Launch)
// ----------------------------------------------------
runTest('Corp Operation: Seamless Launch advances card without cost/click', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Corp';
  state.corp.clicks = 3;
  state.corp.credits = 5;
  state.phase = 'corp-action';
  
  const agenda = createCardInstance('offworld_office');
  state.servers.HQ.root.push(agenda); // 이미 설치되어 있음
  
  const seamless = createCardInstance('seamless_launch');
  state.corp.hand.push(seamless);
  
  // Seamless Launch 플레이 (비용 1🪙 소모, Offworld Office에 카운터 2개 배치)
  state = playCard(state, seamless.id);
  
  const target = state.servers.HQ.root.find(c => c.codeName === 'offworld_office');
  assert(target!.advancedCounters === 2, `Agenda advancedCounters should be 2 (is: ${target!.advancedCounters})`);
  // Seamless Launch 플레이 비용 1🪙만 소모되고, 발전 비용은 따로 들지 않았어야 함 -> credits = 4🪙
  assert(state.corp.credits === 4, `Corp credits should be 4🪙 (is: ${state.corp.credits})`);
  assert(state.corp.clicks === 2, 'Clicks should be 2');
});

// ----------------------------------------------------
// TEST 12: Corp ICE Subroutines (Whitespace)
// ----------------------------------------------------
runTest('Corp ICE: Whitespace loses runner credits and ETR', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';
  
  // Whitespace ICE 설치 및 레즈
  const whitespace = createCardInstance('whitespace');
  state.servers.HQ.ice.push(whitespace);
  state.servers.HQ.ice[0].rezzed = true;
  
  state = initiateRun(state, 'HQ');
  assert(state.run !== null, 'Run should be active');
  
  state = transitionRun(state);
  assert(state.run!.phase === 'encounter', 'Run should be in encounter');
  
  // 서브루틴 미해제 해결 시점 (Whitespace 작동)
  // Whitespace 효과: 1서브루틴 3🪙 삭감, 2서브루틴 ETR (자금 6🪙 이하일 때만 ETR)
  state = resolveSubroutines(state);
  
  // 러너 자금이 10🪙 -> 7🪙 로 감소
  assert(state.runner.credits === 7, `Runner credits should be 7🪙 (is: ${state.runner.credits})`);
  // 아직 ETR 조건인 6🪙 이하가 아니었으므로 런이 통과되어 breach로 들어감
  assert(state.run!.phase === 'breach', `Run should succeed and transition to breach (is: ${state.run!.phase})`);
});

console.log('\n🧪 ===============================================');
console.log(`🧪    QA TEST SUITE RESULT: ${passedTests} / ${totalTests} PASSED`);
console.log('🧪 ===============================================');

if (passedTests !== totalTests) {
  throw new Error("QA Card Mechanics scenarios failed!");
}
