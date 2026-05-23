import { createInitialState } from './src/game/engine';
import { corpPlayTurnStep } from './src/game/ai';
import { playCard, installCard } from './src/game/engine';

console.log('=== Human Runner Mode - Start Turn Test ===');

let state = createInitialState('runner-human', 'medium');
console.log(`Initial: Active=${state.activePlayer}, Phase=${state.phase}, Clicks(C/R)=${state.corp.clicks}/${state.runner.clicks}`);

let steps = 0;
while (state.activePlayer === 'Corp' && steps < 100) {
  const prevClicks = state.corp.clicks;
  const prevPhase = state.phase;
  
  state = corpPlayTurnStep(state);
  
  console.log(`Step ${++steps}: Phase=${state.phase}, Clicks(C)=${state.corp.clicks}, Hand=${state.corp.hand.length}, Credits=${state.corp.credits}`);
  if (state.corp.clicks === prevClicks && state.phase === prevPhase) {
    console.log('STALL DETECTED! The state did not change after corpPlayTurnStep.');
    break;
  }
}

console.log(`\nTurn transitioned! Active=${state.activePlayer}, Phase=${state.phase}, RunnerClicks=${state.runner.clicks}`);
console.log('Runner Hand:', state.runner.hand.map(c => `${c.title} (${c.type}, cost=${c.cost}, id=${c.id})`));

if (state.activePlayer === 'Runner') {
  // 러너 첫 번째 카드가 플레이 가능한지 시뮬레이션
  const firstCard = state.runner.hand[0];
  console.log(`\nAttempting to play/install first card: ${firstCard.title}`);
  
  let nextState;
  if (firstCard.type === 'Event') {
    nextState = playCard(state, firstCard.id);
  } else {
    nextState = installCard(state, firstCard.id, '');
  }
  
  if (nextState.runner.hand.length < state.runner.hand.length) {
    console.log(`Successfully played/installed: ${firstCard.title}`);
    console.log(`Remaining Clicks=${nextState.runner.clicks}, Credits=${nextState.runner.credits}`);
  } else {
    console.log(`Failed to play/install ${firstCard.title}. Hand sizes are identical.`);
    console.log('Logs after action:');
    nextState.logs.slice(-3).forEach(l => console.log(`[${l.sender}] ${l.message}`));
  }
}
