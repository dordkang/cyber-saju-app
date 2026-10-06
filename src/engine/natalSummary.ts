import type { FiveElement, SajuResult } from './types';

export interface NatalPillarView {
  key: 'year' | 'month' | 'day' | 'time';
  label: string;
  stem: string;
  branch: string;
  stemElement: FiveElement;
  branchElement: FiveElement;
  isDayMaster: boolean;
}

export interface NatalRatioView {
  element: FiveElement;
  label: string;
  /** 8글자 중 이 오행이 차지하는 개수 */
  count: number;
  percent: number;
}

export interface NatalSummary {
  pillars: NatalPillarView[];
  ratio: NatalRatioView[];
  dayMaster: string;
}

export const ELEMENT_KO: Record<FiveElement, string> = {
  Wood: '목',
  Fire: '화',
  Earth: '토',
  Metal: '금',
  Water: '수',
};

const ELEMENT_ORDER: readonly FiveElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

const PILLAR_LABEL: Record<NatalPillarView['key'], string> = {
  year: '년주',
  month: '월주',
  day: '일주',
  time: '시주',
};

const PILLAR_ORDER: readonly NatalPillarView['key'][] = ['year', 'month', 'day', 'time'];

/**
 * 계산된 사주를 화면에 그대로 그릴 수 있는 형태로 바꾼다. 하드코딩된 값 없이 엔진 결과만 사용한다.
 * 일간(본원)은 년주가 아니라 일주(3번째 기둥)의 천간이다.
 */
export function buildNatalSummary(saju: SajuResult): NatalSummary {
  const pillars: NatalPillarView[] = PILLAR_ORDER.map((key) => {
    const pillar = saju.pillars[key];
    return {
      key,
      label: PILLAR_LABEL[key],
      stem: pillar.stem,
      branch: pillar.branch,
      stemElement: pillar.elements[0],
      branchElement: pillar.elements[1],
      isDayMaster: key === 'day',
    };
  });

  const counts: Record<FiveElement, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  pillars.forEach((p) => {
    counts[p.stemElement] += 1;
    counts[p.branchElement] += 1;
  });

  const ratio: NatalRatioView[] = ELEMENT_ORDER.map((element) => ({
    element,
    label: ELEMENT_KO[element],
    count: counts[element],
    percent: saju.elementsRatio?.[element] ?? (counts[element] / 8) * 100,
  }));

  return { pillars, ratio, dayMaster: saju.pillars.day.stem };
}
