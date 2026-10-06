export type FiveElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type HeavenlyStem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type EarthlyBranch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

export interface PillarData {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  elements: [FiveElement, FiveElement]; // [천간 오행, 지지 오행]
}

export interface SajuResult {
  dayMaster: HeavenlyStem; // 본원 (일간)
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    time: PillarData;
  };
  elementsRatio: Record<FiveElement, number>; // 오행 백분율 합계 100%
}