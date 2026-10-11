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

/** 화면에 노출하는 오행 기운 이름. 영문 키 대신 이 값을 쓴다. (KR) */
export const ELEMENT_TITLE_KR: Record<FiveElement, string> = {
  Wood: '청목(靑木)의 기운',
  Fire: '적화(赤火)의 기운',
  Earth: '황토(黃土)의 기운',
  Metal: '백금(白金)의 기운',
  Water: '흑수(黑水)의 기운',
};

/** 화면에 노출하는 오행 기운 이름. (JP) */
export const ELEMENT_TITLE_JA: Record<FiveElement, string> = {
  Wood: '青木(樹木)の気',
  Fire: '紅火(太陽・情熱)の気',
  Earth: '黄土(大地・信用)の気',
  Metal: '白金(決断・鉱石)の気',
  Water: '玄水(知恵・深海)の気',
};

export function getElementTitle(element: FiveElement, isJa: boolean = false): string {
  return isJa ? ELEMENT_TITLE_JA[element] : ELEMENT_TITLE_KR[element];
}

export const STEM_READING: Record<HeavenlyStem, string> = {
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

export const BRANCH_READING: Record<EarthlyBranch, string> = {
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

export const STEM_JA: Record<HeavenlyStem, string> = {
  甲: 'こう',
  乙: 'おつ',
  丙: 'へい',
  丁: 'てい',
  戊: 'ぼ',
  己: 'き',
  庚: 'こう',
  辛: 'しん',
  壬: 'じん',
  癸: 'き',
};

export const BRANCH_JA: Record<EarthlyBranch, string> = {
  子: 'し',
  丑: 'ちゅう',
  寅: 'いん',
  卯: 'ぼう',
  辰: 'しん',
  巳: 'し',
  午: 'ご',
  未: 'び',
  申: 'しん',
  酉: 'ゆう',
  戌: 'じゅつ',
  亥: 'がい',
};

export const GANJI_READING_JA: Record<string, string> = {
  甲子: 'かっし', 乙丑: 'いっちゅう', 丙寅: 'へいいん', 丁卯: 'ていぼう', 戊辰: 'ぼしん',
  己巳: 'きし', 庚午: 'こうご', 辛未: 'しんび', 壬申: 'じんしん', 癸酉: 'きゆう',
  甲戌: 'こうじゅつ', 乙亥: 'おつがい', 丙子: 'へいし', 丁丑: 'ていちゅう', 戊寅: 'ぼいん',
  己卯: 'きぼう', 庚辰: 'こうしん', 辛巳: 'しんし', 壬午: 'じんご', 癸未: 'きび',
  甲申: 'こうしん', 乙酉: 'おつゆう', 丙戌: 'へいじゅつ', 丁亥: 'ていがい', 戊子: 'ぼし',
  己丑: 'きちゅう', 庚寅: 'こういん', 辛卯: 'しんぼう', 壬辰: 'じんしん', 癸巳: 'きし',
  甲午: 'こうご', 乙未: 'おつび', 丙申: 'へいしん', 丁酉: 'ていゆう', 戊戌: 'ぼじゅつ',
  己亥: 'きがい', 庚子: 'こうし', 辛丑: 'しんちゅう', 壬寅: 'じんいん', 癸卯: 'きぼう',
  甲辰: 'こうしん', 乙巳: 'おつし', 丙午: 'へいご', 丁未: 'ていび', 戊申: 'ぼしん',
  己酉: 'きゆう', 庚戌: 'こうじゅつ', 辛亥: 'しんがい', 壬子: 'じんし', 癸丑: 'きちゅう',
  甲寅: 'こういん', 乙卯: 'おつぼう', 丙辰: 'へいしん', 丁巳: 'ていし', 戊午: 'ぼご',
  己未: 'きび', 庚申: 'こうしん', 辛酉: 'しんゆう', 壬戌: 'じんじゅつ', 癸亥: 'きがい',
};

export function getGanjiReadingJa(stem: HeavenlyStem, branch: EarthlyBranch): string {
  return GANJI_READING_JA[`${stem}${branch}`] ?? `${STEM_JA[stem] ?? ''}${BRANCH_JA[branch] ?? ''}`;
}

/** 간지 한자와 독음을 함께 보여 준다. 예: 丙子(병자) 또는 丙子(へいし) */
export function formatGanji(stem: HeavenlyStem, branch: EarthlyBranch, isJa: boolean = false): string {
  if (isJa) {
    return `${stem}${branch}(${getGanjiReadingJa(stem, branch)})`;
  }
  return `${stem}${branch}(${STEM_READING[stem] ?? ''}${BRANCH_READING[branch] ?? ''})`;
}

const ELEMENT_ORDER: readonly FiveElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

/** 오행별 행운의 물건 (부족한 오행을 채우는 용도) KR */
export const LUCKY_ITEM_BY_ELEMENT: Record<FiveElement, string> = {
  Wood: '쑥빛 니트',
  Fire: '붉은 포인트 목도리',
  Earth: '낙타색 트렌치코트',
  Metal: '은빛 체인 목걸이',
  Water: '감청색 데님 재킷',
};

/** 오행별 행운의 물건 JP */
export const LUCKY_ITEM_BY_ELEMENT_JA: Record<FiveElement, string> = {
  Wood: 'よもぎ色のニット',
  Fire: '赤いポイントマフラー',
  Earth: 'キャメル色のトレンチコート',
  Metal: 'シルバーチェーンのネックレス',
  Water: 'ダークネイビーのデニムジャケット',
};

export const ITEM_TRANSLATION_MAP: Record<string, string> = {
  '은빛 체인 목걸이': 'シルバーチェーンのネックレス',
  '은빛 체인': 'シルバーチェーン',
  '은빛 메탈 체인': 'シルバーメタルチェーン',
  '묵직한 금속 볼펜': '重厚な金属製ボールペン',
  '원목 소품': 'ウッド調の小物',
  '붉은색 원석': '紅色の天然石 (ルビー・ガーネット)',
  '가죽 소품': '上質なレザー小物',
  '청색 셔츠': '爽やかなブルーシャツ',
  '쑥빛 니트': 'よもぎ色のニット',
  '붉은 포인트 목도리': '赤いポイントマフラー',
  '낙타색 트렌치코트': 'キャメル色のトレンチコート',
  '감청색 데님 재킷': 'ダークネイビーのデニムジャケット',
  '도자기 머그잔': '陶器のマグカップ',
  '검은색 텀블러': '黒のタンブラー',
  '유리 공예품': 'ガラス工芸品',
  '흰색 셔츠': '白いシャツ',
  '금속 시계': 'メタルウォッチ',
};

export function localizeLuckyItem(item: string | undefined | null, isJa: boolean): string {
  if (!item) return '';
  if (!isJa) return item;
  if (ITEM_TRANSLATION_MAP[item]) return ITEM_TRANSLATION_MAP[item];
  for (const [kr, ja] of Object.entries(ITEM_TRANSLATION_MAP)) {
    if (item.includes(kr)) {
      return item.replace(kr, ja);
    }
  }
  return item;
}

export function localizeLuckyReason(
  reason: string | undefined | null,
  isJa: boolean,
  element?: FiveElement | null
): string {
  if (!reason) return '';
  if (!isJa) return reason;
  const elHanja = element ? ELEMENT_HANJA[element] : '';
  if (reason.includes('부족한')) {
    return `命式に不足している${elHanja ? `${elHanja}の` : ''}気を補います`;
  }
  if (reason.includes('어울려요') || reason.includes('오늘의')) {
    return `本日の${elHanja ? `${elHanja}の` : ''}気と美しく調和します`;
  }
  return '日辰のエネルギーバランスを整える開運アイテムです';
}

export const GOD_KEYWORD: Record<TenGod, string> = {
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

export const GOD_NAME_JA: Record<TenGod, string> = {
  비견: '比肩',
  겁재: '劫財',
  식신: '食神',
  상관: '傷官',
  편재: '偏財',
  정재: '正財',
  편관: '偏官',
  정관: '正官',
  편인: '偏印',
  정인: '印綬',
};

export const GOD_KEY_TITLE_JA: Record<TenGod, string> = {
  비견: '比肩の鍵 (自立と突破)',
  겁재: '劫財の鍵 (勝負と決断)',
  식신: '食神の鍵 (表現と創造)',
  상관: '傷官の鍵 (感性と打破)',
  편재: '偏財の鍵 (機転と拡大)',
  정재: '正財の鍵 (堅実と蓄積)',
  편관: '偏官の鍵 (試練と飛躍)',
  정관: '正官の鍵 (秩序と信用)',
  편인: '偏印の鍵 (直感と霊感)',
  정인: '印綬の鍵 (学問と加護)',
};

export function getGodKeyTitle(god: TenGod | null, isJa: boolean): string {
  if (isJa) {
    return god ? (GOD_KEY_TITLE_JA[god] ?? `${god}の鍵`) : '今日の鍵';
  }
  return god ? `${god}의 열쇠` : '오늘의 열쇠';
}

export function getGodName(god: TenGod | null, isJa: boolean): string {
  if (!god) return isJa ? '天機' : '천기';
  return isJa ? (GOD_NAME_JA[god] ?? god) : god;
}

export const GOD_LINE: Record<TenGod, string> = {
  비견: '딴 놈들 눈치 보지 마라! 오직 네 심지 하나 믿고 버티면 천하가 네 편이다.',
  겁재: '도둑놈들이 네 밥그릇을 노린다! 한 치도 뺏기지 말고 악착같이 움켜쥐어라.',
  식신: '가슴에 맺힌 걸 다 쏟아내라! 네 입과 손끝에서 막힌 금고 문이 열린다.',
  상관: '낡은 틀에 네 목을 매지 마라! 판을 뒤엎어야 네 세상이 오는 법이다.',
  편재: '옹졸하게 잔돈 세지 마라! 판을 크게 벌려야 천하의 큰돈이 네 품에 안긴다.',
  정재: '피땀 흘려 지켜낸 결실이다. 한 푼도 허투루 새지 않게 자물쇠를 단단히 채워라.',
  편관: '벼락이 치고 칼바람이 불어도 고개 숙이지 마라! 정면으로 베어 넘기면 승리뿐이다.',
  정관: '세상 법도가 네 무기다! 떳떳하게 명분을 쥐고 상대를 굴복시켜라.',
  편인: '네 안의 날카로운 칼날을 숨겨라! 남들이 못 보는 틈새를 찔러야 이긴다.',
  정인: '하늘이 너를 보호하고 있다! 귀인의 손을 잡고 당당히 큰길로 나가라.',
};

export const GOD_LINE_JA: Record<TenGod, string> = {
  비견: '今日は人の輪に揉まれ、愛想笑いの裏で心が擦り切れたはずだ。だが怯むな、主導権を握る刻（とき）が来た。',
  겁재: 'ライバルがお前の取り分を虎視眈々と狙っている。一歩も退くな、泥臭くとも己の領域を死守せよ。',
  식신: '胸に秘めた想いをすべて解き放て。お前の言葉と指先から、閉ざされた扉が音を立てて開く。',
  상관: '古びた常識に縛られるな。盤上をひっくり返してこそ、お前が支配する新たな時代が始まる。',
  편재: '目先の小銭に執着するな。盤面を大胆に広げてこそ、天より巨万の富が懐に転がり込む。',
  정재: '血と汗で守り抜いた大切な果実だ。一滴も漏らさぬよう、財布の鍵を固く締め直せ。',
  편관: '雷鳴が轟き嵐が吹き荒れようと屈するな。真正面から一刀両断すれば、そこに勝利しかない。',
  정관: '揺るぎなき大義こそがお前の武器だ。堂々と信義を掲げ、秩序を以て相手を制圧せよ。',
  편인: '内に秘めた鋭い牙を隠せ。凡人には見えぬ死角を冷徹に突いてこそ、完全勝利を掴める。',
  정인: '天の加護がお前を包んでいる。導きの手を差し伸べる貴人と共に、堂々と大通りを進め。',
};

export const FALLBACK_KEYWORD = '천기(天氣) 신명';
export const FALLBACK_KEYWORD_JA = '天機(神託)の導き';
export const FALLBACK_LINE = '웅크린 자여, 네 안의 불길을 의심치 마라! 오늘 하늘이 네 칼날을 벼리고 있다.';
export const FALLBACK_LINE_JA = '息を潜めし者よ、胸中の炎を疑うな。今日、天がお前の刃を研ぎ澄ませている。';
export const MAX_FORTUNE_CHARS = 120;

export interface ReelsContent {
  /** 오늘 일진 천간의 오행 기운 이름. 예: 백금(白金)의 기운 / 白金(決断・鉱石)の気 */
  elementName: string;
  /** 오늘 일진 천간의 오행. 릴스 테마 색상에 사용 */
  element: FiveElement;
  /** 오늘의 일진 간지. 예: 丙子(병자) 또는 丙子(へいし). 계산에 실패하면 빈 문자열 */
  dayPillarText: string;
  /** 일간 대비 오늘 일진의 십신 키워드. 예: 자존·독립 */
  keyword: string;
  /** AI 점사가 있으면 그 요약, 없으면 십신별 일일 운세 한 줄 */
  fortuneText: string;
  /** 사주에서 가장 부족한 오행을 채워 주는 패션 아이템 */
  luckyItem: string;
  luckyReason: string;
  /** 촬영창 보조 라벨. 예: #2 호스트 · 戊土 일간 / #2 ホスト · 戊土 日干 */
  profileLabel: string;
}

export interface ReelsContentOptions {
  /** 오늘 저장된 AI 점사 전문. `[페르소나] ` 접두어는 제거된다. */
  aiText?: string | null;
  profileId?: number | null;
  profileName?: string | null;
  isJa?: boolean;
}

function summarizeAiText(text: string | null | undefined): string {
  if (!text) return '';
  const plain = text
    .replace(/^\s*\[[^\]]{1,20}\]\s*/, '')
    .replace(/\([^)]*\)/g, '')
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
  const isJa = Boolean(options.isJa);
  const rawIdText =
    options.profileId != null || options.profileName
      ? `${options.profileId != null ? `#${options.profileId} ` : ''}${options.profileName ?? ''}`.trim()
      : '';
  const idText = isJa
    ? rawIdText.replace(/호스트/g, 'ホスト')
    : rawIdText;

  let todayElement: FiveElement = 'Wood';
  let dayPillarText = '';
  let god: TenGod | null = null;

  try {
    const today = calculateSaju(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, true).pillars.day;
    todayElement = today.elements[0];
    dayPillarText = formatGanji(today.stem, today.branch, isJa);
    if (saju) god = getTenGod(saju.dayMaster, today.stem);
  } catch {
    // 일진 계산에 실패하면 기본 문구로 폴백한다.
  }

  const lackingFromSaju = lackingElement(saju?.elementsRatio);
  const lacking = lackingFromSaju ?? todayElement;
  const dayMasterElement = saju?.pillars?.day?.elements?.[0];
  const dayMasterSuffix = isJa ? '日干' : '일간';
  const dayMasterText = saju
    ? `${saju.dayMaster}${dayMasterElement ? ELEMENT_HANJA[dayMasterElement] : ''} ${dayMasterSuffix}`
    : '';
  const profileLabel = [idText, dayMasterText].filter(Boolean).join(' · ');

  const luckyItem = isJa
    ? (LUCKY_ITEM_BY_ELEMENT_JA[lacking] ?? LUCKY_ITEM_BY_ELEMENT[lacking])
    : LUCKY_ITEM_BY_ELEMENT[lacking];

  const luckyReason = isJa
    ? (lackingFromSaju
        ? `命式に不足している${ELEMENT_HANJA[lacking]}の気を補います`
        : `本日の${ELEMENT_HANJA[lacking]}の気と調和します`)
    : (lackingFromSaju
        ? `내 사주에 부족한 ${ELEMENT_SHORT_KR[lacking]} 기운을 채워 줘요`
        : `오늘의 ${ELEMENT_SHORT_KR[lacking]} 기운과 잘 어울려요`);

  const fallbackFortune = isJa
    ? (god ? GOD_LINE_JA[god] : FALLBACK_LINE_JA)
    : (god ? GOD_LINE[god] : FALLBACK_LINE);

  return {
    elementName: getElementTitle(todayElement, isJa),
    element: todayElement,
    dayPillarText,
    keyword: god ? (isJa ? GOD_NAME_JA[god] : GOD_KEYWORD[god]) : (isJa ? FALLBACK_KEYWORD_JA : FALLBACK_KEYWORD),
    fortuneText: isJa ? fallbackFortune : (summarizeAiText(options.aiText) || fallbackFortune),
    luckyItem,
    luckyReason,
    profileLabel,
  };
}
