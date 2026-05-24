import { createInitialState, executeBasicAction, installCard, paySkunkworksCost, playRunEventCard, initiateRun, resolveAccessCard, scoreAgenda, rezCard, playCard, executeResourceClick, endRunnerTurn, transitionRun, resolveSubroutines, boostBreakerStrength, continueAfterKarunaSub, jackOut, breakSubroutine, takePennyshaverCredits, endRun, giveTag, swapIce, retrieveCardFromArchives, advanceCard, startRunnerTurn, getBreakerStats, resolveNbnRealityPlusChoice, useLeech, refreshRunnerMemory, resolveTraceRunnerBid, resolveTraceCorpBid } from './engine';
import { createCardInstance, CARD_DATABASE } from './cards';

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

  // Jailbreak 플레이 (비용: 0🪙, 1⚡ 소모)
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

// ----------------------------------------------------
// TEST 13: Corp Asset (Urtica Cipher with 0 advancedCounters)
// ----------------------------------------------------
runTest('Corp Asset: Urtica Cipher with 0 advancedCounters inflicts 2 net damage', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 5;
  state.corp.credits = 5;
  state.phase = 'runner-action';
  
  const trap = createCardInstance('urtica_cipher');
  state.servers['Remote 1'] = { id: 'Remote 1', name: 'Remote 1', ice: [], root: [trap] };
  trap.advancedCounters = 0; // 0발전
  
  const initialHandSize = state.runner.hand.length;
  
  state = initiateRun(state, 'Remote 1');
  state = resolveAccessCard(state, true);
  
  // 0발전이지만 최소 하한선 2점 데미지가 들어와야 함
  assert(state.runner.hand.length === initialHandSize - 2, `Runner hand size should decrease by 2 (was ${initialHandSize}, is ${state.runner.hand.length})`);
  assert(state.corp.credits === 4, `Corp credits should decrease by 1🪙 (was 5, is ${state.corp.credits})`);
});

// ----------------------------------------------------
// TEST 14: Corp ICE (Karunā sequential resolution and jackout window)
// ----------------------------------------------------
runTest('Corp ICE: Karunā sequential resolution and jackout window', () => {
  let state = createInitialState('runner-human', 'medium'); // human player
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';
  
  const karuna = createCardInstance('karuna');
  state.servers.HQ.ice.push(karuna);
  state.servers.HQ.ice[0].rezzed = true;
  
  state = initiateRun(state, 'HQ');
  state = transitionRun(state); // approach -> encounter
  
  const initialHandSize = state.runner.hand.length;
  
  // 첫 번째 서브루틴 격발 (2점 데미지 및 잭아웃 윈도우 활성화)
  state = resolveSubroutines(state);
  
  assert(state.run!.karunaJackoutWindow === true, 'karunaJackoutWindow should be active');
  assert(state.runner.hand.length === initialHandSize - 2, `Runner hand size should decrease by 2 (was ${initialHandSize}, is ${state.runner.hand.length})`);
  
  // 잭아웃 결정 (continueAfterKarunaSub(state, true))
  let jackoutState = continueAfterKarunaSub(state, true);
  assert(jackoutState.run === null, 'Run should end after jackout');
  
  // 런 계속 결정 (continueAfterKarunaSub(state, false))
  let continueState = continueAfterKarunaSub(state, false);
  assert(continueState.run!.karunaJackoutWindow === false, 'karunaJackoutWindow should be closed');
  // 두 번째 서브루틴 격발(데미지) 후 ETR이 없으므로 breach 진입
  assert(continueState.run!.phase === 'breach', `Run should succeed and transition to breach (is: ${continueState.run!.phase})`);
});

// ----------------------------------------------------
// TEST 15: ICE Encounter end / Run end resets temporary strength boost
// ----------------------------------------------------
runTest('ICE Encounter: End of encounter/run resets temporary strength boost', () => {
  let state = createInitialState('runner-human', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';
  
  const cleaver = createCardInstance('cleaver');
  state.runner.rig.push(cleaver);
  
  const ice = createCardInstance('palisade'); // Barrier
  state.servers.HQ.ice.push(ice);
  state.servers.HQ.ice[0].rezzed = true;
  
  state = initiateRun(state, 'HQ');
  state = transitionRun(state); // approach -> encounter
  
  // 강도 올리기 (Cleaver id로 1 상승)
  const cleaverId = state.runner.rig[0].id;
  state = boostBreakerStrength(state, cleaverId);
  
  assert(state.run!.breakerStrengthBoost?.[cleaverId] === 1, 'Cleaver temporary strength boost should be 1');
  
  // ETR을 막기 위해 서브루틴 브레이크
  state.run!.subroutines.forEach(sub => {
    state = breakSubroutine(state, sub.id);
  });
  
  // ICE 통과 시 강도 초기화 확인
  state = resolveSubroutines(state); // 서브루틴 해결 후 passIce 실행
  assert(state.run !== null, 'Run should still be active');
  assert(state.run!.breakerStrengthBoost?.[cleaverId] === undefined, 'Strength boost should be reset after passing ICE');
});

// ----------------------------------------------------
// TEST 16: Program (Mayfly is only trashed when actually used)
// ----------------------------------------------------
runTest('Program: Mayfly is only trashed when actually used', () => {
  let state = createInitialState('runner-human', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';
  
  const mayfly = createCardInstance('mayfly');
  state.runner.rig.push(mayfly);
  const mayflyId = mayfly.id;
  
  const ice = createCardInstance('palisade');
  state.servers.HQ.ice.push(ice);
  state.servers.HQ.ice[0].rezzed = true;
  
  // 1. Mayfly 미사용 시 런 종료 후 파괴 안 됨
  let state1 = initiateRun(state, 'HQ');
  state1 = jackOut(state1);
  assert(state1.runner.rig.some(c => c.id === mayflyId), 'Mayfly should not be trashed if not used');
  
  // 2. Mayfly 사용 시 런 종료 후 파괴 됨
  let state2 = initiateRun(state, 'HQ');
  state2 = transitionRun(state2); // approach -> encounter
  state2 = boostBreakerStrength(state2, mayflyId); // Mayfly 사용
  state2 = jackOut(state2);
  assert(!state2.runner.rig.some(c => c.id === mayflyId), 'Mayfly should be trashed if used');
  assert(state2.runner.discard.some(c => c.id === mayflyId), 'Mayfly should be in discard pile (Heap)');
});

// ----------------------------------------------------
// TEST 17: Resource (Verbal Plasticity draws extra card once per turn)
// ----------------------------------------------------
runTest('Resource: Verbal Plasticity draws extra card on first draw of the turn', () => {
  let state = createInitialState('runner-human', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';
  
  const vp = createCardInstance('verbal_plasticity');
  state.runner.rig.push(vp);
  
  const initialHandSize = state.runner.hand.length;
  
  // 첫 번째 드로우 (1클릭 소모 -> 기본 1장 + VP 효과 1장 = 총 2장 드로우)
  state = executeBasicAction(state, 'draw-card');
  assert(state.runner.hand.length === initialHandSize + 2, `Runner hand should increase by 2 (was ${initialHandSize}, is ${state.runner.hand.length})`);
  assert(state.runner.clicks === 3, 'Clicks should be 3');
  
  // 두 번째 드로우 (1클릭 소모 -> 기본 1장만 드로우)
  state = executeBasicAction(state, 'draw-card');
  assert(state.runner.hand.length === initialHandSize + 3, `Runner hand should increase by 1 (was ${initialHandSize + 2}, is ${state.runner.hand.length})`);
  assert(state.runner.clicks === 2, 'Clicks should be 2');
});

// ----------------------------------------------------
// TEST 21: Hardware Pennyshaver Console Credit Accumulation and Retrieval
// ----------------------------------------------------
runTest('Hardware: Pennyshaver Console credit accumulation and retrieval', () => {
  let state = createInitialState('runner-human', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.phase = 'runner-action';
  
  const pennyshaver = createCardInstance('pennyshaver');
  state.runner.rig.push(pennyshaver);
  
  // R&D에 런을 성공시킴
  state = initiateRun(state, 'RD');
  state = transitionRun(state); // approach -> breach (no ICE)
  state = resolveAccessCard(state, true); // access 수행하여 run success 상태로 endRun을 태움
  state = endRun(state);
  
  // Pennyshaver에 크레딧이 1개 올라갔어야 함
  const p1 = state.runner.rig.find(c => c.codeName === 'pennyshaver');
  assert(p1 !== undefined, 'Pennyshaver should be installed');
  assert(p1!.hostedCredits === 1, `Pennyshaver should have 1 hosted credit (is: ${p1!.hostedCredits})`);
  
  // 같은 턴에 HQ에 한 번 더 성공적인 런을 함
  state = initiateRun(state, 'HQ');
  state = transitionRun(state);
  state = resolveAccessCard(state, true);
  state = endRun(state);
  
  // 턴당 처음만 작동하므로 여전히 크레딧은 1개여야 함
  const p2 = state.runner.rig.find(c => c.codeName === 'pennyshaver');
  assert(p2!.hostedCredits === 1, `Pennyshaver should still have 1 hosted credit (is: ${p2!.hostedCredits})`);
  
  // 클릭을 사용해 Pennyshaver에서 크레딧 수령
  const initialRunnerCredits = state.runner.credits; // 10
  const initialRunnerClicks = state.runner.clicks;
  
  state = takePennyshaverCredits(state, p2!.id);
  
  const p3 = state.runner.rig.find(c => c.codeName === 'pennyshaver');
  assert(p3!.hostedCredits === 0, `Pennyshaver hosted credits should be 0 after retrieval`);
  assert(state.runner.credits === initialRunnerCredits + 1, `Runner credits should increase by 1 (is: ${state.runner.credits})`);
  assert(state.runner.clicks === initialRunnerClicks - 1, `Runner clicks should decrease by 1 (is: ${state.runner.clicks})`);
});

// ----------------------------------------------------
// TEST 22: Faction Deck Selection and Identity Initialization
// ----------------------------------------------------
runTest('Faction Deck: Verify deck initialization and Identity attachment for each faction', () => {
  // 1. Shaper (Tao) vs Jinteki (Restoring Humanity)
  let state = createInitialState('runner-human', 'medium', 'tao', 'jinteki');
  assert(state.runner.identity !== null, 'Runner identity should not be null');
  assert(state.runner.identity!.codeName === 'tao_salonga_telepresence_magician', 'Runner identity should be Tao Salonga');
  assert(state.corp.identity !== null, 'Corp identity should not be null');
  assert(state.corp.identity!.codeName === 'jinteki_restoring_humanity', 'Corp identity should be Jinteki');
  
  // 2. Anarch (Loup) vs Haas-Bioroid (Precision Design)
  state = createInitialState('runner-human', 'medium', 'loup', 'haas');
  assert(state.runner.identity!.codeName === 'rene_loup_arcemont_party_animal', 'Runner identity should be Rene Loup');
  assert(state.corp.identity!.codeName === 'haas_bioroid_precision_design', 'Corp identity should be Haas-Bioroid');
  
  // 3. Criminal (Zahya) vs NBN (Reality Plus)
  state = createInitialState('runner-human', 'medium', 'zahya', 'nbn');
  assert(state.runner.identity!.codeName === 'zahya_sadeghi_versatile_smuggler', 'Runner identity should be Zahya');
  assert(state.corp.identity!.codeName === 'nbn_reality_plus', 'Corp identity should be NBN');
  
  // 4. Weyland (Built to Last)
  state = createInitialState('runner-human', 'medium', 'tao', 'weyland');
  assert(state.corp.identity!.codeName === 'weyland_consortium_built_to_last', 'Corp identity should be Weyland');
});

// ----------------------------------------------------
// TEST 23: Identity - Jinteki Restoring Humanity
// ----------------------------------------------------
runTest('Identity: Jinteki Restoring Humanity gains credit if facedown card in Archives', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'jinteki');
  state.corp.credits = 5;
  
  // 1. startRunnerTurn with empty Archives -> no credit gain
  state = startRunnerTurn(state);
  assert(state.corp.credits === 5, `Jinteki Restoring Humanity should not gain credits if Archives is empty (credits: ${state.corp.credits})`);
  
  // 2. Add a facedown card to Archives and start runner turn
  const card = createCardInstance('hedge_fund');
  (card as any).faceup = false;
  state.corp.discard.push(card);
  
  state.corp.credits = 5;
  state = startRunnerTurn(state);
  assert(state.corp.credits === 6, `Jinteki Restoring Humanity should gain 1 credit if facedown card is in Archives (credits: ${state.corp.credits})`);
});

// ----------------------------------------------------
// TEST 24: Identity - Weyland Built to Last
// ----------------------------------------------------
runTest('Identity: Weyland Built to Last gains 2 credits on first advancement counter of a card', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'weyland');
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  
  const agenda = createCardInstance('offworld_office');
  state.corp.hand.push(agenda);
  
  state = installCard(state, agenda.id, 'New Remote');
  
  const remoteKeys = Object.keys(state.servers).filter(k => k.startsWith('Remote'));
  assert(remoteKeys.length > 0, 'A Remote server should have been created');
  const remoteKey = remoteKeys[0];
  const installedAgenda = state.servers[remoteKey].root[0];
  assert(installedAgenda !== undefined, 'Agenda should be installed in the Remote server');
  
  // 1. Advance the card for the first time
  const preCredits = state.corp.credits; // should be 10 (since installing is free of credit cost, but uses click)
  state = advanceCard(state, installedAgenda.id);
  
  // Built to last gives +2 credits. Net cost: -1 credit to advance + 2 credits from Built to Last = +1 credit.
  assert(state.corp.credits === preCredits + 1, `Weyland Built to Last should gain 2 credits on first advancement (credits: ${state.corp.credits}, was: ${preCredits})`);
  
  // 2. Advance the card a second time -> no extra credit
  const preCredits2 = state.corp.credits;
  state = advanceCard(state, installedAgenda.id);
  // Net cost: -1 credit. No Built to Last trigger.
  assert(state.corp.credits === preCredits2 - 1, `Weyland Built to Last should not trigger on second advancement (credits: ${state.corp.credits}, was: ${preCredits2})`);
});

// ----------------------------------------------------
// TEST 25: Identity - NBN Reality Plus
// ----------------------------------------------------
runTest('Identity: NBN Reality Plus gains 2 credits on first tag of the turn', () => {
  let state = createInitialState('runner-human', 'medium', 'zahya', 'nbn');
  state.corp.credits = 5;
  state.corpUsedNbnThisTurn = false;
  
  // 1. First tag
  state = giveTag(state, 1);
  assert(state.corp.credits === 7, `NBN: Reality Plus should gain 2 credits (credits: ${state.corp.credits})`);
  assert(state.corpUsedNbnThisTurn === true, 'NBN turn-once flag should be true');
  
  // 2. Second tag in same turn -> no gain
  state = giveTag(state, 1);
  assert(state.corp.credits === 7, `NBN: Reality Plus should not gain credits on second tag of the turn (credits: ${state.corp.credits})`);
});

// ----------------------------------------------------
// TEST 26: Identity - Loup (Anarch)
// ----------------------------------------------------
runTest('Identity: Loup gains 1 credit and draws 1 card on first card trash of the turn', () => {
  let state = createInitialState('runner-human', 'medium', 'loup', 'jinteki');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  
  const drawCard = createCardInstance('sure_gamble');
  state.runner.deck = [drawCard];
  const initialHandSize = state.runner.hand.length;
  
  const asset = createCardInstance('nico_campaign');
  state.corp.hand = [asset];
  
  state = initiateRun(state, 'HQ');
  state = transitionRun(state); // approach -> breach (no ICE)
  assert(state.run !== null && state.run.phase === 'breach', `Run phase should be 'breach' (is: ${state.run?.phase})`);
  
  state = resolveAccessCard(state, true); // trash = true
  
  // Loup should trigger:
  // Nico Campaign costs 2 credits to trash. So credits should be 10 - 2 (trash cost) + 1 (Loup) = 9.
  assert(state.runner.credits === 9, `Loup should have 9 credits after trashing (is: ${state.runner.credits})`);
  // Loup should draw 1 card. Hand size should be initialHandSize + 1.
  assert(state.runner.hand.length === initialHandSize + 1, `Loup should draw 1 card (hand size: ${state.runner.hand.length})`);
  assert(state.runner.hand.some(c => c.id === drawCard.id), 'Drawn card should be Sure Gamble');
  
  // 2. Trash another card in the same turn -> no gain
  state = endRun(state);
  state.runner.credits = 10;
  
  const asset2 = createCardInstance('urtica_cipher');
  state.corp.hand = [asset2];
  
  state = initiateRun(state, 'HQ');
  state = transitionRun(state);
  state = resolveAccessCard(state, true);
  
  assert(state.runner.credits === 8, `Second trash in same turn should not trigger Loup (credits: ${state.runner.credits})`);
});

// ----------------------------------------------------
// TEST 27: Identity - Zahya (Criminal)
// ----------------------------------------------------
runTest('Identity: Zahya gains credits equal to accessed cards on successful run on HQ or R&D', () => {
  let state = createInitialState('runner-human', 'medium', 'zahya', 'jinteki');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.runnerUsedZahyaThisTurn = false;
  
  const asset = createCardInstance('nico_campaign');
  const agenda = createCardInstance('offworld_office');
  state.corp.hand = [asset, agenda];
  
  state = initiateRun(state, 'HQ');
  state = transitionRun(state);
  
  const accessedCount = state.run!.accessedCards.length;
  assert(accessedCount === 1, `HQ should access 1 card by default (accessedCount: ${accessedCount})`);
  
  state = resolveAccessCard(state, false);
  
  // When run ends, Zahya should trigger and award accessedCount credits (1 credit).
  // Credits should be 10 + 1 = 11.
  assert(state.runner.credits === 11, `Zahya should gain credits equal to accessed count (credits: ${state.runner.credits})`);
  assert(state.runnerUsedZahyaThisTurn === true, 'Zahya flag should be true');
});

// ----------------------------------------------------
// TEST 28: Identity - Tao Salonga (Shaper)
// ----------------------------------------------------
runTest('Identity: Tao Salonga triggers ICE swap phase when stealing an agenda', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'jinteki');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  
  const ice1 = createCardInstance('palisade');
  const ice2 = createCardInstance('whitespace');
  state.servers.HQ.ice = [ice1];
  state.servers.RD.ice = [ice2];
  
  const agenda = createCardInstance('offworld_office');
  state.corp.hand = [agenda];
  
  state = initiateRun(state, 'HQ');
  state = transitionRun(state);
  
  state = resolveAccessCard(state, false);
  assert(state.phase === 'tao-swap-ice', `Phase should transition to 'tao-swap-ice' (is: ${state.phase})`);
  
  state = swapIce(state, ice1.id, ice2.id);
  
  assert(state.servers.HQ.ice[0].id === ice2.id, 'HQ ICE should now be Whitespace');
  assert(state.servers.RD.ice[0].id === ice1.id, 'R&D ICE should now be Palisade');
  
  assert(state.phase === 'runner-action', `Phase should restore to 'runner-action' (is: ${state.phase})`);
});

// ----------------------------------------------------
// TEST 29: Identity - Haas-Bioroid Precision Design
// ----------------------------------------------------
runTest('Identity: Haas-Bioroid Precision Design hand limit and score card retrieval', () => {
  let state = createInitialState('runner-human', 'medium', 'loup', 'haas');
  assert(state.corp.maximumHandSize === 6, `Haas-Bioroid maximum hand size should be 6 (is: ${state.corp.maximumHandSize})`);
  
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  
  const operation = createCardInstance('hedge_fund');
  state.corp.discard.push(operation);
  
  const agenda = createCardInstance('offworld_office');
  state.corp.hand.push(agenda);
  state = installCard(state, agenda.id, 'New Remote');
  
  const remoteKeys = Object.keys(state.servers).filter(k => k.startsWith('Remote'));
  const remoteKey = remoteKeys[0];
  const installedAgenda = state.servers[remoteKey].root[0];
  
  installedAgenda.advancedCounters = 4;
  
  state = scoreAgenda(state, installedAgenda.id);
  
  assert(state.phase === 'hb-retrieve-card', `Phase should transition to 'hb-retrieve-card' (is: ${state.phase})`);
  
  state = retrieveCardFromArchives(state, operation.id);
  
  assert(state.corp.hand.some(c => c.id === operation.id), 'Retrieved card should be in hand');
  assert(!state.corp.discard.some(c => c.id === operation.id), 'Retrieved card should not be in discard');
  
  assert(state.phase === 'corp-action', `Phase should restore to 'corp-action' (is: ${state.phase})`);
});

// TEST 30: Program - Marjanah: break cost changes if successful run occurred
runTest('Program: Marjanah successful run break cost discount', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  
  // Install Marjanah
  const marjanah = createCardInstance('marjanah');
  state.runner.hand.push(marjanah);
  state = installCard(state, marjanah.id, 'rig');
  const installedMarjanah = state.runner.rig.find(c => c.codeName === 'marjanah')!;
  
  // 1. Without successful run, check stats -> breakCost should be 2
  const statsNoRun = getBreakerStats(state, installedMarjanah);
  assert(statsNoRun.breakCost === 2, `Marjanah break cost should be 2 without successful run (is: ${statsNoRun.breakCost})`);
  
  // 2. Set successfulRunThisTurn to true, check stats -> breakCost should be 1
  state.runner.successfulRunThisTurn = true;
  const statsRun = getBreakerStats(state, installedMarjanah);
  assert(statsRun.breakCost === 1, `Marjanah break cost should be 1 after successful run (is: ${statsRun.breakCost})`);
});

// TEST 31: Program - Buzzsaw: boost strength & multi subroutine break
runTest('Program: Buzzsaw boost and multi subroutine break', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 14;
  
  // Install Buzzsaw
  const buzzsaw = createCardInstance('buzzsaw');
  state.runner.hand.push(buzzsaw);
  state = installCard(state, buzzsaw.id, 'rig');
  const installedBuzzsaw = state.runner.rig.find(c => c.codeName === 'buzzsaw')!;
  
  // Get stats
  const stats = getBreakerStats(state, installedBuzzsaw);
  assert(stats.baseStrength === 3, 'Buzzsaw base strength should be 3');
  assert(stats.boostAmt === 1, 'Buzzsaw boostAmt should be 1');
  assert(stats.boostCost === 3, 'Buzzsaw boostCost should be 3');
  assert(stats.breakCost === 1, 'Buzzsaw breakCost should be 1');
  assert(stats.breakLimit === 2, 'Buzzsaw breakLimit should be 2');
  
  // Setup encounter with a Code Gate ICE with 2 subroutines
  const ice = createCardInstance('diviner'); // Code Gate, strength 3, 1 sub
  ice.subroutines!.push({ id: 'diviner_sub_2', text: 'Second subroutine', broken: false, effectType: 'end-run' });
  state.servers.HQ.ice.push(ice);
  state.servers.HQ.ice[0].rezzed = true;
  
  state = initiateRun(state, 'HQ');
  state = transitionRun(state); // approach -> encounter
  
  // Break code gate subroutines using Buzzsaw (breaks 2 subs for 1 credit)
  state = breakSubroutine(state, ice.subroutines![0].id, installedBuzzsaw.id);
  assert(state.run!.subroutines[0].broken === true, 'First subroutine should be broken');
  assert(state.run!.subroutines[1].broken === true, 'Second subroutine should be broken because Buzzsaw breaks 2 at once');
  assert(state.runner.credits === 9, `Runner should have spent 1 credit breaking (has: ${state.runner.credits})`);
});

// TEST 32: Program - Echelon: passive strength and boost cost
runTest('Program: Echelon strength scaling and boost cost', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 20;
  
  // Install Echelon and Cleaver to have 2 icebreakers
  const echelon = createCardInstance('echelon');
  const cleaver = createCardInstance('cleaver');
  state.runner.hand.push(echelon, cleaver);
  state = installCard(state, echelon.id, 'rig');
  state = installCard(state, cleaver.id, 'rig');
  
  const installedEchelon = state.runner.rig.find(c => c.codeName === 'echelon')!;
  
  // Stats check: base strength should scale with icebreaker count (2 installed)
  const stats = getBreakerStats(state, installedEchelon);
  assert(stats.baseStrength === 2, `Echelon strength should scale with icebreakers count (is: ${stats.baseStrength})`);
  assert(stats.boostAmt === 2, 'Echelon boostAmt should be 2');
  assert(stats.boostCost === 3, 'Echelon boostCost should be 3');
});

// TEST 33: Program - Unity: boost strength based on installed breakers
runTest('Program: Unity boost strength scaling', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 20;
  
  // Install Unity, Cleaver, and Mayfly (3 breakers)
  const unity = createCardInstance('unity');
  const cleaver = createCardInstance('cleaver');
  const mayfly = createCardInstance('mayfly');
  state.runner.hand.push(unity, cleaver, mayfly);
  state = installCard(state, unity.id, 'rig');
  state = installCard(state, cleaver.id, 'rig');
  state = installCard(state, mayfly.id, 'rig');
  
  const installedUnity = state.runner.rig.find(c => c.codeName === 'unity')!;
  
  // Stats check: boostAmt should scale with icebreaker count (3 installed)
  const stats = getBreakerStats(state, installedUnity);
  assert(stats.boostAmt === 3, `Unity boostAmt should scale with icebreakers count including Mayfly (is: ${stats.boostAmt})`);
});

// TEST 34: Identity - Jinteki Restoring Humanity details
runTest('Identity: Jinteki Restoring Humanity facedown flip on Archives breach', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'jinteki');
  state.corp.credits = 5;
  
  // Add a facedown card to Archives
  const card = createCardInstance('hedge_fund');
  (card as any).faceup = false;
  state.corp.discard.push(card);
  
  // Start runner turn -> Corp should gain 1 credit (now 6)
  state = startRunnerTurn(state);
  assert(state.corp.credits === 6, `Corp should gain credit from facedown card (is: ${state.corp.credits})`);
  
  // Run on Archives
  state = initiateRun(state, 'Archives');
  state = transitionRun(state); // approach -> breach (no ice)
  
  // Breach: all cards in Archives should be flipped face up
  assert(state.corp.discard[0].faceup === true, 'Facedown card in Archives should be flipped faceup on breach');
  
  // Start runner turn again -> no credit gain because card is faceup now
  state.corp.credits = 5;
  state = startRunnerTurn(state);
  assert(state.corp.credits === 5, 'Corp should not gain credit since card is now faceup');
});

// TEST 35: Identity - NBN Reality Plus: tag trigger choice
runTest('Identity: NBN Reality Plus tag trigger choice', () => {
  let state = createInitialState('corp-human', 'medium', 'tao', 'nbn'); // human corp
  state.corp.credits = 5;
  state.phase = 'setup';
  
  // Give runner a tag -> should trigger nbn-reality-plus-choice phase
  state = giveTag(state, 1);
  assert(state.phase === 'nbn-reality-plus-choice', `Phase should be nbn-reality-plus-choice (is: ${state.phase})`);
  
  // Resolve choosing credits
  state = resolveNbnRealityPlusChoice(state, 'credits');
  assert(state.corp.credits === 7, `Corp should have gained 2 credits (is: ${state.corp.credits})`);
  assert(state.phase === 'setup', `Phase should restore (is: ${state.phase})`);
});

// TEST 36: Resource - Smartware Distributor: clicks and drip
runTest('Resource: Smartware Distributor click charge and drip', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 5;
  
  // Install Smartware Distributor
  const sd = createCardInstance('smartware_distributor');
  state.runner.hand.push(sd);
  state = installCard(state, sd.id, 'rig');
  
  const installedSd = state.runner.rig.find(c => c.codeName === 'smartware_distributor')!;
  assert(installedSd.hostedCredits === 0 || !installedSd.hostedCredits, 'Should start with 0 credits');
  
  // Click Smartware Distributor to charge 3 credits
  state.runner.clicks = 4;
  state = executeResourceClick(state, installedSd.id);
  const updatedSd = state.runner.rig.find(c => c.codeName === 'smartware_distributor')!;
  assert(updatedSd.hostedCredits === 3, `Should have charged 3 credits (is: ${updatedSd.hostedCredits})`);
  assert(state.runner.clicks === 3, 'Should have used 1 click');

  // Charge it 4 more times to exceed 12 credits (total 15 credits)
  for (let i = 0; i < 4; i++) {
    state.runner.clicks = 4;
    state = executeResourceClick(state, installedSd.id);
  }
  const superChargedSd = state.runner.rig.find(c => c.codeName === 'smartware_distributor')!;
  assert(superChargedSd.hostedCredits === 15, `Should be able to exceed 12 credits (is: ${superChargedSd.hostedCredits})`);
  
  // Start Runner Turn -> should drip 1 credit
  state.runner.credits = 5;
  state = startRunnerTurn(state);
  const finalSd = state.runner.rig.find(c => c.codeName === 'smartware_distributor')!;
  assert(finalSd.hostedCredits === 14, `Should have dripped 1 credit, leaving 14 (is: ${finalSd.hostedCredits})`);
  assert(state.runner.credits === 6, `Runner should have gained 1 drip credit (is: ${state.runner.credits})`);
});

// TEST 37: Corp Operation - Public Trail trace threat
runTest('Corp Operation: Public Trail successful run requirement and choice', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  
  const publicTrail = createCardInstance('public_trail');
  state.corp.hand.push(publicTrail);
  
  // 1. Play without runner successful run last turn -> should fail prerequisite
  state.runner.successfulRunLastTurn = false;
  state = playCard(state, publicTrail.id);
  assert(state.corp.hand.some(c => c.codeName === 'public_trail'), 'Public Trail should not be played if prerequisite fails');
  
  // 2. Play with successful run last turn -> should succeed, transition to trace bidding
  state.runner.successfulRunLastTurn = true;
  state.runner.credits = 10;
  state = playCard(state, publicTrail.id);
  assert(state.phase === 'trace-runner-bid', `Should transition to trace-runner-bid phase (is: ${state.phase})`);
  
  // Runner pays 7 credits (matching trace strength 4 + 3 = 7) to prevent tag
  state = resolveTraceRunnerBid(state, 7);
  assert(state.runner.credits === 3, `Runner should have spent 7 credits (is: ${state.runner.credits})`);
  assert(state.runner.tags === 0, 'Runner tags should be 0');

  // 3. Play again and let trace succeed (Runner bids 0)
  state.corp.hand = [publicTrail];
  state.corp.clicks = 3;
  state.corp.credits = 10;
  state = playCard(state, publicTrail.id);
  assert(state.phase === 'trace-runner-bid', `Should transition to trace-runner-bid phase (is: ${state.phase})`);
  
  // Runner bids 0
  state = resolveTraceRunnerBid(state, 0);
  assert(state.runner.tags === 1, 'Runner should have acquired 1 tag');
});

// TEST 38: Corp Operation - Retribution program destruction
runTest('Corp Operation: Retribution program destruction', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  
  // Install a program for runner
  const cleaver = createCardInstance('cleaver'); // cost 3
  state.runner.rig.push(cleaver);
  
  const retribution = createCardInstance('retribution');
  state.corp.hand.push(retribution);
  
  // 1. Play without tag -> should fail prerequisite
  state.runner.tags = 0;
  state = playCard(state, retribution.id);
  assert(state.corp.hand.some(c => c.codeName === 'retribution'), 'Retribution should not be played without tag');
  
  // 2. Play with tag -> should destroy program
  state.runner.tags = 1;
  state = playCard(state, retribution.id);
  assert(state.runner.rig.length === 0, 'Cleaver should have been destroyed');
  assert(state.runner.discard.some(c => c.codeName === 'cleaver'), 'Cleaver should be in heap/discard');
});

// TEST 39: Corp Operation - Predictive Planogram tag condition
runTest('Corp Operation: Predictive Planogram tag condition benefits', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';
  state.corp.clicks = 3;
  state.corp.credits = 5;
  state.corp.hand = [];
  
  // Add some deck cards to draw
  state.corp.deck = [
    createCardInstance('hedge_fund'),
    createCardInstance('hedge_fund'),
    createCardInstance('hedge_fund'),
  ];
  
  const planogram = createCardInstance('predictive_planogram');
  
  // 1. Without tag -> should draw 3 cards (because hand is empty, AI chooses draw)
  state.corp.hand.push(planogram);
  state = playCard(state, planogram.id);
  assert(state.corp.hand.length === 3, `Should have drawn 3 cards (has: ${state.corp.hand.length})`);
  assert(state.corp.credits === 5, 'Should not have gained credits');
  
  // 2. With tag -> should do both
  const planogram2 = createCardInstance('predictive_planogram');
  state.corp.hand = [planogram2];
  state.runner.tags = 1;
  state.corp.credits = 5;
  state.corp.clicks = 3;
  state.corp.deck = [
    createCardInstance('hedge_fund'),
    createCardInstance('hedge_fund'),
    createCardInstance('hedge_fund'),
  ];
  state = playCard(state, planogram2.id);
  assert(state.corp.credits === 8, `Should have gained 3 credits (has: ${state.corp.credits})`);
  assert(state.corp.hand.length === 3, `Should have drawn 3 cards (has: ${state.corp.hand.length})`);
});

// TEST 40: Corp Agenda - Orbital Superiority meat damage
runTest('Corp Agenda: Orbital Superiority meat damage', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';
  state.runner.tags = 1;
  
  // Fill runner hand with 5 cards
  state.runner.hand = [
    createCardInstance('sure_gamble'),
    createCardInstance('sure_gamble'),
    createCardInstance('sure_gamble'),
    createCardInstance('sure_gamble'),
    createCardInstance('sure_gamble'),
  ];
  
  const orbital = createCardInstance('orbital_superiority');
  state.servers.Remote1 = { id: 'Remote1', name: 'Remote1', ice: [], root: [orbital] };
  orbital.advancedCounters = 4;
  
  // Score it
  state = scoreAgenda(state, orbital.id);
  
  // Should inflict 4 meat damage, discarding 4 cards
  assert(state.runner.hand.length === 1, `Runner should have only 1 card left (has: ${state.runner.hand.length})`);
  assert(state.runner.discard.length === 4, `Runner discard should have 4 cards (has: ${state.runner.discard.length})`);
});

// TEST 41: Program - Leech: hosting on ICE, central run counter gain, and strength reduction
runTest('Program: Leech hosting on ICE, counter accumulation, and strength reduction', () => {
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 10;

  // Setup an ICE on HQ
  const ice = createCardInstance('diviner'); // Code Gate, strength 3
  state.servers.HQ.ice.push(ice);
  state.servers.HQ.ice[0].rezzed = true;

  // Install Leech hosting on the HQ ICE
  const leech = createCardInstance('leech');
  state.runner.hand.push(leech);
  state = installCard(state, leech.id, ice.id); // Install & host on ice.id

  const installedLeech = state.runner.rig.find(c => c.codeName === 'leech')!;
  assert(installedLeech.hostCardId === ice.id, 'Leech should be hosted on the HQ ICE');
  assert(installedLeech.hostedCounters === 0 || !installedLeech.hostedCounters, 'Should start with 0 virus counters');

  // Initiate run on HQ and succeed (Central Server) to gain 1 virus counter
  state = initiateRun(state, 'HQ');
  state = transitionRun(state);
  state = transitionRun(state);
  state.run!.phase = 'success';
  state = transitionRun(state); // success -> breach, which charges Leech

  const chargedLeech = state.runner.rig.find(c => c.codeName === 'leech')!;
  assert(chargedLeech.hostedCounters === 1, `Leech should have accumulated 1 virus counter (is: ${chargedLeech.hostedCounters})`);

  // Now, initiate another run to encounter the ICE, and use Leech's ability
  state = initiateRun(state, 'HQ');
  state = transitionRun(state); // approach -> encounter
  
  // Encountering Diviner (strength 3). Use Leech to reduce strength.
  state = useLeech(state, chargedLeech.id);
  
  // Check that Leech counter is consumed and ICE strength reduction is recorded
  const usedLeech = state.runner.rig.find(c => c.codeName === 'leech')!;
  assert(usedLeech.hostedCounters === 0, 'Leech counter should be consumed');
  assert(state.run!.iceStrengthReduction === 1, 'ICE strength reduction should be 1');
});

// TEST 42: Faction Identity card images and info 전수 검증
runTest('Identity: Verify all 9 identities descriptions and image URLs', () => {
  const ids = [
    { code: 'the_catalyst', img: '30076' },
    { code: 'rene_loup_arcemont_party_animal', img: '30001' },
    { code: 'zahya_sadeghi_versatile_smuggler', img: '30010' },
    { code: 'tao_salonga_telepresence_magician', img: '30019' },
    { code: 'the_syndicate', img: '30077' },
    { code: 'haas_bioroid_precision_design', img: '30035' },
    { code: 'jinteki_restoring_humanity', img: '30043' },
    { code: 'nbn_reality_plus', img: '30051' },
    { code: 'weyland_consortium_built_to_last', img: '30059' }
  ];

  for (const info of ids) {
    const card = CARD_DATABASE[info.code];
    assert(card !== undefined, `Identity card ${info.code} must exist in database`);
    assert(card.type === 'Identity', `Card ${info.code} must be of type Identity`);
    
    const match = (card.imageUrl || '').match(/\/(\d+)\.jpg$/);
    const code = match ? match[1] : '';
    assert(code === info.img, `Identity ${info.code} image URL must end with ${info.img}.jpg (got: ${card.imageUrl || 'undefined'})`);
  }
});

// TEST 43: Console and Hardware Memory limit recalculation
runTest('Memory: Installing/Trashing consoles & hardware correctly recalculates memoryLimit and prevents program overflow', () => {
  let state = createInitialState('ai-vs-ai', 'medium');
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.runner.credits = 30; // abundant credits
  state.phase = 'runner-action';
  
  // Clear runner hand and rig
  state.runner.hand = [];
  state.runner.rig = [];
  state = refreshRunnerMemory(state);
  
  // Create card instances
  const t400 = createCardInstance('t400_memory_diamond');
  const pennyshaver = createCardInstance('pennyshaver');
  const program1 = createCardInstance('unity'); // cost: 3, memoryCost: 1
  const program2 = createCardInstance('cleaver'); // cost: 3, memoryCost: 1
  const program3 = createCardInstance('marjanah'); // cost: 0, memoryCost: 1
  const program4 = createCardInstance('carmen'); // cost: 5, memoryCost: 1
  const programExtra = createCardInstance('unity'); // cost: 3, memoryCost: 1
  
  // Check default limits
  assert(state.runner.memoryLimit === 4, 'Base memoryLimit should be 4');
  assert(state.runner.memoryUsed === 0, 'Base memoryUsed should be 0');
  
  // Install T400 Memory Diamond (Hardware)
  state.runner.hand.push(t400);
  state = installCard(state, t400.id, 'New Remote'); // server name is ignored for runner hardware
  assert(state.runner.memoryLimit === 5, 'Memory limit should increase to 5 after T400');
  
  // Install Pennyshaver (Console Hardware)
  state.runner.hand.push(pennyshaver);
  state = installCard(state, pennyshaver.id, 'New Remote');
  assert(state.runner.memoryLimit === 6, 'Memory limit should increase to 6 after Pennyshaver');
  
  // Install 5 programs (total 5 MU)
  const programs = [program1, program2, program3, program4, programExtra];
  for (const prog of programs) {
    state.runner.hand.push(prog);
    state.runner.clicks = 4; // keep clicks up
    state = installCard(state, prog.id, 'New Remote');
  }
  
  assert(state.runner.memoryUsed === 5, 'Memory used should be 5');
  
  // Try to install a 6th program (required MU: 1, which exceeds the current limit of 6 because 5 + 1 = 6 which is <= 6.
  // Wait, if limit is 6, installing a 6th program will make used = 6, which is <= 6. So 6th program should succeed.
  // Let's verify that installing a 7th program (making used = 7, exceeding 6) fails.
  const programExceed = createCardInstance('cleaver');
  state.runner.hand.push(programExceed);
  state.runner.clicks = 4;
  state = installCard(state, programExceed.id, 'New Remote');
  
  // Should succeed since 5 + 1 = 6, which equals limit 6.
  assert(state.runner.memoryUsed === 6, 'Memory used should be 6 after 6th program');
  assert(!state.runner.hand.some(c => c.id === programExceed.id), '6th program should be installed successfully');
  
  // Now try to install a 7th program. This should be blocked.
  const programExceed7th = createCardInstance('cleaver');
  state.runner.hand.push(programExceed7th);
  state.runner.clicks = 4;
  state = installCard(state, programExceed7th.id, 'New Remote');
  assert(state.runner.hand.some(c => c.id === programExceed7th.id), '7th program installation should be blocked (exceeds 6 MU)');
  
  // Trash T400 Memory Diamond from the rig using Retribution.
  // We need to set tags for retribution to work.
  state.runner.tags = 1;
  state.corp.hand = [createCardInstance('retribution')];
  state.activePlayer = 'Corp';
  state.corp.clicks = 1;
  state.corp.credits = 10;
  state.phase = 'corp-action';
  
  // Retribution targets highest cost program or hardware. Let's make sure retribution behaves.
  // Costs in rig:
  // T400: 2
  // Pennyshaver: 3
  // Unity (program1): 3
  // Cleaver (program2): 3
  // Marjanah (program3): 0
  // Carmen (program4): 5
  // Unity (programExtra): 3
  // Cleaver (programExceed): 3
  // Highest cost is Carmen (cost 5). So Retribution will trash Carmen.
  // Wait, if it trashes Carmen (Program), memory used should decrease by 1.
  state = playCard(state, state.corp.hand[0].id);
  assert(state.runner.memoryUsed === 5, 'Memory used should decrease to 5 after Carmen is trashed by Retribution');
  assert(state.runner.memoryLimit === 6, 'Memory limit should remain 6');
  
  // Now let's manually trash Pennyshaver (cost 3, Console Hardware) to test hardware limit reduction.
  const pennyIdx = state.runner.rig.findIndex(c => c.codeName === 'pennyshaver');
  assert(pennyIdx !== -1, 'Pennyshaver must be installed');
  const trashedPenny = state.runner.rig.splice(pennyIdx, 1)[0];
  state.runner.discard.push(trashedPenny);
  state = refreshRunnerMemory(state);
  
  // Limit should go from 6 down to 5.
  assert(state.runner.memoryLimit === 5, 'Memory limit should decrease to 5 after trashing Pennyshaver');
  
  // Now used is 5, limit is 5.
  // Try to install another program (required MU: 1). This should fail.
  state.activePlayer = 'Runner';
  state.runner.clicks = 4;
  state.phase = 'runner-action';
  const programExceed8th = createCardInstance('cleaver');
  state.runner.hand.push(programExceed8th);
  state = installCard(state, programExceed8th.id, 'New Remote');
  assert(state.runner.hand.some(c => c.id === programExceed8th.id), 'Program installation should be blocked after limit decreases to 5');
});

// TEST 44: Tag Removal Basic Action & Interactive Trace Resolution
runTest('Trace & Tag Removal: Removing tags via basic action and resolving Corp-led Traces', () => {
  // 1. Tag Removal Action Tests
  let state = createInitialState('runner-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Runner';
  state.phase = 'runner-action';
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.runner.tags = 1;

  // Remove tag: 1 click, 2 credits
  state = executeBasicAction(state, 'remove-tag');
  assert(state.runner.tags === 0, 'Tags should be 0 after removal');
  assert(state.runner.clicks === 3, 'Clicks should decrease by 1');
  assert(state.runner.credits === 8, 'Credits should decrease by 2');

  // Try to remove tag when tags is 0 -> should fail (return original state)
  state = executeBasicAction(state, 'remove-tag');
  assert(state.runner.tags === 0 && state.runner.clicks === 3 && state.runner.credits === 8, 'Basic action should be blocked if no tags');

  // Add a tag back and reduce credits to 1
  state.runner.tags = 1;
  state.runner.credits = 1;
  state = executeBasicAction(state, 'remove-tag');
  assert(state.runner.tags === 1, 'Tag removal should be blocked if credits < 2');

  // 2. Corp-human Trace Bidding tests
  state = createInitialState('corp-human', 'medium', 'tao', 'haas');
  state.activePlayer = 'Corp';
  state.phase = 'corp-action';
  state.corp.clicks = 3;
  state.corp.credits = 10;
  state.runner.successfulRunLastTurn = true;
  state.runner.credits = 10;

  const publicTrail = createCardInstance('public_trail');
  state.corp.hand.push(publicTrail);

  // Play Public Trail -> transitions to trace-corp-bid since corp-human
  state = playCard(state, publicTrail.id);
  assert(state.phase === 'trace-corp-bid', `Corp should bid (is: ${state.phase})`);

  // Corp bids 3 credits. Trace strength = 4 + 3 = 7.
  // Runner AI has 10 credits, which is >= 7, so Runner AI should pay 7 credits and avoid the tag.
  state = resolveTraceCorpBid(state, 3);
  assert(state.corp.credits === 3, `Corp should have spent 3 credits (is: ${state.corp.credits})`);
  assert(state.runner.credits === 3, `Runner AI should have spent 7 credits (is: ${state.runner.credits})`);
  assert(state.runner.tags === 0, 'Runner tags should be 0');
});

console.log('\n🧪 ===============================================');
console.log(`🧪    QA TEST SUITE RESULT: ${passedTests} / ${totalTests} PASSED`);
console.log('🧪 ===============================================');

if (passedTests !== totalTests) {
  throw new Error("QA Card Mechanics scenarios failed!");
}


