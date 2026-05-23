export type CardSide = 'Corp' | 'Runner';

export type CardType =
  | 'Identity'
  | 'Event'
  | 'Program'
  | 'Hardware'
  | 'Resource'
  | 'Agenda'
  | 'Asset'
  | 'Upgrade'
  | 'Operation'
  | 'ICE';

export type IceSubType = 'Barrier' | 'Code Gate' | 'Sentry' | 'AI' | 'Bioroid' | 'AP' | 'Destroyer' | 'Tracer';

export interface Subroutine {
  id: string;
  text: string;
  broken: boolean;
  effectType: string; // e.g. 'damage', 'end-run', 'install', 'lose-credits'
}

export interface Card {
  id: string;
  codeName: string; // 고유 코드 매핑용 (예: 'sure_gamble')
  title: string;
  side: CardSide;
  type: CardType;
  subTypes: IceSubType[];
  cost: number; // 설치 비용 또는 플레이 비용
  strength?: number; // ICE 혹은 아이스브레이커의 강도
  subroutines?: Subroutine[]; // ICE인 경우 서브루틴 목록
  memoryCost?: number; // 프로그램인 경우 메모리 소모량 (MU)
  agendaPoints?: number; // 아젠다인 경우 승점
  advancementCost?: number; // 아젠다인 경우 필요한 발전 카운터 수
  trashCost?: number; // 아셋/업그레이드 파괴 비용 (러너가 지불)
  text: string; // 카드 설명 텍스트
  isUnique?: boolean;
  imageUrl?: string;
  
  // 게임 내 실시간 상태 변수
  rezzed: boolean; // Corp 카드의 활성화 상태
  advancedCounters: number; // 아젠다/아셋에 놓인 발전 토큰 수
  hostedCredits: number; // Nico Campaign, Telework 등 카드 위 크레딧 수
  hostedCounters: number; // Smartware Distributor 등의 파워/기타 카운터 수
}

export type ServerName = 'HQ' | 'R&D' | 'Archives' | string; // 'Remote 1', 'Remote 2' 등

export interface Server {
  id: string;
  name: ServerName;
  ice: Card[]; // 서버를 보호하고 있는 ICE 목록 (인덱스 0이 가장 안쪽, 마지막이 가장 바깥쪽)
  root: Card[]; // 서버 내부의 자산(Asset), 아젠다(Agenda), 업그레이드(Upgrade) 목록
}

export interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  sender: CardSide | 'System';
}

export type RunPhase = 
  | 'initiation'   // 러너가 런을 시작함
  | 'approach'     // ICE에 접근함 (Corp가 rez할 기회)
  | 'encounter'    // ICE와 인카운터함 (브레이커로 서브루틴 해제 기회)
  | 'success'      // 모든 방어선을 뚫고 서버에 진입 성공
  | 'breach'       // 카드 액세스 수행 중
  | 'end';         // 런이 종료됨 (성공 혹은 실패)

export interface RunState {
  target: ServerName;
  iceIndex: number; // 현재 접근/조우 중인 ICE의 index (protecting ICE array index)
  phase: RunPhase;
  currentIce: Card | null; // 현재 인카운터 중인 ICE
  bypassed: boolean; // 현재 ICE를 패스했는지 여부
  subroutines: Subroutine[]; // 현재 조우 중인 ICE의 서브루틴들 (실시간 broken 상태 추적용)
  jackedOut: boolean; // 러너가 도망쳤는지 여부
  success: boolean; // 성공적으로 진입했는지 여부
  accessedCards: Card[]; // 액세스 중인 카드들
  accessIndex: number; // 몇 번째 카드를 액세스 중인지
  overclockCreditsUsed: number; // Overclock 등 임시 크레딧 사용량 추적용
  overclockCredits?: number; // Overclock 임시 크레딧 잔액 추적용
  manegarmSkunkworksCostPaid?: boolean; // Manegarm Skunkworks 방해 요건 결제 여부
  needSkunkworksPay?: boolean; // Manegarm Skunkworks 비용 결제 대기 중 여부
  viaCardCode?: string; // 런을 유발한 카드 (예: 'red_team')
}

export type GamePhase =
  | 'setup'
  | 'corp-mulligan'   // 기업 멀리건 단계
  | 'runner-mulligan' // 러너 멀리건 단계
  | 'corp-draw'      // 회사 차례 강제 드로우 단계
  | 'corp-action'    // 회사 행동 단계
  | 'corp-discard'   // 회사 버리기 단계 (손패 제한 초과 시)
  | 'runner-action'  // 러너 행동 단계
  | 'runner-discard' // 러너 버리기 단계 (손패 제한 초과 시)
  | 'game-over';

export type GameMode = 'runner-human' | 'corp-human' | 'ai-vs-ai';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  activePlayer: CardSide;
  turn: number;
  winner: CardSide | null;
  phase: GamePhase;
  gameMode: GameMode;
  difficulty: Difficulty;
  logs: LogEntry[];
  
  corp: {
    credits: number;
    clicks: number;
    deck: Card[];
    hand: Card[];
    discard: Card[]; // Archives
    scoreArea: Card[];
    score: number;
    maximumHandSize: number;
  };
  
  runner: {
    credits: number;
    clicks: number;
    deck: Card[];
    hand: Card[]; // Grip
    discard: Card[]; // Heap
    scoreArea: Card[];
    score: number;
    rig: Card[]; // 설치된 프로그램, 하드웨어, 리소스
    maximumHandSize: number;
    memoryLimit: number; // 기본 4 MU
    memoryUsed: number;
    tags: number;
    brainDamage: number;
    flatlined: boolean;
    successfulRunThisTurn: boolean;
  };
  
  servers: {
    [key: string]: Server;
  };
  
  run: RunState | null; // 진행 중인 런 정보 (없으면 null)
}
