import type { Card, Subroutine } from './types';

// 카드 팩 데이터베이스
export const CARD_DATABASE: { [codeName: string]: Omit<Card, 'id' | 'rezzed' | 'advancedCounters' | 'hostedCredits' | 'hostedCounters'> } = {
  // ================= RUNNER CARDS =================
  // Identity
  the_catalyst: {
    codeName: 'the_catalyst',
    title: 'The Catalyst: Convention Breaker',
    side: 'Runner',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: '스타터 덱용 무특성 아이덴티티입니다. (최소 덱 크기: 30장)',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30076.jpg',
  },
  
  // Events
  sure_gamble: {
    codeName: 'sure_gamble',
    title: 'Sure Gamble',
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 5,
    text: '9 [Credits]를 획득합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30030.jpg',
  },
  creative_commission: {
    codeName: 'creative_commission',
    title: 'Creative Commission',
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 1,
    text: '5 [Credits]를 획득합니다. 추가 비용으로 1 [Click]을 잃습니다. (이 이벤트가 이번 턴의 마지막 [Click]인 경우는 제외합니다.)',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30020.jpg',
  },
  overclock: {
    codeName: 'overclock',
    title: 'Overclock',
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 1,
    text: '임의의 서버에 런을 시작합니다. 런이 시작하기 전, 이 카드 위에 5 [Credits]를 올립니다. 이번 런 동안 이 크레딧을 비용 지불에 사용할 수 있습니다. 런이 끝나면 남은 크레딧은 은행으로 돌려보냅니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30029.jpg',
  },
  jailbreak: {
    codeName: 'jailbreak',
    title: 'Jailbreak',
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 0,
    text: 'HQ나 R&D에 런을 실행합니다. 성공 시, 카드를 액세스하기 직전에 카드 1장을 드로우하고, 이번 브리치 동안 카드 1장을 추가로 액세스합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30028.jpg',
  },
  tread_lightly: {
    codeName: 'tread_lightly',
    title: 'Tread Lightly',
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 1,
    text: '임의의 서버에 런을 시작합니다. 이번 런 동안 해당 서버의 모든 ICE 레즈(Rez) 비용이 3 [Credits] 증가합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30012.jpg',
  },
  vrcation: {
    codeName: 'vrcation',
    title: 'VRcation',
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 1,
    text: '카드 4장을 드로우합니다. 추가 비용으로 1 [Click]을 잃습니다. (이 이벤트가 이번 턴의 마지막 [Click]인 경우는 제외합니다.)',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30021.jpg',
  },
  
  // Hardware
  docklands_pass: {
    codeName: 'docklands_pass',
    title: 'Docklands Pass',
    side: 'Runner',
    type: 'Hardware',
    subTypes: [],
    cost: 2,
    isUnique: true,
    text: '매 턴 HQ에 처음으로 성공적인 런을 하여 브리치할 때, 추가로 카드 1장을 더 액세스합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30013.jpg',
  },
  pennyshaver: {
    codeName: 'pennyshaver',
    title: 'Pennyshaver',
    side: 'Runner',
    type: 'Hardware',
    subTypes: ['AI'], // Console is AI or Special subtype
    cost: 3,
    isUnique: true,
    memoryCost: 0, // Console MU is handled in engine
    text: '+1 [Memory Unit]. 매 턴 HQ 또는 R&D에 처음으로 성공적인 런을 할 때, Pennyshaver 위에 1 [Credit]을 올립니다. [Click]: Pennyshaver 위의 모든 크레딧을 수령합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30014.jpg',
  },
  
  // Resources
  red_team: {
    codeName: 'red_team',
    title: 'Red Team',
    side: 'Runner',
    type: 'Resource',
    subTypes: ['AP'], // Connection / Resource
    cost: 5,
    text: '설치 시 12 [Credits]를 카드 위에 충전합니다.\n[Click]: 이번 턴에 런을 하지 않은 중앙 서버(HQ/R&D/Archives) 중 하나를 선택해 런을 시작합니다. 성공하면 이 카드에서 3 [Credits]를 가져옵니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30018.jpg',
  },
  verbal_plasticity: {
    codeName: 'verbal_plasticity',
    title: 'Verbal Plasticity',
    side: 'Runner',
    type: 'Resource',
    subTypes: [],
    cost: 3,
    text: '기본 행동 "1 [Click]: 카드 1장 드로우"를 수행할 때, 그것이 이번 턴에 첫 번째 드로우라면 카드 1장을 추가로 드로우합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30034.jpg',
  },
  telework_contract: {
    codeName: 'telework_contract',
    title: 'Telework Contract',
    side: 'Runner',
    type: 'Resource',
    subTypes: [],
    cost: 1,
    text: '설치 시 9 [Credits]를 카드 위에 충전합니다.\n[Click]: 이 카드에서 3 [Credits]를 가져옵니다. 이 행동은 매 턴 한 번만 사용할 수 있습니다. 카드가 비면 폐기합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30027.jpg',
  },
  smartware_distributor: {
    codeName: 'smartware_distributor',
    title: 'Smartware Distributor',
    side: 'Runner',
    type: 'Resource',
    subTypes: [],
    cost: 0,
    text: '[Click]: 이 카드 위에 파워 카운터 2개를 올립니다.\n자신의 턴이 시작될 때, 이 카드의 파워 카운터 1개를 소모하여 1 [Credit]을 얻을 수 있습니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30033.jpg',
  },
  
  // Programs (Icebreakers)
  cleaver: {
    codeName: 'cleaver',
    title: 'Cleaver',
    side: 'Runner',
    type: 'Program',
    subTypes: ['Barrier'], // Fracter
    cost: 3,
    strength: 3,
    memoryCost: 1,
    text: '1 [Credit]: 배리어(Barrier) 서브루틴을 최대 2개까지 해제합니다.\n1 [Credit]: 강도 +1.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30006.jpg',
  },
  carmen: {
    codeName: 'carmen',
    title: 'Carmen',
    side: 'Runner',
    type: 'Program',
    subTypes: ['Sentry'], // Killer
    cost: 5,
    strength: 2,
    memoryCost: 1,
    text: '2 [Credits]: 센트리(Sentry) 서브루틴을 최대 3개까지 해제합니다.\n2 [Credits]: 강도 +3.\n이번 턴에 성공적인 런을 수행했다면, 이번 턴 처음으로 Carmen을 설치할 때 비용이 2 [Credits] 감소(할인)합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30015.jpg',
  },
  unity: {
    codeName: 'unity',
    title: 'Unity',
    side: 'Runner',
    type: 'Program',
    subTypes: ['Code Gate'], // Decoder
    cost: 3,
    strength: 1,
    memoryCost: 1,
    text: '1 [Credit]: 코드 게이트(Code Gate) 서브루틴 1개를 해제합니다.\n1 [Credit]: 설치된 아이스브레이커 수만큼 강도가 상승합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30026.jpg',
  },
  mayfly: {
    codeName: 'mayfly',
    title: 'Mayfly',
    side: 'Runner',
    type: 'Program',
    subTypes: ['AI'],
    cost: 1,
    strength: 1,
    memoryCost: 2,
    text: '1 [Credit]: 서브루틴 1개를 해제합니다.\n1 [Credit]: 강도 +1.\n제한: 이번 런 동안 Mayfly를 사용했다면, 런이 끝날 때 Mayfly를 폐기(Trash)합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30032.jpg',
  },

  // ================= CORPORATION CARDS =================
  // Identity
  the_syndicate: {
    codeName: 'the_syndicate',
    title: 'The Syndicate: Profit over Principle',
    side: 'Corp',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: '스타터 덱용 무특성 아이덴티티입니다. (최소 덱 크기: 30장)',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30077.jpg',
  },
  
  // Agendas
  offworld_office: {
    codeName: 'offworld_office',
    title: 'Offworld Office',
    side: 'Corp',
    type: 'Agenda',
    subTypes: [],
    cost: 0,
    advancementCost: 4,
    agendaPoints: 2,
    text: '이 아젠다를 득점하면, 7 [Credits]를 획득합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30067.jpg',
  },
  send_a_message: {
    codeName: 'send_a_message',
    title: 'Send a Message',
    side: 'Corp',
    type: 'Agenda',
    subTypes: [],
    cost: 0,
    advancementCost: 5,
    agendaPoints: 3,
    text: '이 아젠다가 득점되거나 러너에게 탈취당할 때, 설치된 ICE 1개를 비용을 지불하지 않고 레즈(Rez)할 수 있습니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30069.jpg',
  },
  superconducting_hub: {
    codeName: 'superconducting_hub',
    title: 'Superconducting Hub',
    side: 'Corp',
    type: 'Agenda',
    subTypes: [],
    cost: 0,
    advancementCost: 3,
    agendaPoints: 1,
    text: '이 아젠다를 득점하면 카드 2장을 바로 드로우할 수 있습니다. 추가로 게임이 끝날 때까지 Corp의 최대 손패 크기가 2 증가합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30070.jpg',
  },
  
  // Assets
  nico_campaign: {
    codeName: 'nico_campaign',
    title: 'Nico Campaign',
    side: 'Corp',
    type: 'Asset',
    subTypes: [],
    cost: 2, // Rez cost
    trashCost: 2,
    text: '레즈 시 9 [Credits]를 카드 위에 충전합니다. Corp의 턴이 시작될 때 이 카드에서 3 [Credits]를 가져옵니다. 카드가 비면 폐기합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30037.jpg',
  },
  regolith_mining_license: {
    codeName: 'regolith_mining_license',
    title: 'Regolith Mining License',
    side: 'Corp',
    type: 'Asset',
    subTypes: [],
    cost: 2, // Rez cost
    trashCost: 2,
    text: '레즈 시 15 [Credits]를 카드 위에 충전합니다.\n[Click]: 이 카드에서 3 [Credits]를 가져옵니다. 카드가 비면 폐기합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30071.jpg',
  },
  urtica_cipher: {
    codeName: 'urtica_cipher',
    title: 'Urtica Cipher',
    side: 'Corp',
    type: 'Asset',
    subTypes: [],
    cost: 0, // Rez cost
    trashCost: 2,
    text: '발전이 가능합니다. 러너가 이 카드를 액세스할 때, Corp가 1 [Credit]을 지불하면 이 카드에 놓인 발전 토큰 1개당 2점의 넷 데미지(Net Damage)를 러너에게 입힙니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30045.jpg',
  },
  
  // Upgrades
  manegarm_skunkworks: {
    codeName: 'manegarm_skunkworks',
    title: 'Manegarm Skunkworks',
    side: 'Corp',
    type: 'Upgrade',
    subTypes: [],
    cost: 2, // Rez cost
    trashCost: 3,
    isUnique: true,
    text: '매 턴 러너가 이 서버의 런을 계속(Continue)하기로 결정할 때, 2 [Clicks]를 소모하거나 5 [Credits]를 내야 합니다. 그렇지 않으면 런이 즉시 종료됩니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30042.jpg',
  },
  
  // Operations
  seamless_launch: {
    codeName: 'seamless_launch',
    title: 'Seamless Launch',
    side: 'Corp',
    type: 'Operation',
    subTypes: [],
    cost: 1,
    text: '이번 턴에 설치하지 않은 임의의 카드 1개를 선택하여 발전 토큰 2개를 바로 올립니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30040.jpg',
  },
  government_subsidy: {
    codeName: 'government_subsidy',
    title: 'Government Subsidy',
    side: 'Corp',
    type: 'Operation',
    subTypes: [],
    cost: 10,
    text: '15 [Credits]를 획득합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30064.jpg',
  },
  hedge_fund: {
    codeName: 'hedge_fund',
    title: 'Hedge Fund',
    side: 'Corp',
    type: 'Operation',
    subTypes: [],
    cost: 5,
    text: '9 [Credits]를 획득합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30075.jpg',
  },
  
  // ICE
  bran_1_0: {
    codeName: 'bran_1_0',
    title: 'Brân 1.0',
    side: 'Corp',
    type: 'ICE',
    subTypes: ['Barrier', 'Bioroid', 'AP'],
    cost: 6,
    strength: 6,
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30039.jpg',
    text: '러너는 자신의 1 [Click]을 소모하여 이 ICE의 서브루틴 1개를 임의로 해제할 수 있습니다.\n↳ Corp는 HQ나 버려진 카드 더미에서 ICE 1장을 선택해 이 ICE의 바로 안쪽에 설치 비용 없이 설치할 수 있습니다.\n↳ 런을 종료합니다.\n↳ 런을 종료합니다.',
    subroutines: [
      { id: 'bran_sub_1', text: 'Corp는 HQ나 버려진 카드 더미에서 ICE 1장을 이 ICE의 바로 안쪽에 설치할 수 있습니다.', broken: false, effectType: 'install' },
      { id: 'bran_sub_2', text: '런을 종료합니다.', broken: false, effectType: 'end-run' },
      { id: 'bran_sub_3', text: '런을 종료합니다.', broken: false, effectType: 'end-run' }
    ]
  },
  diviner: {
    codeName: 'diviner',
    title: 'Diviner',
    side: 'Corp',
    type: 'ICE',
    subTypes: ['Code Gate'],
    cost: 2,
    strength: 3,
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30046.jpg',
    text: '↳ 1점의 넷 데미지를 입힙니다. 이 데미지로 카드가 버려지면, 런을 종료합니다.',
    subroutines: [
      { id: 'diviner_sub_1', text: '1점의 넷 데미지를 입히며, 이로 인해 카드가 버려지면 런을 종료합니다.', broken: false, effectType: 'damage' }
    ]
  },
  karuna: {
    codeName: 'karuna',
    title: 'Karunā',
    side: 'Corp',
    type: 'ICE',
    subTypes: ['Sentry', 'AP'],
    cost: 4,
    strength: 3,
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30047.jpg',
    text: '↳ 2점의 넷 데미지를 입힙니다. 그 직후 러너는 잭아웃할 수 있습니다.\n↳ 2점의 넷 데미지를 입힙니다.',
    subroutines: [
      { id: 'karuna_sub_1', text: '2점의 넷 데미지를 입힙니다. 그 후 러너는 잭아웃할 수 있습니다.', broken: false, effectType: 'damage' },
      { id: 'karuna_sub_2', text: '2점의 넷 데미지를 입힙니다.', broken: false, effectType: 'damage' }
    ]
  },
  palisade: {
    codeName: 'palisade',
    title: 'Palisade',
    side: 'Corp',
    type: 'ICE',
    subTypes: ['Barrier'],
    cost: 3,
    strength: 2,
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30072.jpg',
    text: '원격 서버를 보호하고 있는 동안, 이 ICE는 강도가 +2 상승합니다.\n↳ 런을 종료합니다.\n↳ 런을 종료합니다.',
    subroutines: [
      { id: 'palisade_sub_1', text: '런을 종료합니다.', broken: false, effectType: 'end-run' },
      { id: 'palisade_sub_2', text: '런을 종료합니다.', broken: false, effectType: 'end-run' }
    ]
  },
  tithe: {
    codeName: 'tithe',
    title: 'Tithe',
    side: 'Corp',
    type: 'ICE',
    subTypes: ['Sentry', 'AP'],
    cost: 1,
    strength: 1,
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30073.jpg',
    text: '↳ 1점의 넷 데미지를 입힙니다.\n↳ Corp는 1 [Credit]을 획득합니다.',
    subroutines: [
      { id: 'tithe_sub_1', text: '1점의 넷 데미지를 입힙니다.', broken: false, effectType: 'damage' },
      { id: 'tithe_sub_2', text: 'Corp는 1 [Credit]을 획득합니다.', broken: false, effectType: 'gain-credits-corp' }
    ]
  },
  whitespace: {
    codeName: 'whitespace',
    title: 'Whitespace',
    side: 'Corp',
    type: 'ICE',
    subTypes: ['Code Gate'],
    cost: 2,
    strength: 0,
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30074.jpg',
    text: '↳ 러너는 3 [Credits]를 잃습니다.\n↳ 러너가 6 [Credits] 이하라면 런을 종료합니다.',
    subroutines: [
      { id: 'whitespace_sub_1', text: '러너는 3 [Credits]를 잃습니다.', broken: false, effectType: 'lose-credits' },
      { id: 'whitespace_sub_2', text: '러너가 6 [Credits] 이하라면 런을 종료합니다.', broken: false, effectType: 'end-run-conditional' }
    ]
  }
};

// 고유 ID 생성을 위한 도우미
let cardIdCounter = 1;
export function createCardInstance(codeName: string): Card {
  const baseCard = CARD_DATABASE[codeName];
  if (!baseCard) {
    throw new Error(`카드 데이터베이스에 ${codeName} 카드가 존재하지 않습니다.`);
  }
  
  // subroutines 깊은 복사
  let subroutinesCopy: Subroutine[] | undefined = undefined;
  if (baseCard.subroutines) {
    subroutinesCopy = baseCard.subroutines.map(sub => ({ ...sub }));
  }

  return {
    ...baseCard,
    id: `${codeName}_${cardIdCounter++}`,
    rezzed: false,
    advancedCounters: 0,
    hostedCredits: 0,
    hostedCounters: 0,
    subroutines: subroutinesCopy
  };
}

// 초기화 스타터 덱 리스트 빌드
export function buildCorpStarterDeck(): Card[] {
  const deck: Card[] = [];
  
  // Agendas (7)
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('offworld_office'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('send_a_message'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('superconducting_hub'));
  
  // Assets (6)
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('nico_campaign'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('regolith_mining_license'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('urtica_cipher'));
  
  // Operations (7)
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('hedge_fund'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('government_subsidy'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('seamless_launch'));
  
  // Upgrades (1)
  deck.push(createCardInstance('manegarm_skunkworks'));
  
  // ICE (13)
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('bran_1_0'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('diviner'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('karuna'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('palisade'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('tithe'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('whitespace'));

  return deck;
}

export function buildRunnerStarterDeck(): Card[] {
  const deck: Card[] = [];
  
  // Events (14)
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('sure_gamble'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('creative_commission'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('overclock'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('jailbreak'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('tread_lightly'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('vrcation'));
  
  // Hardware/Resources (8)
  deck.push(createCardInstance('docklands_pass'));
  deck.push(createCardInstance('pennyshaver'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('telework_contract'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('smartware_distributor'));
  deck.push(createCardInstance('verbal_plasticity'));
  deck.push(createCardInstance('red_team')); // Red Team은 Resource
  
  // Programs (8)
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('cleaver'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('carmen'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('unity'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('mayfly'));

  return deck;
}
