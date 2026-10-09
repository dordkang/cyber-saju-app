import { calculateSaju } from './calculator';
import { getTenGod } from './timelineEngine';
import type { TenGod } from './timelineEngine';
import type { EarthlyBranch, FiveElement, HeavenlyStem, SajuResult } from './types';

export const ELEMENT_HANJA: Record<FiveElement, string> = {
  Wood: '木',
  Fire: '火',
  Earth: '土',
  Metal: '金',
  Water: '水',
};

/** 오행의 짧은 한글 표기. 예: 목(木) */
export const ELEMENT_SHORT_KR: Record<FiveElement, string> = {
  Wood: '목(木)',
  Fire: '화(火)',
  Earth: '토(土)',
  Metal: '금(金)',
  Water: '수(水)',
};

/** 화면에 노출하는 오행 기운 이름. 영문 키 대신 이 값을 쓴다. */
export const ELEMENT_TITLE_KR: Record<FiveElement, string> = {
  Wood: '청목(靑木)의 기운',
  Fire: '적화(赤火)의 기운',
  Earth: '황토(黃土)의 기운',
  Metal: '백금(白金)의 기운',
  Water: '흑수(黑水)의 기운',
};

const STEM_READING: Record<HeavenlyStem, string> = {
  甲: '갑',
  乙: '을',
  丙: '병',
  丁: '정',
  戊: '무',
  己: '기',
  庚: '경',
  辛: '신',
  壬: '임',
  癸: '계',
};

const BRANCH_READING: Record<EarthlyBranch, string> = {
  子: '자',
  丑: '축',
  寅: '인',
  卯: '묘',
  辰: '진',
  巳: '사',
  午: '오',
  未: '미',
  申: '신',
  酉: '유',
  戌: '술',
  亥: '해',
};

/** 간지 한자와 한글 독음을 함께 보여 준다. 예: 丙子(병자) */
export function formatGanji(stem: HeavenlyStem, branch: EarthlyBranch): string {
  return `${stem}${branch}(${STEM_READING[stem] ?? ''}${BRANCH_READING[branch] ?? ''})`;
}

const ELEMENT_ORDER: readonly FiveElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

/** 오행별 행운의 물건 (부족한 오행을 채우는 용도) */
export const LUCKY_ITEM_BY_ELEMENT: Record<FiveElement, string> = {
  Wood: '쑥빛 니트',
  Fire: '붉은 포인트 목도리',
  Earth: '낙타색 트렌치코트',
  Metal: '은빛 체인 목걸이',
  Water: '감청색 데님 재킷',
};

const GOD_KEYWORD: Record<TenGod, string> = {
  비견: '자존·독립',
  겁재: '경쟁·승부',
  식신: '표현·여유',
  상관: '재치·돌파',
  편재: '기회·활동',
  정재: '안정·결실',
  편관: '압박·도전',
  정관: '질서·신뢰',
  편인: '직감·영감',
  정인: '배움·보호',
};

const GOD_LINE: Record<TenGod, string> = {
  비견: '(방울을 짤랑 흔들며 껄껄 웃음을 터뜨린다) 딴 놈들 눈치 보지 마라! 오직 네 심지 하나 믿고 버티면 천하가 네 편이다.',
  겁재: '(서슬 퍼런 눈으로 쏘아보며) 도둑놈들이 네 밥그릇을 노린다! 한 치도 뺏기지 말고 악착같이 움켜쥐어라.',
  식신: '(부채를 쫙 펼치며 호탕하게) 가슴에 맺힌 걸 다 쏟아내라! 네 입과 손끝에서 막힌 금고 문이 열린다.',
  상관: '(호롱불을 흔들며) 낡은 틀에 네 목을 매지 마라! 판을 뒤엎어야 네 세상이 오는 법이다.',
  편재: '(서랍을 쾅 닫으며) 옹졸하게 잔돈 세지 마라! 판을 크게 벌려야 천하의 큰돈이 네 품에 안긴다.',
  정재: '(상대의 손등을 꽉 쥐며) 피땀 흘려 지켜낸 결실이다. 한 푼도 허투루 새지 않게 자물쇠를 단단히 채워라.',
  편관: '(칼을 쥐어주듯 노려보며) 벼락이 치고 칼바람이 불어도 고개 숙이지 마라! 정면으로 베어 넘기면 승리뿐이다.',
  정관: '(엄하게 훈계하듯) 세상 법도가 네 무기다! 떳떳하게 명분을 쥐고 상대를 굴복시켜라.',
  편인: '(눈을 번뜩이며 귀에 대고 속삭이듯) 네 안의 날카로운 칼날을 숨겨라! 남들이 못 보는 틈새를 찔러야 이긴다.',
  정인: '(어깨를 묵직하게 다독이며) 하늘이 너를 보호하고 있다! 귀인의 손을 잡고 당당히 큰길로 나가라.',
};

const FALLBACK_KEYWORD = '천기(天氣) 신명';
const FALLBACK_LINE = '(부채를 촥 펴서 번뜩이는 눈빛을 쏘며) 웅크린 자여, 네 안의 불길을 의심치 마라! 오늘 하늘이 네 칼날을 벼리고 있다.';
const MAX_FORTUNE_CHARS = 120;

export interface ReelsContent {
  /** 오늘 일진 천간의 오행 기운 이름. 예: 백금(白金)의 기운 */
  elementName: string;
  /** 오늘 일진 천간의 오행. 릴스 테마 색상에 사용 */
  element: FiveElement;
  /** 오늘의 일진 간지. 예: 丙子(병자). 계산에 실패하면 빈 문자열 */
  dayPillarText: string;
  /** 일간 대비 오늘 일진의 십신 키워드. 예: 자존·독립 */
  keyword: string;
  /** AI 점사가 있으면 그 요약, 없으면 십신별 일일 운세 한 줄 */
  fortuneText: string;
  /** 사주에서 가장 부족한 오행을 채워 주는 패션 아이템 */
  luckyItem: string;
  luckyReason: string;
  /** 촬영창 보조 라벨. 예: #2 호스트 · 戊土 일간 */
  profileLabel: string;
}

export interface ReelsContentOptions {
  /** 오늘 저장된 AI 점사 전문. `[페르소나] ` 접두어는 제거된다. */
  aiText?: string | null;
  profileId?: number | null;
  profileName?: string | null;
}

function summarizeAiText(text: string | null | undefined): string {
  if (!text) return '';
  const plain = text
    .replace(/^\s*\[[^\]]{1,20}\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return '';
  return plain.length > MAX_FORTUNE_CHARS ? `${plain.slice(0, MAX_FORTUNE_CHARS - 1).trimEnd()}…` : plain;
}

export function lackingElement(ratio: Partial<Record<FiveElement, number>> | undefined): FiveElement | null {
  if (!ratio) return null;
  let lowest: FiveElement | null = null;
  let lowestValue = Number.POSITIVE_INFINITY;
  for (const element of ELEMENT_ORDER) {
    const value = ratio[element];
    if (typeof value === 'number' && Number.isFinite(value) && value < lowestValue) {
      lowest = element;
      lowestValue = value;
    }
  }
  return lowest;
}

/**
 * 저장된 사주와 오늘 일진으로 릴스 화면 문구를 만든다. 로컬 룰 연산만 쓰며 실패해도 기본 문구를 돌려준다.
 */
export function buildReelsContent(
  saju: SajuResult | null,
  date: Date = new Date(),
  options: ReelsContentOptions = {}
): ReelsContent {
  const idText =
    options.profileId != null || options.profileName
      ? `${options.profileId != null ? `#${options.profileId} ` : ''}${options.profileName ?? ''}`.trim()
      : '';
  let todayElement: FiveElement = 'Wood';
  let dayPillarText = '';
  let god: TenGod | null = null;

  try {
    const today = calculateSaju(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, true).pillars.day;
    todayElement = today.elements[0];
    dayPillarText = formatGanji(today.stem, today.branch);
    if (saju) god = getTenGod(saju.dayMaster, today.stem);
  } catch {
    // 일진 계산에 실패하면 기본 문구로 폴백한다.
  }

  const lackingFromSaju = lackingElement(saju?.elementsRatio);
  const lacking = lackingFromSaju ?? todayElement;
  const dayMasterElement = saju?.pillars?.day?.elements?.[0];
  const dayMasterText = saju
    ? `${saju.dayMaster}${dayMasterElement ? ELEMENT_HANJA[dayMasterElement] : ''} 일간`
    : '';
  const profileLabel = [idText, dayMasterText].filter(Boolean).join(' · ');

  return {
    elementName: ELEMENT_TITLE_KR[todayElement],
    element: todayElement,
    dayPillarText,
    keyword: god ? GOD_KEYWORD[god] : FALLBACK_KEYWORD,
    fortuneText: summarizeAiText(options.aiText) || (god ? GOD_LINE[god] : FALLBACK_LINE),
    luckyItem: LUCKY_ITEM_BY_ELEMENT[lacking],
    luckyReason: lackingFromSaju
      ? `내 사주에 부족한 ${ELEMENT_SHORT_KR[lacking]} 기운을 채워 줘요`
      : `오늘의 ${ELEMENT_SHORT_KR[lacking]} 기운과 잘 어울려요`,
    profileLabel,
  };
}
