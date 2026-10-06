import rawCelebrities from '../data/celebrities.json';
import type { FiveElement, HeavenlyStem, SajuResult } from './types';

export interface Celebrity {
  id: string;
  name: string;
  title: string;
  dayMaster: HeavenlyStem;
  dominantElement: FiveElement;
  archetype: string;
  quote: string;
  birthDate?: string;
}

export type CelebrityMatchTier = 1 | 2 | 3 | 4;

export interface CelebrityMatchResult {
  matchedCelebrity: Celebrity;
  syncRate: number;
  matchReason: string;
  /** 1: 일간+오행 일치, 2: 일간 일치, 3: 오행 일치, 4: 일치 없음(폴백) */
  tier: CelebrityMatchTier;
  /** 싱크로율 상위 최대 3명 (1위 포함). 1위 결과에만 채워지며 각 항목에는 topMatches가 없다. */
  topMatches?: CelebrityMatchResult[];
}

const TOP_MATCH_COUNT = 3;

const FIVE_ELEMENTS: readonly FiveElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

const STEM_INFO: Record<HeavenlyStem, { element: FiveElement; yang: boolean; nature: string }> = {
  甲: { element: 'Wood', yang: true, nature: '거목' },
  乙: { element: 'Wood', yang: false, nature: '화초' },
  丙: { element: 'Fire', yang: true, nature: '태양' },
  丁: { element: 'Fire', yang: false, nature: '촛불' },
  戊: { element: 'Earth', yang: true, nature: '태산' },
  己: { element: 'Earth', yang: false, nature: '비옥한 대지' },
  庚: { element: 'Metal', yang: true, nature: '강철' },
  辛: { element: 'Metal', yang: false, nature: '보석' },
  壬: { element: 'Water', yang: true, nature: '큰 강' },
  癸: { element: 'Water', yang: false, nature: '봄비' },
};

const ELEMENT_HANJA: Record<FiveElement, string> = {
  Wood: '木',
  Fire: '火',
  Earth: '土',
  Metal: '金',
  Water: '水',
};

const isFiveElement = (value: unknown): value is FiveElement =>
  typeof value === 'string' && (FIVE_ELEMENTS as readonly string[]).includes(value);

const isHeavenlyStem = (value: unknown): value is HeavenlyStem =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(STEM_INFO, value);

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function sanitizeCelebrities(raw: unknown): Celebrity[] {
  if (!Array.isArray(raw)) return [];
  const result: Celebrity[] = [];
  for (const item of raw as unknown[]) {
    if (typeof item !== 'object' || item === null) continue;
    const c = item as Record<string, unknown>;
    if (
      !nonEmptyString(c.id) ||
      !nonEmptyString(c.name) ||
      !isHeavenlyStem(c.dayMaster) ||
      !isFiveElement(c.dominantElement)
    ) {
      continue;
    }
    result.push({
      id: c.id,
      name: c.name,
      title: typeof c.title === 'string' ? c.title : '',
      dayMaster: c.dayMaster,
      dominantElement: c.dominantElement,
      archetype: typeof c.archetype === 'string' ? c.archetype : '',
      quote: typeof c.quote === 'string' ? c.quote : '',
      birthDate: typeof c.birthDate === 'string' ? c.birthDate : undefined,
    });
  }
  return result;
}

const CELEBRITIES: readonly Celebrity[] = sanitizeCelebrities(rawCelebrities);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function safeRatio(saju: SajuResult, element: FiveElement): number {
  const v = saju.elementsRatio?.[element];
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0;
}

/** 최다 오행 추출. 동률이면 일간 오행을 우선하고, 그다음은 목→화→토→금→수 순. */
function getDominantElement(saju: SajuResult, dayMasterElement: FiveElement): FiveElement | null {
  let best: FiveElement | null = null;
  let bestValue = -1;
  for (const el of FIVE_ELEMENTS) {
    const value = safeRatio(saju, el);
    if (value > bestValue || (value === bestValue && el === dayMasterElement)) {
      best = el;
      bestValue = value;
    }
  }
  return bestValue > 0 ? best : null;
}

interface MatchContext {
  dayMaster: HeavenlyStem;
  dominant: FiveElement;
  dominantPercent: number;
  saju: SajuResult;
}

/** 유명인 1명에 대한 싱크로 점수·사유를 계산한다. 순수 함수이며 같은 입력엔 항상 같은 결과를 낸다. */
function scoreCelebrity(celebrity: Celebrity, ctx: MatchContext): CelebrityMatchResult {
  const { dayMaster, dominant, dominantPercent, saju } = ctx;
  const stem = STEM_INFO[dayMaster];
  const selfLabel = `${stem.nature}의 ${dayMaster}${ELEMENT_HANJA[stem.element]} 본원`;

  const sameStem = celebrity.dayMaster === dayMaster;
  const sameElement = celebrity.dominantElement === dominant;

  if (sameStem && sameElement) {
    return {
      matchedCelebrity: celebrity,
      // 최다 오행 비중이 클수록 95→99%
      syncRate: 95 + clamp(Math.round((dominantPercent - 20) / 10), 0, 4),
      matchReason: `${selfLabel}과 강력한 ${ELEMENT_HANJA[dominant]} 기운이 완벽히 일치합니다.`,
      tier: 1,
    };
  }

  if (sameStem) {
    // 유명인의 주 오행이 내 사주에 얼마나 있는지에 따라 85→92%
    const affinity = safeRatio(saju, celebrity.dominantElement);
    return {
      matchedCelebrity: celebrity,
      syncRate: 85 + clamp(Math.round(affinity / 4), 0, 7),
      matchReason: `${selfLabel}이 같아 타고난 기질의 뿌리를 공유합니다.`,
      tier: 2,
    };
  }

  if (sameElement) {
    // 일간 음양이 같으면 가산, 그 외에는 오행 비중에 따라 75→84%
    const polarityBonus = STEM_INFO[celebrity.dayMaster].yang === stem.yang ? 3 : 0;
    return {
      matchedCelebrity: celebrity,
      syncRate: 75 + clamp(polarityBonus + Math.round((dominantPercent - 20) / 10), 0, 9),
      matchReason: `사주의 중심이 되는 ${ELEMENT_HANJA[dominant]} 기운이 닮아 에너지의 결이 비슷합니다.`,
      tier: 3,
    };
  }

  return {
    matchedCelebrity: celebrity,
    syncRate: 60 + clamp(Math.round(dominantPercent / 10), 0, 9),
    matchReason: `${ELEMENT_HANJA[dominant]} 기운과는 결이 다르지만 대비되는 영감의 거울입니다.`,
    tier: 4,
  };
}

/** 싱크로율 내림차순 → 본원 일치 우선 → id 오름차순. 동점이 남지 않아 결과가 항상 고정된다. */
function compareMatches(
  a: CelebrityMatchResult,
  b: CelebrityMatchResult,
  dayMaster: HeavenlyStem,
): number {
  if (a.syncRate !== b.syncRate) return b.syncRate - a.syncRate;

  const aStem = a.matchedCelebrity.dayMaster === dayMaster ? 1 : 0;
  const bStem = b.matchedCelebrity.dayMaster === dayMaster ? 1 : 0;
  if (aStem !== bStem) return bStem - aStem;

  const aId = a.matchedCelebrity.id;
  const bId = b.matchedCelebrity.id;
  if (aId < bId) return -1;
  if (aId > bId) return 1;
  return 0;
}

/**
 * 사용자 사주와 싱크로율이 가장 높은 유명인을 로컬 데이터에서 결정론적으로 1명 매칭한다.
 * 같은 사주 입력에는 언제나 같은 1위가 반환되며, 상위 3명은 `topMatches`로 함께 제공한다.
 * 입력이 유효하지 않거나 데이터가 비어 있으면 null을 반환한다 (예외를 던지지 않음).
 */
export function matchCelebrity(saju: SajuResult): CelebrityMatchResult | null {
  try {
    if (CELEBRITIES.length === 0 || !saju) return null;

    const dayMaster = saju.dayMaster ?? saju.pillars?.day?.stem;
    if (!isHeavenlyStem(dayMaster)) return null;

    const dominant = getDominantElement(saju, STEM_INFO[dayMaster].element);
    if (!dominant) return null;

    const ctx: MatchContext = {
      dayMaster,
      dominant,
      dominantPercent: safeRatio(saju, dominant),
      saju,
    };

    const ranked = CELEBRITIES.map((c) => scoreCelebrity(c, ctx)).sort((a, b) =>
      compareMatches(a, b, dayMaster),
    );

    const best = ranked[0];
    if (!best) return null;

    return { ...best, topMatches: ranked.slice(0, TOP_MATCH_COUNT) };
  } catch {
    return null;
  }
}
