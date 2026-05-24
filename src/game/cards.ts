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
  rene_loup_arcemont_party_animal: {
    codeName: 'rene_loup_arcemont_party_animal',
    title: 'René “Loup” Arcemont: Party Animal',
    side: 'Runner',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: 'Anarch Identity. 매 턴 당신이 액세스 중인 카드를 처음으로 폐기(Trash)할 때, 1 [Credit]을 획득하고 카드 1장을 드로우합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30001.jpg',
  },
  zahya_sadeghi_versatile_smuggler: {
    codeName: 'zahya_sadeghi_versatile_smuggler',
    title: 'Zahya Sadeghi: Versatile Smuggler',
    side: 'Runner',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: 'Criminal Identity. 매 턴 1회, HQ나 R&D의 런이 끝났을 때, 해당 런 동안 액세스한 카드당 1 [Credit]을 획득할 수 있습니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30010.jpg',
  },
  tao_salonga_telepresence_magician: {
    codeName: 'tao_salonga_telepresence_magician',
    title: 'Tāo Salonga: Telepresence Magician',
    side: 'Runner',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: 'Shaper Identity. 의제가 득점되거나 탈취될 때마다, 설치된 ICE 2개의 위치를 서로 바꿀 수 있습니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30019.jpg',
  },
  wildcat_strike: {
    codeName: 'wildcat_strike',
    title: "Wildcat Strike",
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 2,
    text: "콥의 선택에 따라 다음 중 하나를 해결합니다: 러너가 6 [Credits]를 획득하거나, 카드를 4장 드로우합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30002.jpg',
  },
  carnivore: {
    codeName: 'carnivore',
    title: "Carnivore",
    side: 'Runner',
    type: 'Hardware',
    subTypes: ["Console"],
    cost: 4,
    text: "+1 [Memory Unit]. 액세스 중인 카드를 폐기(Trash)하기 위해 자신의 손패에서 카드 2장을 폐기할 수 있습니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30003.jpg',
  },
  botulus: {
    codeName: 'botulus',
    title: "Botulus",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Virus","Trojan"],
    cost: 2,
    text: "ICE 위에만 설치할 수 있습니다. 자신의 턴이 시작될 때, 이 프로그램 위에 바이러스 카운터 1개를 올립니다. 바이러스 카운터 1개를 제거하여 호스트 ICE의 서브루틴 1개를 해제합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30004.jpg',
  },
  buzzsaw: {
    codeName: 'buzzsaw',
    title: "Buzzsaw",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Icebreaker","Decoder","Code Gate"],
    cost: 4,
    strength: 3,
    memoryCost: 1,
    text: "1 [Credit]: 코드 게이트(Code Gate) 서브루틴을 최대 2개까지 해제합니다.\n3 [Credits]: 강도 +1.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30005.jpg',
  },
  fermenter: {
    codeName: 'fermenter',
    title: "Fermenter",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Virus"],
    cost: 1,
    text: "자신의 턴이 시작될 때, 이 프로그램 위에 바이러스 카운터 1개를 올립니다. [Click]을 소모하고 이 프로그램을 폐기하여 카운터당 2 [Credits]를 획득합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30007.jpg',
  },
  leech: {
    codeName: 'leech',
    title: "Leech",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Virus"],
    cost: 1,
    text: "중앙 서버에 성공적인 런을 완료할 때마다 바이러스 카운터 1개를 올립니다. 바이러스 카운터 1개를 제거하여 현재 조우 중인 ICE의 강도를 1 낮춥니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30008.jpg',
  },
  cookbook: {
    codeName: 'cookbook',
    title: "Cookbook",
    side: 'Runner',
    type: 'Resource',
    subTypes: ["Virtual"],
    cost: 1,
    text: "당신이 바이러스 프로그램을 설치할 때마다, 그 위에 바이러스 카운터 1개를 올릴 수 있습니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30009.jpg',
  },
  mutual_favor: {
    codeName: 'mutual_favor',
    title: "Mutual Favor",
    side: 'Runner',
    type: 'Event',
    subTypes: [],
    cost: 0,
    text: "자신의 덱에서 아이스브레이커 1장을 찾아 공개하고 손패로 가져옵니다. (덱은 셔플합니다.) 만약 이번 턴에 성공적인 런을 완료했다면, 그 프로그램을 즉시 설치할 수 있습니다 (설치 비용 지불).",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30011.jpg',
  },
  marjanah: {
    codeName: 'marjanah',
    title: "Marjanah",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Icebreaker","Fracter","Barrier"],
    cost: 0,
    strength: 1,
    memoryCost: 1,
    text: "2 [Credits]: 장벽(Barrier) 서브루틴 1개를 해제합니다. (이번 턴 성공적인 런이 있었다면 1 [Credit]만 소모합니다.)\n1 [Credit]: 강도 +1.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30016.jpg',
  },
  tranquilizer: {
    codeName: 'tranquilizer',
    title: "Tranquilizer",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Virus","Trojan"],
    cost: 2,
    text: "ICE 위에만 설치할 수 있습니다. 자신의 턴이 시작될 때, 이 프로그램 위에 바이러스 카운터 1개를 올립니다. 바이러스 카운터가 3개 이상 쌓이면 호스트 ICE를 비레즈(Derez) 시킵니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30017.jpg',
  },
  dzmz_optimizer: {
    codeName: 'dzmz_optimizer',
    title: "DZMZ Optimizer",
    side: 'Runner',
    type: 'Hardware',
    subTypes: [],
    cost: 2,
    text: "+1 [Memory Unit]. 매 턴 처음으로 설치하는 프로그램의 설치 비용이 1 [Credit] 감소합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30022.jpg',
  },
  pantograph: {
    codeName: 'pantograph',
    title: "Pantograph",
    side: 'Runner',
    type: 'Hardware',
    subTypes: ["Console"],
    cost: 2,
    text: "+1 [Memory Unit]. 의제가 득점되거나 탈취될 때마다, 1 [Credit]을 획득하고 손패에서 카드 1장을 설치할 수 있습니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30023.jpg',
  },
  conduit: {
    codeName: 'conduit',
    title: "Conduit",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Virus"],
    cost: 4,
    text: "R&D에 성공적인 런을 완료할 때마다 이 프로그램 위에 바이러스 카운터 1개를 올립니다.\n[Click]: R&D에 런을 시작합니다. 성공하면 R&D 맨 위 액세스 시 카운터 수만큼 추가 카드를 액세스합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30024.jpg',
  },
  echelon: {
    codeName: 'echelon',
    title: "Echelon",
    side: 'Runner',
    type: 'Program',
    subTypes: ["Icebreaker","Killer","Sentry"],
    cost: 3,
    strength: 0,
    memoryCost: 1,
    text: "설치된 모든 아이스브레이커당 강도가 +1씩 패시브로 상승합니다.\n1 [Credit]: 센트리(Sentry) 서브루틴 1개를 해제합니다.\n3 [Credits]: 강도 +2.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30025.jpg',
  },
  t400_memory_diamond: {
    codeName: 't400_memory_diamond',
    title: "T400 Memory Diamond",
    side: 'Runner',
    type: 'Hardware',
    subTypes: ["Chip"],
    cost: 2,
    text: "+1 [Memory Unit]. 최대 손패 크기가 1장 늘어납니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30031.jpg',
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
    subTypes: ['Console'],
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
    subTypes: ['Job'],
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
    text: '[Click]: 이 카드 위에 3 [Credits]를 올려둡니다.\n자신의 턴이 시작될 때, 이 카드에서 1 [Credit]을 가져옵니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30033.jpg',
  },
  
  // Programs (Icebreakers)
  cleaver: {
    codeName: 'cleaver',
    title: 'Cleaver',
    side: 'Runner',
    type: 'Program',
    subTypes: ['Icebreaker', 'Fracter', 'Barrier'],
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
    subTypes: ['Icebreaker', 'Killer', 'Sentry'],
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
    subTypes: ['Icebreaker', 'Decoder', 'Code Gate'],
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
    subTypes: ['AI', 'Icebreaker'],
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
  haas_bioroid_precision_design: {
    codeName: 'haas_bioroid_precision_design',
    title: 'Haas-Bioroid: Precision Design',
    side: 'Corp',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: 'Haas-Bioroid Identity. 최대 손패 크기 +1. 당신이 의제를 득점할 때마다, 아카이브에서 카드 1장을 선택해 손패로 가져올 수 있습니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30035.jpg',
  },
  jinteki_restoring_humanity: {
    codeName: 'jinteki_restoring_humanity',
    title: 'Jinteki: Restoring Humanity',
    side: 'Corp',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: 'Jinteki Identity. 자신의 디스카드 페이즈가 끝날 때, 아카이브에 뒷면으로 된 카드가 있다면 1 [Credit]을 획득합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30043.jpg',
  },
  nbn_reality_plus: {
    codeName: 'nbn_reality_plus',
    title: 'NBN: Reality Plus',
    side: 'Corp',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: 'NBN Identity. 매 턴 처음으로 러너가 태그를 획득할 때, 2 [Credits]를 획득하거나 카드 2장을 드로우할 수 있습니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30051.jpg',
  },
  weyland_consortium_built_to_last: {
    codeName: 'weyland_consortium_built_to_last',
    title: 'Weyland Consortium: Built to Last',
    side: 'Corp',
    type: 'Identity',
    subTypes: [],
    cost: 0,
    text: 'Weyland Identity. 당신이 카드 위에 발전 카운터를 올릴 때, 해당 카드에 발전 카운터가 전혀 없었다면 2 [Credits]를 획득합니다.',
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30059.jpg',
  },
  luminal_transubstantiation: {
    codeName: 'luminal_transubstantiation',
    title: "Luminal Transubstantiation",
    side: 'Corp',
    type: 'Agenda',
    subTypes: ["Research"],
    cost: 0,
    advancementCost: 3,
    agendaPoints: 2,
    text: "득점 시, 3 [Clicks]를 획득합니다. 이번 턴에 다른 아젠다를 득점할 수 없습니다. 덱당 1장 제한.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30036.jpg',
  },
  ansel_1_0: {
    codeName: 'ansel_1_0',
    title: "Ansel 1.0",
    side: 'Corp',
    type: 'ICE',
    subTypes: ["Sentry","Bioroid","Destroyer"],
    cost: 6,
    strength: 4,
    subroutines: [
      {"id":"ansel_sub1","text":"설치된 프로그램 1개를 폐기합니다.","broken":false,"effectType":"trash-program"},
      {"id":"ansel_sub2","text":"아카이브나 HQ에서 카드 1장을 설치합니다.","broken":false,"effectType":"install-from-archives-or-hq"},
      {"id":"ansel_sub3","text":"런을 종료합니다.","broken":false,"effectType":"end-run"}
    ],
    text: "러너는 [Click]을 소모하여 이 ICE의 서브루틴 1개를 임의로 해제할 수 있습니다.\n↳ 설치된 프로그램 1개를 폐기합니다.\n↳ 아카이브나 HQ에서 카드 1장을 설치합니다.\n↳ 런을 종료합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30038.jpg',
  },
  sprint: {
    codeName: 'sprint',
    title: "Sprint",
    side: 'Corp',
    type: 'Operation',
    subTypes: [],
    cost: 0,
    text: "카드 3장을 드로우합니다. HQ에서 카드 2장을 R&D에 섞어 넣습니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30041.jpg',
  },
  longevity_serum: {
    codeName: 'longevity_serum',
    title: "Longevity Serum",
    side: 'Corp',
    type: 'Agenda',
    subTypes: ["Research"],
    cost: 0,
    advancementCost: 3,
    agendaPoints: 2,
    text: "득점 시, HQ에서 원하는 장수의 카드를 폐기하고, 아카이브에서 카드를 최대 3장까지 선택해 R&D에 섞어 넣습니다. 덱당 1장 제한.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30044.jpg',
  },
  hansei_review: {
    codeName: 'hansei_review',
    title: "Hansei Review",
    side: 'Corp',
    type: 'Operation',
    subTypes: ["Transaction"],
    cost: 5,
    text: "10 [Credits]를 획득합니다. HQ에서 카드 1장을 폐기합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30048.jpg',
  },
  neurospike: {
    codeName: 'neurospike',
    title: "Neurospike",
    side: 'Corp',
    type: 'Operation',
    subTypes: ["Gray Ops"],
    cost: 3,
    text: "이번 턴에 득점한 아젠다 포인트만큼 넷 데미지(Net Damage)를 러너에게 입힙니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30049.jpg',
  },
  anoetic_void: {
    codeName: 'anoetic_void',
    title: "Anoetic Void",
    side: 'Corp',
    type: 'Upgrade',
    subTypes: [],
    cost: 0,
    text: "러너가 이 서버에 접근할 때, 2 [Credits]를 지불하고 HQ에서 카드 2장을 폐기하여 런을 종료시킬 수 있습니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30050.jpg',
  },
  tomorrows_headline: {
    codeName: 'tomorrows_headline',
    title: "Tomorrow's Headline",
    side: 'Corp',
    type: 'Agenda',
    subTypes: ["Ambush"],
    cost: 0,
    advancementCost: 3,
    agendaPoints: 2,
    text: "득점하거나 러너에게 탈취당할 때, 러너에게 태그(Tag) 1개를 줍니다. 덱당 1장 제한.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30052.jpg',
  },
  spin_doctor: {
    codeName: 'spin_doctor',
    title: "Spin Doctor",
    side: 'Corp',
    type: 'Asset',
    subTypes: ["Character"],
    cost: 0,
    text: "레즈 시, 카드 2장을 드로우합니다. [Click] 혹은 무료 발동: 이 카드를 게임에서 제외하고, 아카이브의 카드 2장을 R&D에 섞어 넣습니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30053.jpg',
  },
  funhouse: {
    codeName: 'funhouse',
    title: "Funhouse",
    side: 'Corp',
    type: 'ICE',
    subTypes: ["Code Gate"],
    cost: 5,
    strength: 4,
    subroutines: [{"id":"fun_sub1","text":"러너는 태그 1개를 획득합니다 (4 [Credits]를 지불하여 방지 가능).","broken":false,"effectType":"give-tag-unless-pay-4-credits"}],
    text: "조우 시, 러너가 태그 1개를 받지 않으면 런을 종료합니다.\n↳ 러너가 4 [Credits]를 지불하여 방지하지 않으면, 태그 1개를 줍니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30054.jpg',
  },
  ping: {
    codeName: 'ping',
    title: "Ping",
    side: 'Corp',
    type: 'ICE',
    subTypes: ["Barrier"],
    cost: 2,
    strength: 1,
    subroutines: [{"id":"ping_sub1","text":"루프를 종료합니다 (End the run)","broken":false,"effectType":"end-run"}],
    text: "런 도중 레즈 시, 러너에게 태그 1개를 줍니다.\n↳ 런을 종료합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30055.jpg',
  },
  predictive_planogram: {
    codeName: 'predictive_planogram',
    title: "Predictive Planogram",
    side: 'Corp',
    type: 'Operation',
    subTypes: ["Transaction"],
    cost: 0,
    text: "3 [Credits]를 획득하거나 카드 3장을 드로우합니다. (러너가 태그된 상태라면 둘 다 수행합니다.)",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30056.jpg',
  },
  public_trail: {
    codeName: 'public_trail',
    title: "Public Trail",
    side: 'Corp',
    type: 'Operation',
    subTypes: ["Gray Ops"],
    cost: 4,
    text: "러너가 직전 턴에 성공적인 런을 완료한 경우에만 플레이할 수 있습니다. 러너가 8 [Credits]를 지불하여 방지하지 않으면 러너에게 태그 1개를 줍니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30057.jpg',
  },
  amaze_amusements: {
    codeName: 'amaze_amusements',
    title: "AMAZE Amusements",
    side: 'Corp',
    type: 'Upgrade',
    subTypes: [],
    cost: 1,
    text: "런이 종료될 때, 러너가 아젠다를 탈취했다면, 러너에게 태그 2개를 줍니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30058.jpg',
  },
  above_the_law: {
    codeName: 'above_the_law',
    title: "Above the Law",
    side: 'Corp',
    type: 'Agenda',
    subTypes: ["Security"],
    cost: 0,
    advancementCost: 3,
    agendaPoints: 2,
    text: "득점 시, 설치된 리소스 1개를 폐기할 수 있습니다. 덱당 1장 제한.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30060.jpg',
  },
  clearinghouse: {
    codeName: 'clearinghouse',
    title: "Clearinghouse",
    side: 'Corp',
    type: 'Asset',
    subTypes: ["Hostile"],
    cost: 0,
    text: "발전이 가능합니다. Corp의 턴이 시작될 때, 이 카드를 폐기하여 이 카드 위에 놓인 발전 카운터당 1점의 육체 피해(Meat Damage)를 러너에게 입힐 수 있습니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30061.jpg',
  },
  ballista: {
    codeName: 'ballista',
    title: "Ballista",
    side: 'Corp',
    type: 'ICE',
    subTypes: ["Sentry","Destroyer"],
    cost: 5,
    strength: 4,
    subroutines: [{"id":"ballista_sub1","text":"설치된 프로그램 1개를 폐기하거나 런을 종료합니다.","broken":false,"effectType":"ballista-sub"}],
    text: "↳ 설치된 프로그램 1개를 폐기하거나 런을 종료합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30062.jpg',
  },
  pharos: {
    codeName: 'pharos',
    title: "Pharos",
    side: 'Corp',
    type: 'ICE',
    subTypes: ["Barrier"],
    cost: 7,
    strength: 5,
    subroutines: [
      {"id":"pharos_sub1","text":"러너는 태그 1개를 획득합니다.","broken":false,"effectType":"give-tag"},
      {"id":"pharos_sub2","text":"런을 종료합니다.","broken":false,"effectType":"end-run"},
      {"id":"pharos_sub3","text":"런을 종료합니다.","broken":false,"effectType":"end-run"}
    ],
    text: "발전 카운터가 3개 이상 쌓여있다면 강도가 +5 증가합니다.\n↳ 러너에게 태그 1개를 줍니다.\n↳ 런을 종료합니다.\n↳ 런을 종료합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30063.jpg',
  },
  retribution: {
    codeName: 'retribution',
    title: "Retribution",
    side: 'Corp',
    type: 'Operation',
    subTypes: ["Gray Ops"],
    cost: 1,
    text: "러너가 태그된 상태일 때만 플레이할 수 있습니다. 설치된 프로그램이나 하드웨어 1개를 폐기합니다.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30065.jpg',
  },
  malapert_data_vault: {
    codeName: 'malapert_data_vault',
    title: "Malapert Data Vault",
    side: 'Corp',
    type: 'Upgrade',
    subTypes: [],
    cost: 1,
    text: "이 서버에 설치된 아젠다가 득점될 때마다, R&D에서 아젠다가 아닌 카드 1장을 찾아 공개하고 HQ로 가져올 수 있습니다. (R&D를 셔플합니다.)",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30066.jpg',
  },
  orbital_superiority: {
    codeName: 'orbital_superiority',
    title: "Orbital Superiority",
    side: 'Corp',
    type: 'Agenda',
    subTypes: ["Security"],
    cost: 0,
    advancementCost: 4,
    agendaPoints: 2,
    text: "득점 시, 러너가 태그된 상태라면 4점의 육체 피해(Meat Damage)를 입힙니다. 태그되지 않았다면 태그 1개를 줍니다. 덱당 1장 제한.",
    imageUrl: 'https://card-images.netrunnerdb.com/v2/medium/30068.jpg',
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
    subTypes: ['Barrier', 'Bioroid'],
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

// 초기화 스타터 덱 리스트 빌드 (기본/하위호환성 유지용)
export function buildCorpStarterDeck(): Card[] {
  return buildJintekiDeck(); // 기본은 Jinteki 덱으로 대체
}

export function buildRunnerStarterDeck(): Card[] {
  return buildTaoDeck(); // 기본은 Tao 덱으로 대체
}

// ================= RUNNER DECKS =================

// 1. René “Loup” Arcemont (Anarch 테마 덱 - 41장)
export function buildLoupDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('wildcat_strike'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('carnivore'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('botulus'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('buzzsaw'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('cleaver'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('fermenter'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('leech'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('cookbook'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('docklands_pass'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('carmen'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('dzmz_optimizer'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('overclock'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('sure_gamble'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('smartware_distributor'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('verbal_plasticity'));
  return deck;
}

// 2. Zahya Sadeghi (Criminal 테마 덱 - 40장)
export function buildZahyaDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('buzzsaw'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('leech'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('mutual_favor'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('tread_lightly'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('docklands_pass'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('pennyshaver'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('carmen'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('marjanah'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('red_team'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('vrcation'));
  deck.push(createCardInstance('conduit'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('jailbreak'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('overclock'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('sure_gamble'));
  deck.push(createCardInstance('t400_memory_diamond'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('smartware_distributor'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('verbal_plasticity'));
  return deck;
}

// 3. Tāo Salonga (Shaper 테마 덱 - 40장)
export function buildTaoDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('cleaver'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('tread_lightly'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('tranquilizer'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('creative_commission'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('vrcation'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('dzmz_optimizer'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('pantograph'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('conduit'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('echelon'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('unity'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('telework_contract'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('jailbreak'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('sure_gamble'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('mayfly'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('smartware_distributor'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('verbal_plasticity'));
  return deck;
}


// ================= CORPORATION DECKS =================

// 4. Haas-Bioroid: Precision Design (44장)
export function buildHaasBioroidDeck(): Card[] {
  const deck: Card[] = [];
  deck.push(createCardInstance('luminal_transubstantiation'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('nico_campaign'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('ansel_1_0'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('bran_1_0'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('seamless_launch'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('sprint'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('manegarm_skunkworks'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('urtica_cipher'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('predictive_planogram'));
  deck.push(createCardInstance('pharos'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('government_subsidy'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('offworld_office'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('send_a_message'));
  deck.push(createCardInstance('superconducting_hub'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('palisade'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('tithe'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('whitespace'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('hedge_fund'));
  return deck;
}

// 5. Jinteki: Restoring Humanity (44장)
export function buildJintekiDeck(): Card[] {
  const deck: Card[] = [];
  deck.push(createCardInstance('ansel_1_0'));
  deck.push(createCardInstance('longevity_serum'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('urtica_cipher'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('diviner'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('karuna'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('hansei_review'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('anoetic_void'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('spin_doctor'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('clearinghouse'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('offworld_office'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('orbital_superiority'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('send_a_message'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('regolith_mining_license'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('palisade'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('tithe'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('whitespace'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('hedge_fund'));
  return deck;
}

// 6. NBN: Reality Plus (44장)
export function buildNbnDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('manegarm_skunkworks'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('hansei_review'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('neurospike'));
  deck.push(createCardInstance('tomorrows_headline'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('spin_doctor'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('funhouse'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('ping'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('predictive_planogram'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('public_trail'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('amaze_amusements'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('orbital_superiority'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('send_a_message'));
  deck.push(createCardInstance('superconducting_hub'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('palisade'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('tithe'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('whitespace'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('hedge_fund'));
  return deck;
}

// 7. Weyland Consortium: Built to Last (44장)
export function buildWeylandDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('sprint'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('funhouse'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('predictive_planogram'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('public_trail'));
  deck.push(createCardInstance('above_the_law'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('ballista'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('pharos'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('government_subsidy'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('retribution'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('malapert_data_vault'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('offworld_office'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('orbital_superiority'));
  for (let i = 0; i < 2; i++) deck.push(createCardInstance('send_a_message'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('palisade'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('tithe'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('whitespace'));
  for (let i = 0; i < 3; i++) deck.push(createCardInstance('hedge_fund'));
  return deck;
}

