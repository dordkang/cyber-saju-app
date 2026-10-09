import type { FiveElement } from '../engine/types';

/** 세로 스냅 릴스가 고정으로 다루는 카드 수 */
export const REEL_SECTION_COUNT = 9;

export type ReelSectionId =
  | 'omen'
  | 'life'
  | 'people'
  | 'money'
  | 'health'
  | 'celebrity'
  | 'mbti'
  | 'circuit'
  | 'chamber';

export type ReelAccent = 'cyan' | 'crimson' | 'amber';

export const REEL_PALETTE = {
  obsidian: '#0B0E14',
  cyan: '#00F5D4',
  crimson: '#FF2A4B',
  amber: '#FFB703',
  text: '#F4F7FB',
  muted: '#8B97A8',
  ink: '#04110E',
} as const;

export const REEL_ACCENT_HEX: Record<ReelAccent, string> = {
  cyan: REEL_PALETTE.cyan,
  crimson: REEL_PALETTE.crimson,
  amber: REEL_PALETTE.amber,
};

/** 오행 네온 아우라. 그라디언트와 시그넷 색에 쓴다. */
export const ELEMENT_AURA: Record<FiveElement, { core: string; mist: string; hanja: string }> = {
  Wood: { core: '#00F5D4', mist: 'rgba(0, 245, 212, 0.28)', hanja: '木' },
  Fire: { core: '#FF2A4B', mist: 'rgba(255, 42, 75, 0.30)', hanja: '火' },
  Earth: { core: '#FFB703', mist: 'rgba(255, 183, 3, 0.28)', hanja: '土' },
  Metal: { core: '#D9E4F2', mist: 'rgba(217, 228, 242, 0.22)', hanja: '金' },
  Water: { core: '#4DA3FF', mist: 'rgba(77, 163, 255, 0.30)', hanja: '水' },
};

export interface ReelSectionMeta {
  id: ReelSectionId;
  index: number;
  /** 화면 칩. 예: 01 */
  no: string;
  /** 짧은 장르 라벨 */
  kicker: string;
  title: string;
  subtitle: string;
  accent: ReelAccent;
}

export const REEL_SECTIONS: readonly ReelSectionMeta[] = [
  {
    id: 'omen',
    index: 0,
    no: '01',
    kicker: '오늘의 징조',
    title: '하늘이 오늘\n보내는 신호',
    subtitle: '일진과 본원이 부딪히는 지점을 한 장으로 읽어요.',
    accent: 'crimson',
  },
  {
    id: 'life',
    index: 1,
    no: '02',
    kicker: '인생 · 대운',
    title: '10년마다 바뀌는\n인생의 파도',
    subtitle: '지금 타고 있는 대운부터 앞으로 올 파도까지.',
    accent: 'amber',
  },
  {
    id: 'people',
    index: 2,
    no: '03',
    kicker: '사람 · 속마음',
    title: '상대의 딴마음\n레이더',
    subtitle: '내 사람 사주 속 도화와 이별수를 짚어요.',
    accent: 'crimson',
  },
  {
    id: 'money',
    index: 3,
    no: '04',
    kicker: '돈 · 흐름',
    title: '오늘의 돈 버는 엔진\n지갑 방어선',
    subtitle: '벌리는 기운과 새는 구멍을 숫자로 봐요.',
    accent: 'amber',
  },
  {
    id: 'health',
    index: 4,
    no: '05',
    kicker: '건강 · 리셋',
    title: '하루 3초,\n오행 배터리',
    subtitle: '감정·사건·잔량만 고르면 처방이 바로 뜹니다.',
    accent: 'cyan',
  },
  {
    id: 'celebrity',
    index: 5,
    no: '06',
    kicker: '영혼의 공명',
    title: '나와 같은 결의\n유명인 매칭',
    subtitle: '일간과 오행이 겹치는 사람을 로컬에서 고릅니다.',
    accent: 'crimson',
  },
  {
    id: 'mbti',
    index: 6,
    no: '07',
    kicker: '가면과 본성',
    title: '선천 사주 코어\nvs 현실 가면',
    subtitle: '페르소나를 유지하느라 새는 에너지를 수치화해요.',
    accent: 'cyan',
  },
  {
    id: 'circuit',
    index: 7,
    no: '08',
    kicker: '오행 회로',
    title: '목·화·토·금·수\n에너지 밸런스',
    subtitle: '원국의 과다와 결핍을 네온 서킷으로 보여 줍니다.',
    accent: 'amber',
  },
  {
    id: 'chamber',
    index: 8,
    no: '09',
    kicker: '도사의 방',
    title: '말투를 고르고\n설정을 닫아요',
    subtitle: '프로필, 백업, 배경음은 여기서 한 번에 다룹니다.',
    accent: 'crimson',
  },
];

export interface TodayOmenData {
  /** 예: 丙子(병자). 계산 실패 시 빈 문자열 */
  dayPillarText: string;
  element: FiveElement;
  /** 예: 백금(白金)의 기운 */
  elementName: string;
  /** 일간 대비 오늘 십신 키워드 */
  keyword: string;
  fortuneText: string;
  luckyItem: string;
  luckyReason: string;
  profileLabel: string;
}

export interface ReelsLifePeek {
  ageLabel: string;
  ganji: string;
  theme: string;
  currentAgeLabel?: string;
}

export interface ReelsPeoplePeek {
  label: string;
  radarScore: number | null;
  radarLevel: string | null;
}

export interface ReelsMoneyPeek {
  headline: string;
  power: number;
  defense: number;
  status: string;
}

export interface ReelsMbtiPeek {
  innate: string;
  actual: string;
  syncRate: number;
  leakage: number;
}

export interface ReelsContext {
  omen: TodayOmenData;
  life?: ReelsLifePeek | null;
  people?: ReelsPeoplePeek | null;
  money?: ReelsMoneyPeek | null;
  batteryLevel?: number | null;
  mbti?: ReelsMbtiPeek | null;
  /** 오행 회로 카드에 넘기는 원국 비율 */
  elementsRatio?: Record<FiveElement, number> | null;
  personaLabel?: string;
  soundOn?: boolean;
}

export interface ReelsActionHandlers {
  onSettingsPress?: () => void;
  onToggleSound?: () => void;
  onOpenTimeline?: () => void;
  onOpenPartner?: () => void;
  onOpenReport?: () => void;
  onOpenDailyCard?: () => void;
  onOpenCelebrity?: () => void;
  onOpenMbti?: () => void;
  onOpenPersona?: () => void;
}
