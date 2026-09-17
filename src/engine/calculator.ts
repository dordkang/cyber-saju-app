import { Solar, Lunar } from 'lunar-javascript';
import { FiveElement, HeavenlyStem, EarthlyBranch, PillarData, SajuResult } from './types';

// 천간 오행 매핑
const STEM_ELEMENTS: Record<HeavenlyStem, FiveElement> = {
  '甲': 'Wood', '乙': 'Wood',
  '丙': 'Fire', '丁': 'Fire',
  '戊': 'Earth', '己': 'Earth',
  '庚': 'Metal', '辛': 'Metal',
  '壬': 'Water', '癸': 'Water'
};

// 지지 오행 매핑
const BRANCH_ELEMENTS: Record<EarthlyBranch, FiveElement> = {
  '寅': 'Wood', '卯': 'Wood',
  '巳': 'Fire', '午': 'Fire',
  '辰': 'Earth', '戌': 'Earth', '丑': 'Earth', '未': 'Earth',
  '申': 'Metal', '酉': 'Metal',
  '亥': 'Water', '子': 'Water'
};

function createPillar(stem: string, branch: string): PillarData {
  const hStem = stem as HeavenlyStem;
  const eBranch = branch as EarthlyBranch;
  return {
    stem: hStem,
    branch: eBranch,
    elements: [STEM_ELEMENTS[hStem], BRANCH_ELEMENTS[eBranch]]
  };
}

export function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  isSolar: boolean = true
): SajuResult {
  const solarInstance = isSolar
    ? Solar.fromYmdHms(year, month, day, hour, minute, 0)
    : Lunar.fromYmdHms(year, month, day, hour, minute, 0).getSolar();

  const lunar = solarInstance.getLunar();
  const eightChar = lunar.getEightChar();

  // 1. 24절기 반영 사주 8자 산출
  const yearPillar = createPillar(eightChar.getYearGan(), eightChar.getYearZhi());
  const monthPillar = createPillar(eightChar.getMonthGan(), eightChar.getMonthZhi());
  const dayPillar = createPillar(eightChar.getDayGan(), eightChar.getDayZhi());
  const timePillar = createPillar(eightChar.getTimeGan(), eightChar.getTimeZhi());

  // 2. 8글자 오행 집계
  const allElements: FiveElement[] = [
    ...yearPillar.elements,
    ...monthPillar.elements,
    ...dayPillar.elements,
    ...timePillar.elements
  ];

  const counts: Record<FiveElement, number> = {
    Wood: 0,
    Fire: 0,
    Earth: 0,
    Metal: 0,
    Water: 0
  };

  allElements.forEach((el) => {
    counts[el] += 1;
  });

  // 3. 오행 백분율 산출 (글자당 12.5%, 총합 100%)
  const elementsRatio: Record<FiveElement, number> = {
    Wood: (counts.Wood / 8) * 100,
    Fire: (counts.Fire / 8) * 100,
    Earth: (counts.Earth / 8) * 100,
    Metal: (counts.Metal / 8) * 100,
    Water: (counts.Water / 8) * 100
  };

  return {
    dayMaster: dayPillar.stem,
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      time: timePillar
    },
    elementsRatio
  };
}