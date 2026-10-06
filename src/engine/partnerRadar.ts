import type { EarthlyBranch, SajuResult } from './types';

/** 년지·일지 삼합 그룹별 도화(이성 매력) 지지. 寅午戌→卯, 申子辰→酉, 巳酉丑→午, 亥卯未→子 */
const PEACH_BRANCH: Record<EarthlyBranch, EarthlyBranch> = {
  寅: '卯', 午: '卯', 戌: '卯',
  申: '酉', 子: '酉', 辰: '酉',
  巳: '午', 酉: '午', 丑: '午',
  亥: '子', 卯: '子', 未: '子',
};

const CHARM_BRANCHES: readonly EarthlyBranch[] = ['子', '午', '卯', '酉'];

export type RadarLevel = '안정' | '주의' | '경계';

export interface PartnerRadarResult {
  /** 0~100. 높을수록 이성의 시선이 몰리는 구조 */
  score: number;
  level: RadarLevel;
  /** 년지·일지 기준 도화 지지가 사주에 들어와 있는 개수 */
  peachCount: number;
  /** 자·오·묘·유(매력 지지) 개수 */
  charmCount: number;
  headline: string;
  lines: string[];
}

const LEVEL_COPY: Record<RadarLevel, { headline: string; lines: string[] }> = {
  안정: {
    headline: '마음이 한곳에 머무는 편이에요',
    lines: [
      '이성의 시선을 크게 끌어당기는 구조는 아니에요.',
      '다만 사이가 소홀해지면 마음이 식을 수 있으니 표현은 꾸준히.',
    ],
  },
  주의: {
    headline: '눈길 받는 일이 잦은 사람이에요',
    lines: [
      '매력이 있어 먼저 다가오는 사람이 생기기 쉬워요.',
      '연락 시간이나 말투가 달라지면 가볍게 짚고 넘어가세요.',
    ],
  },
  경계: {
    headline: '이성의 시선이 몰리는 구조예요',
    lines: [
      '유혹과 호기심이 자주 찾아오는 사주예요.',
      '답장이 늦어지고 변명이 늘면 바로 확인해 보세요.',
    ],
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getPeachTargets(saju: SajuResult): Set<EarthlyBranch> {
  return new Set<EarthlyBranch>([
    PEACH_BRANCH[saju.pillars.year.branch],
    PEACH_BRANCH[saju.pillars.day.branch],
  ]);
}

/**
 * 상대의 사주에서 도화 신호를 읽어 딴마음 지수를 만든다.
 * 외부 통신 없이 지지 배치만으로 계산하는 순수 함수이며, 재미로 보는 참고용이다.
 */
export function analyzePartnerRadar(saju: SajuResult): PartnerRadarResult {
  const branches = [
    saju.pillars.year.branch,
    saju.pillars.month.branch,
    saju.pillars.day.branch,
    saju.pillars.time.branch,
  ];

  const targets = getPeachTargets(saju);

  const peachCount = branches.filter((branch) => targets.has(branch)).length;
  const charmCount = branches.filter((branch) => CHARM_BRANCHES.includes(branch)).length;

  const score = clamp(Math.round(15 + peachCount * 22 + charmCount * 7), 5, 96);
  const level: RadarLevel = score >= 70 ? '경계' : score >= 40 ? '주의' : '안정';
  const copy = LEVEL_COPY[level];

  return { score, level, peachCount, charmCount, headline: copy.headline, lines: [...copy.lines] };
}
