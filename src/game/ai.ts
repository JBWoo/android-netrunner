import type { GameState, Card } from './types';
import { 
  executeBasicAction, installCard, rezCard, advanceCard, 
  scoreAgenda, playCard, executeResourceClick, initiateRun, 
  resolveSubroutines, resolveAccessCard, jackOut, transitionRun, endRun,
  discardCard, endRunnerTurn, paySkunkworksCost, resolveMulligan
} from './engine';

// ----------------------------------------------------
// Corp AI Heuristics
// ----------------------------------------------------
export function corpPlayTurnStep(state: GameState): GameState {
  let tempState = { ...state };
  
  if (tempState.phase === 'corp-mulligan') {
    const agendas = tempState.corp.hand.filter(c => c.type === 'Agenda');
    const ices = tempState.corp.hand.filter(c => c.type === 'ICE');
    
    if (agendas.length >= 3 || ices.length === 0) {
      const toReplaceIds = agendas.map(c => c.id);
      return resolveMulligan(tempState, 'Corp', toReplaceIds);
    }
    return resolveMulligan(tempState, 'Corp', []);
  }

  if (tempState.phase === 'corp-discard') {
    if (tempState.corp.hand.length > 0) {
      return discardCard(tempState, tempState.corp.hand[0].id);
    }
    return tempState;
  }
  
  // 1. 이미 득점 가능한 아젠다가 있는지 탐색 후 즉시 득점
  for (const serverKey of Object.keys(tempState.servers)) {
    const server = tempState.servers[serverKey];
    for (const c of server.root) {
      if (c.type === 'Agenda') {
        const advCost = c.advancementCost || 3;
        if (c.advancedCounters >= advCost) {
          return scoreAgenda(tempState, c.id);
        }
      }
    }
  }

  // 2. 비레즈 상태인 자산(Nico Campaign 등) 중 크레딧 여유가 있으면 레즈
  for (const serverKey of Object.keys(tempState.servers)) {
    const server = tempState.servers[serverKey];
    for (const c of server.root) {
      if ((c.codeName === 'nico_campaign' || c.codeName === 'regolith_mining_license') && !c.rezzed) {
        if (tempState.corp.credits >= c.cost) {
          return rezCard(tempState, c.id);
        }
      }
    }
  }

  // 3. 레즈된 Regolith Mining License가 있으면 크레딧 회수 (clicks 소모)
  for (const serverKey of Object.keys(tempState.servers)) {
    const server = tempState.servers[serverKey];
    for (const c of server.root) {
      if (c.codeName === 'regolith_mining_license' && c.rezzed && c.hostedCredits > 0) {
        if (tempState.corp.clicks > 0) {
          return executeResourceClick(tempState, c.id);
        }
      }
    }
  }

  // 4. 의사결정: 손패에 돈 벌 수 있는 Operation이 있고 크레딧이 충족되면 플레이
  const hedgeFund = tempState.corp.hand.find(c => c.codeName === 'hedge_fund');
  if (hedgeFund && tempState.corp.credits >= 5) {
    return playCard(tempState, hedgeFund.id);
  }
  const govSubsidy = tempState.corp.hand.find(c => c.codeName === 'government_subsidy');
  if (govSubsidy && tempState.corp.credits >= 10) {
    return playCard(tempState, govSubsidy.id);
  }

  // 5. ICE 설치 heuristic: R&D, HQ, 혹은 설치된 원격 서버 보호선 보강
  const iceInHand = tempState.corp.hand.filter(c => c.type === 'ICE');
  if (iceInHand.length > 0) {
    // HQ 방어 0순위
    if (tempState.servers.HQ.ice.length === 0 && tempState.corp.credits >= 0) {
      return installCard(tempState, iceInHand[0].id, 'HQ');
    }
    // R&D 방어 1순위
    if (tempState.servers.RD.ice.length === 0 && tempState.corp.credits >= 0) {
      return installCard(tempState, iceInHand[0].id, 'RD');
    }
    // 원격 서버가 비어있다면 원격 방어
    for (const serverKey of Object.keys(tempState.servers)) {
      if (serverKey.startsWith('Remote')) {
        const server = tempState.servers[serverKey];
        if (server.ice.length === 0 && tempState.corp.credits >= 0) {
          return installCard(tempState, iceInHand[0].id, serverKey);
        }
      }
    }
  }

  // 6. 원격 서버 신규 개설 및 아젠다/트랩 세팅
  const agendaInHand = tempState.corp.hand.find(c => c.type === 'Agenda');
  const trapInHand = tempState.corp.hand.find(c => c.codeName === 'urtica_cipher');
  
  // 아젠다 설치 우선
  if (agendaInHand) {
    // 비어있는 원격 서버 찾기
    let emptyRemote = '';
    for (const serverKey of Object.keys(tempState.servers)) {
      if (serverKey.startsWith('Remote')) {
        const s = tempState.servers[serverKey];
        if (s.root.length === 0) {
          emptyRemote = serverKey;
          break;
        }
      }
    }
    if (emptyRemote) {
      return installCard(tempState, agendaInHand.id, emptyRemote);
    } else {
      // 새로운 원격서버 개설하며 설치
      return installCard(tempState, agendaInHand.id, 'New Remote');
    }
  }

  // 트랩 블러핑 설치
  if (trapInHand) {
    let emptyRemote = '';
    for (const serverKey of Object.keys(tempState.servers)) {
      if (serverKey.startsWith('Remote') && tempState.servers[serverKey].root.length === 0) {
        emptyRemote = serverKey;
        break;
      }
    }
    if (emptyRemote) {
      return installCard(tempState, trapInHand.id, emptyRemote);
    } else {
      return installCard(tempState, trapInHand.id, 'New Remote');
    }
  }

  // 7. 설치된 아젠다/함정이 있으면 발전(Advance)하기
  for (const serverKey of Object.keys(tempState.servers)) {
    const server = tempState.servers[serverKey];
    for (const c of server.root) {
      if (c.type === 'Agenda' || c.codeName === 'urtica_cipher') {
        const maxLimit = c.type === 'Agenda' ? (c.advancementCost || 3) : 3; // 함정은 3개까지 발전
        if (c.advancedCounters < maxLimit && tempState.corp.credits > 0) {
          return advanceCard(tempState, c.id);
        }
      }
    }
  }

  // 8. 할 일이 정말 없으면 기본 드로우 또는 크레딧 획득
  if (tempState.corp.hand.length < 3) {
    return executeBasicAction(tempState, 'draw-card');
  } else {
    return executeBasicAction(tempState, 'gain-credit');
  }
}

// ----------------------------------------------------
// Runner AI Heuristics
// ----------------------------------------------------
export function runnerPlayTurnStep(state: GameState): GameState {
  let tempState = { ...state };

  if (tempState.phase === 'runner-mulligan') {
    const moneyCards = tempState.runner.hand.filter(c => c.codeName === 'sure_gamble' || c.codeName === 'creative_commission');
    const breakers = tempState.runner.hand.filter(c => c.type === 'Program');
    
    if (moneyCards.length === 0 && breakers.length === 0) {
      const toReplaceIds = tempState.runner.hand.slice(0, 3).map(c => c.id);
      return resolveMulligan(tempState, 'Runner', toReplaceIds);
    }
    return resolveMulligan(tempState, 'Runner', []);
  }

  if (tempState.runner.clicks === 0 && tempState.phase === 'runner-action') {
    return endRunnerTurn(tempState);
  }

  if (tempState.phase === 'runner-discard') {
    if (tempState.runner.hand.length > 0) {
      return discardCard(tempState, tempState.runner.hand[0].id);
    }
    return tempState;
  }

  // 0. 진행 중인 런인 경우, Encounter 또는 Breach 의사결정 수행
  if (tempState.run) {
    return runnerEncounterOrAccessStep(tempState);
  }

  // 1. Telework Contract가 설치되어 있으면 크레딧 수령 우선
  const telework = tempState.runner.rig.find(c => c.codeName === 'telework_contract' && c.hostedCredits > 0);
  if (telework && tempState.runner.clicks > 0) {
    return executeResourceClick(tempState, telework.id);
  }

  // 2. 손패 경제 카드 플레이
  const sureGamble = tempState.runner.hand.find(c => c.codeName === 'sure_gamble');
  if (sureGamble && tempState.runner.credits >= 5) {
    return playCard(tempState, sureGamble.id);
  }
  const creativeComm = tempState.runner.hand.find(c => c.codeName === 'creative_commission');
  if (creativeComm && tempState.runner.credits >= 2 && tempState.runner.clicks >= 2) {
    return playCard(tempState, creativeComm.id);
  }

  const vrcation = tempState.runner.hand.find(c => c.codeName === 'vrcation');
  if (vrcation && tempState.runner.credits >= 1 && tempState.runner.clicks >= 2) {
    return playCard(tempState, vrcation.id);
  }

  // 3. 브레이커(아이스브레이커) 설치 우선 (Cleaver, Carmen, Unity 순)
  const programInHand = tempState.runner.hand.filter(c => c.type === 'Program');
  if (programInHand.length > 0) {
    for (const prog of programInHand) {
      // 이미 같은 코네임이 설치되어 있는지 체크
      const alreadyInstalled = tempState.runner.rig.some(r => r.codeName === prog.codeName);
      
      // 메모리 여유 체크
      const limit = tempState.runner.memoryLimit;
      const currentMU = tempState.runner.rig.reduce((sum, c) => sum + (c.memoryCost || 0), 0);
      const requiredMU = prog.memoryCost || 0;

      if (!alreadyInstalled && tempState.runner.credits >= prog.cost && (currentMU + requiredMU <= limit)) {
        return installCard(tempState, prog.id, '');
      }
    }
  }

  // 4. 리소스 및 하드웨어 장착
  const resInHand = tempState.runner.hand.find(c => c.type === 'Resource' || c.type === 'Hardware');
  if (resInHand && tempState.runner.credits >= resInHand.cost) {
    return installCard(tempState, resInHand.id, '');
  }

  // 5. 런(Run) 기획: 브레이커 리그가 갖춰졌고 크레딧 여유(>= 6)가 있을 때 런 시도
  const hasBreakers = tempState.runner.rig.some(c => c.type === 'Program' && c.subTypes.includes('Barrier')) ||
                      tempState.runner.rig.some(c => c.type === 'Program' && c.subTypes.includes('Code Gate')) ||
                      tempState.runner.rig.some(c => c.type === 'Program' && c.subTypes.includes('Sentry'));
  
  if (hasBreakers && tempState.runner.credits >= 6 && tempState.runner.clicks > 0) {
    // 득점 서버 또는 중앙 서버 런
    // 원격 서버에 발전된 카드가 있으면 해킹 1순위
    for (const serverKey of Object.keys(tempState.servers)) {
      if (serverKey.startsWith('Remote')) {
        const s = tempState.servers[serverKey];
        if (s.root.some(c => c.advancedCounters > 0)) {
          return initiateRun(tempState, serverKey);
        }
      }
    }
    
    // 무작위로 R&D 또는 HQ 털기
    const target = Math.random() > 0.5 ? 'RD' : 'HQ';
    return initiateRun(tempState, target);
  }

  // 6. 패가 적으면 드로우, 많으면 머니 충전
  if (tempState.runner.hand.length < 3) {
    return executeBasicAction(tempState, 'draw-card');
  } else {
    return executeBasicAction(tempState, 'gain-credit');
  }
}

// ----------------------------------------------------
// Runner Encounter & Access 자동화 해결 모듈
// ----------------------------------------------------
function runnerEncounterOrAccessStep(state: GameState): GameState {
  let tempState = { ...state };
  const run = tempState.run;
  if (!run) return state;

  // Manegarm Skunkworks 결제 대기 처리
  if (run.needSkunkworksPay) {
    if (tempState.runner.credits >= 5) {
      return paySkunkworksCost(tempState, 'credits');
    }
    if (tempState.runner.clicks >= 2) {
      return paySkunkworksCost(tempState, 'clicks');
    }
    return paySkunkworksCost(tempState, 'jackout');
  }

  if (run.phase === 'approach') {
    const ice = run.currentIce;
    if (ice && !ice.rezzed) {
      // Corp AI가 이 ICE를 레즈할지 결정
      let cost = ice.cost;
      if (tempState.logs.some(l => l.sender === 'Runner' && l.message.includes('Tread Lightly'))) {
        cost += 3;
      }
      if (tempState.corp.credits >= cost && Math.random() > 0.3) {
        tempState = rezCard(tempState, ice.id);
      }
    }
    // 레즈 처리 후 혹은 미레즈 상태로 전이 실행
    return transitionRun(tempState);

  } else if (run.phase === 'encounter') {
    const ice = run.currentIce;
    if (!ice) return state;

    // 아이스브레이커 목록
    const breakers = tempState.runner.rig.filter(c => c.type === 'Program');
    
    // 이 ICE의 서브타입에 적합한 브레이커 탐색
    let bestBreaker: Card | null = null;
    if (ice.subTypes.includes('Barrier')) {
      bestBreaker = breakers.find(b => b.subTypes.includes('Barrier')) || null;
    } else if (ice.subTypes.includes('Code Gate')) {
      bestBreaker = breakers.find(b => b.subTypes.includes('Code Gate')) || null;
    } else if (ice.subTypes.includes('Sentry')) {
      bestBreaker = breakers.find(b => b.subTypes.includes('Sentry')) || null;
    }
    
    // AI 브레이커(Mayfly) 범용 대안
    if (!bestBreaker) {
      bestBreaker = breakers.find(b => b.codeName === 'mayfly') || null;
    }

    if (bestBreaker) {
      // 1. 강도 매칭 (Strengh matching)
      let currentStrength = bestBreaker.strength || 0;
      // Unity 특수 효과: 강도가 설치된 아이스브레이커의 수만큼 상승
      if (bestBreaker.codeName === 'unity') {
        const icebreakerCount = breakers.length;
        currentStrength += icebreakerCount;
      }
      
      const iceStrength = ice.strength || 0;
      let boostCost = 0;

      if (currentStrength < iceStrength) {
        // 강도를 올리는 데 필요한 비용 연산
        const diff = iceStrength - currentStrength;
        if (bestBreaker.codeName === 'carmen') {
          // 2크레딧당 +3 강도
          boostCost = Math.ceil(diff / 3) * 2;
        } else {
          // 보통 1크레딧당 +1 강도
          boostCost = diff;
        }
      }

      // 2. 서브루틴 격파 비용 연산
      let breakCredits = 0;
      const unbrokenSubs = run.subroutines.filter(s => !s.broken);
      
      if (unbrokenSubs.length > 0) {
        if (bestBreaker.codeName === 'cleaver') {
          // 1크레딧당 2서브루틴 해제
          breakCredits = Math.ceil(unbrokenSubs.length / 2);
        } else if (bestBreaker.codeName === 'carmen') {
          // 2크레딧당 3서브루틴 해제
          breakCredits = 2;
        } else {
          // 1크레딧당 1서브루틴 해제 (Unity, Mayfly)
          breakCredits = unbrokenSubs.length;
        }
      }

      const totalRequired = boostCost + breakCredits;

      if (tempState.runner.credits >= totalRequired && totalRequired > 0) {
        // 크레딧 지불 후 서브루틴 전부 해제
        tempState.runner.credits -= totalRequired;
        if (tempState.run) {
          tempState.run.subroutines = run.subroutines.map(sub => ({ ...sub, broken: true }));
        }
        tempState.logs.push({
          id: `log_ai_break_${Date.now()}`,
          message: `${bestBreaker!.title}을 사용하여 ${ice.title}의 모든 서브루틴을 해제했습니다. (소모: ${totalRequired} [Credits])`,
          timestamp: new Date().toLocaleTimeString(),
          sender: 'Runner'
        });
        return tempState;
      }
    }

    // 브레이커가 없거나 돈이 부족한 경우:
    // Bioroid ICE(Bran 1.0)인 경우 러너의 클릭이 있으면 클릭으로 생명 서브루틴(ETR 등) 깨기 시도
    if (ice.subTypes.includes('Bioroid') && tempState.runner.clicks > 0) {
      const unbrokenETR = run.subroutines.find(s => !s.broken && s.effectType === 'end-run');
      if (unbrokenETR) {
        return breakSubWithClick(tempState, unbrokenETR.id);
      }
    }

    // 돈이 없고 피할 방법이 없는 경우: 잭아웃(안전하게 회피 가능한 경우) 또는 서브루틴 맞기 진행
    // 센트리 조우 시 데미지가 아프므로 위험하다고 판단되면 잭아웃
    if (ice.subTypes.includes('Sentry') && run.iceIndex > 0) {
      return jackOut(tempState);
    }

    // 잭아웃 안되면 결국 서브루틴 그냥 맞기 해결 돌입
    return resolveSubroutines(tempState);

  } else if (run.phase === 'success') {
    // success 페이즈인 경우 transitionRun을 통해 breach 페이즈로 전환
    return transitionRun(tempState);

  } else if (run.phase === 'breach') {
    // 브리치 카드 액세스 루틴
    const card = run.accessedCards[run.accessIndex];
    if (!card) return state;

    // 만약 Asset/Upgrade이고 러너의 크레딧이 파괴비용보다 많으면 폐기(Trash) 진행
    if (card.trashCost !== undefined && tempState.runner.credits >= card.trashCost) {
      // Nico Campaign 이나 Regolith License 등 폐기 유익 가치가 높은 광고는 무조건 파괴
      if (card.codeName === 'nico_campaign' || card.codeName === 'regolith_mining_license' || card.codeName === 'manegarm_skunkworks') {
        return resolveAccessCard(tempState, true); // 폐기
      }
    }

    // 그 외 일반 액세스 진행
    return resolveAccessCard(tempState, false);

  } else if (run.phase === 'end') {
    // end 페이즈인 경우 endRun을 통해 정리
    return endRun(tempState);
  }

  return state;
}

// ----------------------------------------------------
// Bioroid 클릭 서브루틴 해제 내부 연동
// ----------------------------------------------------
function breakSubWithClick(state: GameState, subId: string): GameState {
  let tempState = { ...state };
  if (!tempState.run || tempState.runner.clicks <= 0) return state;
  tempState.runner.clicks -= 1;
  tempState.run.subroutines = tempState.run.subroutines.map(s => {
    if (s.id === subId) {
      return { ...s, broken: true };
    }
    return s;
  });
  tempState.logs.push({
    id: `log_click_break_${Date.now()}`,
    message: `[Click]을 1개 소모하여 ${subId.includes('2') ? '2번째' : '3번째'} End the run 서브루틴을 해제했습니다.`,
    timestamp: new Date().toLocaleTimeString(),
    sender: 'Runner'
  });
  return tempState;
}
