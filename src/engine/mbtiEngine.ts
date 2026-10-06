import type { EarthlyBranch, FiveElement, HeavenlyStem, SajuResult } from './types';

export type EiLetter = 'E' | 'I';
export type SnLetter = 'S' | 'N';
export type TfLetter = 'T' | 'F';
export type JpLetter = 'J' | 'P';
export type MbtiType = `${EiLetter}${SnLetter}${TfLetter}${JpLetter}`;

export type TenGod =
  | '비견'
  | '겁재'
  | '식신'
  | '상관'
  | '편재'
  | '정재'
  | '편관'
  | '정관'
  | '편인'
  | '정인';

export type TenGodCounts = Record<TenGod, number>;

export interface AxisResult<L extends string> {
  letter: L;
  scoreA: number;
  scoreB: number;
  tieBroken: boolean;
}

export interface SajuMbtiAnalysis {
  mbti: MbtiType;
  axes: {
    EI: AxisResult<EiLetter>;
    SN: AxisResult<SnLetter>;
    TF: AxisResult<TfLetter>;
    JP: AxisResult<JpLetter>;
  };
  tenGods: TenGodCounts;
}

export interface SajuMbtiSummary {
  mbti: string;
  description: string;
}

export interface MbtiSyncResult {
  syncRate: number;
  energyLeakage: number;
}

interface StemInfo {
  element: FiveElement;
  yang: boolean;
}

const STEM_INFO: Record<HeavenlyStem, StemInfo> = {
  '甲': { element: 'Wood', yang: true },
  '乙': { element: 'Wood', yang: false },
  '丙': { element: 'Fire', yang: true },
  '丁': { element: 'Fire', yang: false },
  '戊': { element: 'Earth', yang: true },
  '己': { element: 'Earth', yang: false },
  '庚': { element: 'Metal', yang: true },
  '辛': { element: 'Metal', yang: false },
  '壬': { element: 'Water', yang: true },
  '癸': { element: 'Water', yang: false },
};

// 십성 판정 시 지지의 오행·음양은 본기(本氣) 천간을 기준으로 한다.
const BRANCH_MAIN_STEM: Record<EarthlyBranch, HeavenlyStem> = {
  '子': '癸', '丑': '己', '寅': '甲', '卯': '乙',
  '辰': '戊', '巳': '丙', '午': '丁', '未': '己',
  '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬',
};

// 상생: 목→화→토→금→수→목
const GENERATES: Record<FiveElement, FiveElement> = {
  Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood',
};

// 상극: 목→토→수→화→금→목
const CONTROLS: Record<FiveElement, FiveElement> = {
  Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood',
};

const E_I_THRESHOLD = 50;
const EARTH_S_THRESHOLD = 25;
const WOOD_WATER_N_THRESHOLD = 25;
const MBTI_PATTERN = /^[EI][SN][TF][JP]$/;

const LETTER_TRAITS: Record<string, string> = {
  E: '목·화 기운으로 에너지를 바깥에 쏟는 외향',
  I: '금·수 기운으로 에너지를 안에 모으는 내향',
  S: '토 기운의 현실·경험 중심 감각',
  N: '목·수 기운의 가능성·직관 중심 인식',
  T: '금 기운의 논리·원칙 중심 사고',
  F: '화 기운의 공감·감정 중심 판단',
  J: '정관·정인·정재의 규칙적이고 계획적인 성향',
  P: '편관·편인·편재·식상의 유연하고 임기응변적인 성향',
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createEmptyTenGodCounts(): TenGodCounts {
  return {
    비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0,
    정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
  };
}

function getStemInfo(stem: string | undefined): StemInfo | null {
  if (!stem) return null;
  return STEM_INFO[stem as HeavenlyStem] ?? null;
}

function getBranchInfo(branch: string | undefined): StemInfo | null {
  if (!branch) return null;
  const mainStem = BRANCH_MAIN_STEM[branch as EarthlyBranch];
  return mainStem ? STEM_INFO[mainStem] : null;
}

function resolveTenGod(day: StemInfo, target: StemInfo): TenGod {
  const samePolarity = day.yang === target.yang;

  if (target.element === day.element) return samePolarity ? '비견' : '겁재';
  if (GENERATES[day.element] === target.element) return samePolarity ? '식신' : '상관';
  if (CONTROLS[day.element] === target.element) return samePolarity ? '편재' : '정재';
  if (CONTROLS[target.element] === day.element) return samePolarity ? '편관' : '정관';
  return samePolarity ? '편인' : '정인';
}

function countTenGods(saju: SajuResult): { counts: TenGodCounts; dayMaster: StemInfo } | null {
  const dayMaster = getStemInfo(saju.pillars?.day?.stem ?? saju.dayMaster);
  if (!dayMaster) return null;

  const counts = createEmptyTenGodCounts();

  // 일간 자신을 제외한 나머지 7글자
  const targets: Array<StemInfo | null> = [
    getStemInfo(saju.pillars?.year?.stem),
    getBranchInfo(saju.pillars?.year?.branch),
    getStemInfo(saju.pillars?.month?.stem),
    getBranchInfo(saju.pillars?.month?.branch),
    getBranchInfo(saju.pillars?.day?.branch),
    getStemInfo(saju.pillars?.time?.stem),
    getBranchInfo(saju.pillars?.time?.branch),
  ];

  for (const target of targets) {
    if (!target) continue;
    counts[resolveTenGod(dayMaster, target)] += 1;
  }

  return { counts, dayMaster };
}

function buildAxis<L extends string>(
  letter: L,
  scoreA: number,
  scoreB: number,
  tieBroken: boolean
): AxisResult<L> {
  return { letter, scoreA: round1(scoreA), scoreB: round1(scoreB), tieBroken };
}

export function isValidMbti(value: unknown): value is MbtiType {
  return typeof value === 'string' && MBTI_PATTERN.test(value);
}

function normalizeMbti(value: unknown): MbtiType | null {
  if (typeof value !== 'string') return null;
  const upper = value.trim().toUpperCase();
  return isValidMbti(upper) ? upper : null;
}

/**
 * 사주 8글자 기반 선천 MBTI 상세 분석. 일간 누락 등 비정상 입력이면 null.
 *
 * - E/I: 목+화 ≥ 50% → E, 금+수 ≥ 50% → I. 둘 다 아니거나 동률이면 큰 쪽, 그래도 같으면 일간이 목·화일 때 E.
 * - S/N: 토 ≥ 25% → S, 아니면 목+수 ≥ 25% → N. 둘 다 아니면 토 vs 목+수 비교(동률 S).
 * - T/F: 금 vs 화 비교. 동률이면 일간이 금·수일 때 T, 아니면 F.
 * - J/P: 정관·정인·정재 개수 vs 편관·편인·편재·식신·상관 개수 (일간 제외 7글자). 동률 J.
 */
export function analyzeSajuMbti(saju: SajuResult | null | undefined): SajuMbtiAnalysis | null {
  if (!saju) return null;

  const tenGodInfo = countTenGods(saju);
  if (!tenGodInfo) return null;

  const { counts, dayMaster } = tenGodInfo;
  const ratio = saju.elementsRatio;
  const wood = ratio?.Wood ?? 0;
  const fire = ratio?.Fire ?? 0;
  const earth = ratio?.Earth ?? 0;
  const metal = ratio?.Metal ?? 0;
  const water = ratio?.Water ?? 0;
  const dmElement = dayMaster.element;

  // 1. E / I
  const expressive = wood + fire;
  const reserved = metal + water;
  let eiLetter: EiLetter;
  let eiTie = false;
  if (expressive >= E_I_THRESHOLD && expressive > reserved) {
    eiLetter = 'E';
  } else if (reserved >= E_I_THRESHOLD && reserved > expressive) {
    eiLetter = 'I';
  } else if (expressive !== reserved) {
    eiLetter = expressive > reserved ? 'E' : 'I';
  } else {
    eiLetter = dmElement === 'Wood' || dmElement === 'Fire' ? 'E' : 'I';
    eiTie = true;
  }
  const ei = buildAxis(eiLetter, expressive, reserved, eiTie);

  // 2. S / N
  const intuitive = wood + water;
  let snLetter: SnLetter;
  let snTie = false;
  if (earth >= EARTH_S_THRESHOLD) {
    snLetter = 'S';
  } else if (intuitive >= WOOD_WATER_N_THRESHOLD) {
    snLetter = 'N';
  } else {
    snLetter = earth >= intuitive ? 'S' : 'N';
    snTie = earth === intuitive;
  }
  const sn = buildAxis(snLetter, earth, intuitive, snTie);

  // 3. T / F
  const tfTie = metal === fire;
  const tfLetter: TfLetter = tfTie
    ? dmElement === 'Metal' || dmElement === 'Water'
      ? 'T'
      : 'F'
    : metal > fire
      ? 'T'
      : 'F';
  const tf = buildAxis(tfLetter, metal, fire, tfTie);

  // 4. J / P
  const regular = counts.정관 + counts.정인 + counts.정재;
  const irregular = counts.편관 + counts.편인 + counts.편재 + counts.식신 + counts.상관;
  const jp = buildAxis<JpLetter>(regular >= irregular ? 'J' : 'P', regular, irregular, regular === irregular);

  return {
    mbti: `${ei.letter}${sn.letter}${tf.letter}${jp.letter}`,
    axes: { EI: ei, SN: sn, TF: tf, JP: jp },
    tenGods: counts,
  };
}

function describe(analysis: SajuMbtiAnalysis): string {
  const { EI, SN, TF, JP } = analysis.axes;
  const traits = [EI.letter, SN.letter, TF.letter, JP.letter]
    .map((letter) => LETTER_TRAITS[letter] ?? letter)
    .join(' / ');

  const basis =
    `목화 ${EI.scoreA}% vs 금수 ${EI.scoreB}%, 토 ${SN.scoreA}%, ` +
    `금 ${TF.scoreA}% vs 화 ${TF.scoreB}%, 정성 ${JP.scoreA} vs 편성·식상 ${JP.scoreB}`;

  return `선천 원형 ${analysis.mbti}: ${traits}. (근거: ${basis})`;
}

/**
 * 사주 → 선천 MBTI 요약. 입력이 비정상이어도 예외 없이 mbti가 빈 문자열인 결과를 반환한다.
 */
export function calculateSajuMbti(saju: SajuResult): SajuMbtiSummary {
  const analysis = analyzeSajuMbti(saju);
  if (!analysis) {
    return { mbti: '', description: '사주 정보가 올바르지 않아 선천 MBTI를 판정할 수 없습니다.' };
  }
  return { mbti: analysis.mbti, description: describe(analysis) };
}

/** 일치율(0~100)에 따른 에너지 누수율(0~100). 일치율이 낮을수록 사회적 가면 유지 비용이 커진다. */
export function calculateLeakageRate(syncRate: number): number {
  if (!Number.isFinite(syncRate)) return 100;
  return Math.round(clamp(100 - syncRate, 0, 100));
}

/**
 * 4글자 축별 비교(축당 25점)로 일치율과 에너지 누수율을 산출한다.
 * 형식이 잘못된 MBTI(미입력 포함)는 비교 불가이므로 DB 기본값과 같은 중립값(일치 100 / 누수 0)을 반환한다.
 * 호출 전에 isValidMbti로 먼저 검증하는 것을 권장한다.
 */
export function calculateMbtiSync(sajuMbti: string, actualMbti: string): MbtiSyncResult {
  const saju = normalizeMbti(sajuMbti);
  const actual = normalizeMbti(actualMbti);
  if (!saju || !actual) {
    return { syncRate: 100, energyLeakage: 0 };
  }

  let matched = 0;
  for (let i = 0; i < 4; i += 1) {
    if (saju[i] === actual[i]) matched += 1;
  }

  const syncRate = (matched / 4) * 100;
  return { syncRate, energyLeakage: calculateLeakageRate(syncRate) };
}
