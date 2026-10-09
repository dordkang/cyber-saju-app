import { calculateSaju } from './calculator';
import { getTenGod } from './timelineEngine';
import type { EarthlyBranch, FiveElement, HeavenlyStem, SajuResult } from './types';

export type CoreCategory = 'wealth' | 'love' | 'career' | 'health' | 'business';

export interface TomorrowOmen {
  dateLabel: string;
  targetDate: Date;
  ganji: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  element: FiveElement;
  elementTitle: string;
  stemGod: string;
  branchGod: string;
  shinsal: {
    primary: string;
    list: string[];
    description: string;
  };
}

const ELEMENT_TITLE_MAP: Record<FiveElement, string> = {
  Wood: '청목(靑木)의 기운',
  Fire: '적화(赤火)의 기운',
  Earth: '황토(黃土)의 기운',
  Metal: '백금(白金)의 기운',
  Water: '흑수(黑水)의 기운',
};

const BRANCH_SHINSAL_MAP: Record<string, { dohwa: EarthlyBranch; yeokma: EarthlyBranch; hwagae: EarthlyBranch }> = {
  寅午戌: { dohwa: '卯', yeokma: '申', hwagae: '戌' },
  申子辰: { dohwa: '酉', yeokma: '寅', hwagae: '辰' },
  巳酉丑: { dohwa: '午', yeokma: '亥', hwagae: '丑' },
  亥卯未: { dohwa: '子', yeokma: '巳', hwagae: '未' },
};

const BAEKHO_LIST = new Set(['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑']);
const YANGIN_STEM_BRANCH: Record<string, EarthlyBranch> = {
  甲: '卯',
  丙: '午',
  戊: '午',
  庚: '酉',
  壬: '子',
};

const STEM_COMBINES: Record<string, string> = {
  甲: '己', 己: '甲',
  乙: '庚', 庚: '乙',
  丙: '辛', 辛: '丙',
  丁: '壬', 壬: '丁',
  戊: '癸', 癸: '戊',
};

const BRANCH_SIX_COMBINES: Record<string, string> = {
  子: '丑', 丑: '子',
  寅: '亥', 亥: '寅',
  卯: '戌', 戌: '卯',
  辰: '酉', 酉: '辰',
  巳: '申', 申: '巳',
  午: '未', 未: '午',
};

const BRANCH_CLASHES: Record<string, string> = {
  子: '午', 午: '子',
  丑: '未', 未: '丑',
  寅: '申', 申: '寅',
  卯: '酉', 酉: '卯',
  辰: '戌', 戌: '辰',
  巳: '亥', 亥: '巳',
};

const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  子: 'Water',
  丑: 'Earth',
  寅: 'Wood',
  卯: 'Wood',
  辰: 'Earth',
  巳: 'Fire',
  午: 'Fire',
  未: 'Earth',
  申: 'Metal',
  酉: 'Metal',
  戌: 'Earth',
  亥: 'Water',
};

const BRANCH_MAIN_STEM: Record<EarthlyBranch, HeavenlyStem> = {
  子: '癸',
  丑: '己',
  寅: '甲',
  卯: '乙',
  辰: '戊',
  巳: '丙',
  午: '丁',
  未: '己',
  申: '庚',
  酉: '辛',
  戌: '戊',
  亥: '壬',
};

/** 특정 날짜 기준 일진 및 정통 신살 계산 */
export function getTomorrowOmen(saju: SajuResult | null, targetDate: Date = new Date()): TomorrowOmen {
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const weekDay = ['일', '월', '화', '수', '목', '금', '토'][targetDate.getDay()] ?? '';
  const dateLabel = `${targetDate.getFullYear()}.${mm}.${dd} (${weekDay})`;

  const calculated = calculateSaju(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    targetDate.getDate(),
    12,
    0,
    true
  );
  const dayPillar = calculated.pillars.day;
  const stem = dayPillar.stem;
  const branch = dayPillar.branch;
  const ganji = `${stem}${branch}`;
  const element = dayPillar.elements[0];
  const elementTitle = ELEMENT_TITLE_MAP[element] ?? '적화(赤火)의 기운';

  const myDayMaster = saju?.dayMaster ?? '戊';
  const stemGod = getTenGod(myDayMaster, stem);
  const branchGod = getTenGod(myDayMaster, BRANCH_MAIN_STEM[branch]);

  const shinsalList: string[] = [];
  const userDayBranch = saju?.pillars.day.branch ?? '辰';

  // 1. 양인살
  if (YANGIN_STEM_BRANCH[myDayMaster] === branch) {
    shinsalList.push('양인살(羊刃殺)');
  }

  // 2. 백호대살
  if (BAEKHO_LIST.has(ganji)) {
    shinsalList.push('백호살(白虎殺)');
  }

  // 3. 삼합 도화/역마/화개
  for (const [group, val] of Object.entries(BRANCH_SHINSAL_MAP)) {
    if (group.includes(userDayBranch)) {
      if (branch === val.dohwa) shinsalList.push('도화살(桃花殺)');
      if (branch === val.yeokma) shinsalList.push('역마살(驛馬殺)');
      if (branch === val.hwagae) shinsalList.push('화개살(華蓋殺)');
      break;
    }
  }

  // 4. 천을귀인
  const gwiinBranches =
    ['甲', '戊', '庚'].includes(myDayMaster) ? ['丑', '未']
    : ['乙', '己'].includes(myDayMaster) ? ['子', '申']
    : ['丙', '丁'].includes(myDayMaster) ? ['亥', '酉']
    : ['壬', '癸'].includes(myDayMaster) ? ['巳', '卯']
    : ['辛'].includes(myDayMaster) ? ['午', '寅']
    : [];
  if (gwiinBranches.includes(branch)) {
    shinsalList.push('천을귀인(天乙貴人)');
  }

  const primaryShinsal = shinsalList[0] ?? `${elementTitle}의 작용`;
  const shinsalDesc =
    shinsalList.includes('양인살(羊刃殺)') ? '극강의 칼날과 서슬 퍼런 결단력의 기운'
    : shinsalList.includes('백호살(白虎殺)') ? '피 튀기는 추진력과 과감한 돌파의 기운'
    : shinsalList.includes('도화살(桃花殺)') ? '이목을 집중시키고 매력이 뿜어져 나오는 기운'
    : shinsalList.includes('역마살(驛馬殺)') ? '먼 길을 떠나고 판을 흔드는 질주의 기운'
    : shinsalList.includes('화개살(華蓋殺)') ? '예술적 영감과 비장의 무기를 벼리는 기운'
    : shinsalList.includes('천을귀인(天乙貴人)') ? '하늘이 돕고 귀인이 손을 내미는 최고의 길조'
    : '본원의 중심을 세우고 실리를 챙기는 기운';

  return {
    dateLabel,
    targetDate,
    ganji,
    stem,
    branch,
    element,
    elementTitle,
    stemGod,
    branchGod,
    shinsal: {
      primary: primaryShinsal,
      list: shinsalList,
      description: shinsalDesc,
    },
  };
}

export interface StrategyResult {
  headline: string;
  strategyText: string;
  needsPartnerNotice?: boolean;
}

/** 5대 본질 코어 카테고리 기반 사주 명리학 맞춤 작전 생성 */
export function generateCoreStrategy(
  category: CoreCategory,
  planText: string,
  omen: TomorrowOmen,
  mySaju: SajuResult | null,
  partnerSaju: SajuResult | null,
  partnerAlias?: string | null
): StrategyResult {
  const p = planText.trim();
  const inputSnippet = p ? `'${p}'` : '';
  const myDay = mySaju?.dayMaster ?? '戊';
  const ganjiText = omen.ganji;
  const shinsalMain = omen.shinsal.primary;

  // 1. 💰 [재물 (Wealth)]: 편재/정재/식상 vs 비겁/군겁쟁재 분석
  if (category === 'wealth') {
    const isMoneyGod = ['편재', '정재', '식신', '상관'].includes(omen.stemGod);
    const isRobberyGod = ['비견', '겁재'].includes(omen.stemGod);

    if (isMoneyGod) {
      return {
        headline: `💰 ${omen.stemGod}의 금맥 개방 · 단가 협상과 대금 수금의 결정적 순간`,
        strategyText:
          `(탁자를 탕 내리치며 서슬 퍼런 눈으로) "똑똑히 봐라! 내일 ${ganjiText} 날은 네 일간 ${myDay}에게 ${omen.stemGod}의 금고 문이 활짝 열리는 날이다! ` +
          `${inputSnippet ? `네가 벼르는 ${inputSnippet} 일에서 ` : ''}말끝을 흐리지 말고 원하는 숫자와 단가를 칠판에 못박아라! ` +
          `어설프게 양보하면 들어올 복도 샌다. 당당하게 네 몫을 요구하고 정산서에 날짜를 박아라. 내일은 숫자로 승부하는 놈이 천하를 쥔다!"`,
      };
    }

    if (isRobberyGod) {
      return {
        headline: `🔒 ${omen.stemGod}의 군겁쟁재 경고 · 지갑 빗장 걸고 현금 사수`,
        strategyText:
          `(단호하게 칼을 짚으며 호통치듯) "정신 똑바로 차려라! 내일은 하늘에 ${omen.stemGod}이 떠서 승냥이들이 네 밥그릇을 넘보는 형국이다. ` +
          `${inputSnippet ? `${inputSnippet} 진행할 때 ` : ''}동업이나 보증, 외상 따위는 단칼에 거절해라! ` +
          `판돈을 크게 벌리지 말고 계좌에 자물쇠를 단단히 채워라. 내일은 지키는 것이 곧 수억을 버는 비결이다!"`,
      };
    }

    return {
      headline: `🪙 ${omen.stemGod}의 실리 포석 · 알짜배기 현금 흐름 확보`,
      strategyText:
        `(부채를 촥 펴며 낮게 깔린 목소리로) "내일은 뜬구름 잡는 대박을 좇을 때가 아니다. ` +
        `${inputSnippet ? `${inputSnippet}에 집중하되 ` : ''}손에 쥐어지는 현금과 확실한 계약만 취해라. ` +
        `지출을 1원 단위까지 옥죄고 불필요한 결제를 미루면, 내일 굳힌 밑천이 올가을 큰 재물 운의 종잣돈이 된다!"`,
    };
  }

  // 2. 🏢 [비즈니스 (Business)]: 관성(신용/법인/계약)과 인성(문서/도장) 흐름 분석
  if (category === 'business') {
    const isContractGod = ['정관', '정인', '편인'].includes(omen.stemGod);
    const isPressureGod = ['편관', '상관'].includes(omen.stemGod);

    if (isContractGod) {
      return {
        headline: `🏢 ${omen.stemGod}의 귀인 문서운 · 계약 체결과 도장 날인의 적기`,
        strategyText:
          `(부채로 등을 팍 치며 호탕하게) "기회가 왔다! 내일 ${ganjiText} 날은 공문서와 귀인의 도장이 네 손으로 떨어지는 ${omen.stemGod}의 날이다! ` +
          `${inputSnippet ? `${inputSnippet} 담판에서 ` : ''}명분과 신용을 앞세워 밀어붙여라. ` +
          `상대의 잔기술에 말려들지 말고 규정과 법도를 당당히 들이밀면 상대가 먼저 펜을 든다. 네 칼날이 명분을 쥐었으니 거침없이 밀고 나가라!"`,
      };
    }

    if (isPressureGod) {
      return {
        headline: `⚠️ ${omen.stemGod}의 관재구설 주의 · 감정 배제와 서면 근거 사수`,
        strategyText:
          `(서슬 퍼런 눈으로 쏘아보며 속삭이듯) "조심해라! 내일은 ${omen.stemGod}의 칼바람이 불어 사소한 말 한마디가 소송과 구설로 튈 수 있다. ` +
          `${inputSnippet ? `${inputSnippet} 협상할 때 ` : ''}절대 감정 섞인 말이나 구두 약속은 입 밖에도 내지 마라! ` +
          `오직 메일과 공문, 계약서 조항 하나하나 현미경으로 뜯어봐라. 꼬투리를 잡히지 않는 자만이 최후의 승자가 된다!"`,
      };
    }

    return {
      headline: `🏛️ ${shinsalMain}의 판세 장악 · 주도권을 틀어쥐는 비즈니스`,
      strategyText:
        `(탁자를 묵직하게 짚으며) "내일은 ${shinsalMain}의 기운이 판을 지배한다. ` +
        `${inputSnippet ? `${inputSnippet} 자리에서 ` : ''}남들 눈치 보며 끌려다니지 마라. ` +
        `네가 판의 룰을 정하고 선수를 쳐라. 흔들림 없는 눈빛 하나로 기선을 제압해야 내일 회의실의 패권을 쥔다!"`,
    };
  }

  // 3. ❤️ [사랑 (Love)]: 도화/홍염/일지합충 + 상대방 사주 연동
  if (category === 'love') {
    if (!partnerSaju) {
      return {
        headline: `❤️ 상대 명식 미등록 · 단독 도화 분석 및 상대 등록 권고`,
        strategyText:
          `(상대의 손을 덥석 쥐며 안타까운 듯) "네 가슴에 연정의 불길이 일렁이나, 아직 상대방의 사주 명식이 내 손에 들어오지 않았다! ` +
          `내일 ${ganjiText} 날은 ${shinsalMain}의 기운이 맴도니 분위기는 타오르겠으나, 상대의 속마음과 두 사람의 합충을 보지 못하면 헛발질하기 십상이다. ` +
          `아래 등록창에서 상대방의 생년월일을 먼저 새겨라. 그래야 내일 밤 손을 덥석 잡을지, 한 발 물러설지 천기를 찔러준다!"`,
        needsPartnerNotice: true,
      };
    }

    // 상대방 사주가 있는 경우: 두 사람의 일간/일지 합충 정밀 대조
    const partnerDay = partnerSaju.dayMaster;
    const partnerBranch = partnerSaju.pillars.day.branch;
    const myBranch = mySaju?.pillars.day.branch ?? '辰';

    const isStemCombined = STEM_COMBINES[myDay] === partnerDay;
    const isBranchCombined = BRANCH_SIX_COMBINES[myBranch] === partnerBranch;
    const isBranchClashed = BRANCH_CLASHES[myBranch] === partnerBranch;

    const alias = partnerAlias || '그 사람';

    let chemistryNote = '';
    if (isStemCombined || isBranchCombined) {
      chemistryNote = `너와 ${alias} 사이에는 하늘과 땅의 끈끈한 합(合)이 들어맞아 말 한마디에도 심장이 통하는 날이다.`;
    } else if (isBranchClashed) {
      chemistryNote = `너와 ${alias}의 자리가 沖(충)으로 부딪치니 자존심 싸움이나 말실수 한 번에 판이 깨질 수 있다.`;
    } else {
      chemistryNote = `${alias}의 일간 ${partnerDay}와 네 일간 ${myDay} 사이에 미묘한 기류가 감도는 날이다.`;
    }

    return {
      headline: `💘 ${alias}과의 천기 인연 대조 · ${shinsalMain} 맞춤 공략`,
      strategyText:
        `(눈을 번뜩이며 귓가에 낮게 속삭이듯) "똑똑히 들어라! ${chemistryNote} ` +
        `내일 ${ganjiText} 날은 ${omen.stemGod}과 ${shinsalMain}이 솟구치는 때다. ` +
        `${inputSnippet ? `${inputSnippet}에서 ` : ''}어설프게 폼 잡거나 잰체하지 말고 시선을 깊게 맞춰라. ` +
        `${isBranchClashed ? '절대 고집부리지 말고 상대방 말에 고개를 끄덕여라.' : '분위기가 무르익었을 때 뜸 들이지 말고 먼저 손을 쥐어라.'} ` +
        `내일 주도권을 잡는 쪽이 상대의 영혼을 통째로 낚아챈다!"`,
      needsPartnerNotice: false,
    };
  }

  // 4. 💼 [직업 (Career)]: 관살과 식상, 상사/조직과의 관계
  if (category === 'career') {
    return {
      headline: `💼 ${omen.stemGod}의 직무 결전 · 업무 집중과 평판 극대화`,
      strategyText:
        `(칼을 쥐어주듯 노려보며) "내일은 직장에서 네 내공이 만천하에 드러나는 ${omen.stemGod}의 시험대다! ` +
        `${inputSnippet ? `${inputSnippet} 업무에서 ` : ''}잡생각을 버리고 오직 결과물로만 증명해라. ` +
        `윗사람이나 동료들의 불필요한 참견에 발끈하지 마라. 말 대신 압도적인 실력과 문서로 상대를 굴복시켜라. ` +
        `내일 흘린 땀방울 하나가 네 승진과 평판의 황금 갑옷이 된다!"`,
    };
  }

  // 5. 🌿 [건강 (Health)]: 오행 과다/결핍 바이오리듬 및 신체 충돌 회피
  if (category === 'health') {
    const el = omen.element;
    const healthOrgan =
      el === 'Fire' ? '심장과 혈압, 화병·두통'
      : el === 'Water' ? '신장과 방광, 극심한 피로'
      : el === 'Wood' ? '간과 신경계, 근육 뭉침'
      : el === 'Metal' ? '폐와 기관지, 호흡기 및 뼈마디'
      : '위장과 소화기, 담적';

    return {
      headline: `🌿 ${omen.elementTitle}의 바이오리듬 점검 · ${healthOrgan} 집중 케어`,
      strategyText:
        `(어깨를 묵직하게 다독이며 엄하게 타이르듯) "몸이 무너지면 천하의 명예와 황금도 물거품이다! ` +
        `내일 ${ganjiText} 날은 ${omen.elementTitle}이 요동쳐 특히 ${healthOrgan}에 탈이 나기 쉬운 시기다. ` +
        `${inputSnippet ? `${inputSnippet} 소화하더라도 ` : ''}무리한 야근이나 과음을 피하고 물을 자주 들이켜라. ` +
        `내일 밤은 온탕에 몸을 담그고 기운을 충전해라. 몸을 다스려야 다음 주의 칼날을 휘두를 수 있다!"`,
    };
  }

  // 기본 fallback
  return {
    headline: `⚡ ${ganjiText} 날의 천기 직설`,
    strategyText:
      `(탁자를 탕 내리치며) "내일은 ${ganjiText} 날, ${omen.stemGod}과 ${shinsalMain}의 기운이 요동친다! 네 심지 하나 믿고 거침없이 세상을 베어라!"`,
  };
}

/** 3초 오행 정산 후 메인 카드 [오늘의 열쇠]에 반영될 맞춤 해단 */
export function generateTodayCustomAdvice(
  emotion: string,
  event: string,
  memo?: string
): { keyword: string; fortuneText: string } {
  const m = memo?.trim();
  const memoSnippet = m ? `'${m}'` : `'${event}'`;

  const keyword = `${emotion}화(化)의 정산`;
  const fortuneText = `(탁자를 탕 내리치며 서슬 퍼런 눈으로) "네가 오늘 ${memoSnippet} 일로 가슴에 ${emotion}의 불길이 일렁였구나! 억울함과 고단함을 삼키며 여기까지 버틴 네 독기를 내가 안다. 오늘 배터리를 100% 채웠으니 지난 액운은 다 불태워졌다. 빗장을 걸어 잠그고 내일의 칼날을 갈아라!"`;

  return {
    keyword,
    fortuneText,
  };
}
