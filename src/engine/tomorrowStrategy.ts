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

  // 1. 💰 [재물 (Wealth)]: 양인살의 겁재/손재수 경계, 충동지출 차단 및 현금 회수 전략
  if (category === 'wealth') {
    const isYangin = omen.shinsal.list.includes('양인살(羊刃殺)');
    let specificTactic = '충동적인 지출이나 애매한 호의는 단칼에 잘라내라! 들어올 돈은 날짜를 못박아 독촉하고, 단가 협상에서는 네 이익을 1원도 깎아주지 마라.';
    if (/투자|코인|주식|펀드|부동산|청약/.test(p)) {
      specificTactic = `네가 고심하는 '${p}' 투자 판은 내일 양인(羊刃)의 조급한 탐욕이 도사리고 있다! 원금을 꽁꽁 묶어두고 신규 진입이나 추격 매수는 절대 금물이다.`;
    } else if (/회수|빌려|외상|미수|받을|정산|입금/.test(p)) {
      specificTactic = `내일은 못 받은 돈을 회수하기에 양인의 서슬 퍼런 기세가 제격이다. 미적거리지 말고 내일까지 입금하라고 칼같이 기한을 못박아라!`;
    } else if (/협상|단가|계약|비용|가격|인상|인하/.test(p)) {
      specificTactic = `단가 협상 자리에서 1원이라도 먼저 깎아주면 기선제압당한다. 내일은 네 마진을 단두대처럼 지키는 놈이 판돈을 쓸어 담는다!`;
    } else if (/지출|쇼핑|결제|충동|사고|구매/.test(p)) {
      specificTactic = `지갑을 여는 순간 손재수가 덮친다. 눈에 밟히는 것이 있어도 결제창을 닫고 하룻밤 재워라!`;
    }

    return {
      headline: `💰 ${omen.stemGod}·${isYangin ? '양인(羊刃) 손재수 차단' : '금맥 개방'} · 단가 협상과 현금 회수`,
      strategyText:
        `(탁자를 탕 내리치며 서슬 퍼런 눈으로) "똑똑히 봐라! 내일 ${ganjiText} 날은 네 일간 ${myDay}에게 비견과 ${isYangin ? '칼날 같은 양인살(羊刃)이 번뜩이는' : `${omen.stemGod}의`} 날이다! ` +
        `지갑이 헐거워지면 눈 깜짝할 새에 돈이 털린다. ${inputSnippet ? `네가 생각하는 ${inputSnippet} 일에서도 ` : ''}${specificTactic} ` +
        `내일은 지키고 긁어모으는 놈이 마지막에 웃는다!"`,
    };
  }

  // 2. 🏢 [비즈니스 (Business)]: 비견·양인의 독선 경계, 판세 장악 및 계약서 검토
  if (category === 'business') {
    const isYangin = omen.shinsal.list.includes('양인살(羊刃殺)');
    let businessTactic = '겉으로는 온화하게 상대의 말을 끝까지 들어주되, 손끝으로는 계약서 조항의 숨은 덫을 현미경으로 파헤쳐라.';
    if (/계약|도장|서명|조항|특약|싸인/.test(p)) {
      businessTactic = `계약서에 도장을 찍기 전, 숨겨진 불리한 특약이나 위약금 조항을 세 번 정독해라. 서두르는 쪽이 반드시 코를 꿰인다.`;
    } else if (/미팅|협상|담판|대표|파트너|동업/.test(p)) {
      businessTactic = `상대방의 달콤한 제안 뒤에 숨은 계산속을 꿰뚫어 봐라. 네 패를 먼저 까지 말고 상대가 안달 나서 조건을 올릴 때까지 침묵해라.`;
    } else if (/분쟁|소송|싸움|갈등|경쟁/.test(p)) {
      businessTactic = `감정적으로 맞서지 말고 명문화된 증거와 기록으로 상대를 포위해라. 양인의 칼은 법도와 명분을 쥘 때 백전백승이다!`;
    }

    return {
      headline: `🏢 ${omen.stemGod}·${isYangin ? '양인(羊刃) 판세 장악' : '신용 확보'} · 독선 경계와 계약서 검토`,
      strategyText:
        `(부채로 등을 팍 치며 호탕하게) "내일 ${ganjiText} 날은 네 기세가 하늘을 찌르되, ${isYangin ? '양인의 칼날이 제 살을 벨 수도 있는' : '명분을 쥐어야 하는'} 시험대다! ` +
        `${inputSnippet ? `${inputSnippet} 자리에서 ` : ''}네 고집만 부리다간 거래처와 파열음이 난다. ` +
        `${businessTactic} 판을 설계한 뒤 도장을 찍으면 천하의 터전이 네 손안에 들어온다!"`,
    };
  }

  // 3. ❤️ [사랑 (Love)]: 도화·홍염 상호작용 및 주도권, 상대방 감정 조율
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
      chemistryNote = `너와 ${alias} 사이에는 하늘과 땅의 끈끈한 합(合)이 들어맞아 도화의 꽃잎이 활짝 피어난다.`;
    } else if (isBranchClashed) {
      chemistryNote = `너와 ${alias}의 자리가 沖(충)으로 맞부딪치니 자존심 싸움이나 말실수 한 번에 판이 깨질 수 있다.`;
    } else {
      chemistryNote = `${alias}의 일간 ${partnerDay}와 네 일간 ${myDay} 사이에 미묘한 긴장과 끌림이 교차하는 날이다.`;
    }

    let loveTactic = isBranchClashed
      ? '절대 고집부리지 말고 상대의 투정을 한 박자 받아줘라.'
      : '분위기가 무르익었을 때 뜸 들이지 말고 먼저 손을 쥐어라.';

    if (/싸움|다툼|서운|화해|갈등/.test(p)) {
      loveTactic = `내일은 자존심 세우는 쪽이 패자다. 상대의 서운함을 먼저 보듬어주고 한 발 양보해야 뒤틀린 실타래가 풀린다.`;
    } else if (/고백|소개팅|데이트|첫만남/.test(p)) {
      loveTactic = `시선을 피하지 말고 3초 이상 지그시 응시해라. 네 눈빛에 깃든 도화의 빛이 상대의 심장을 먼저 두드릴 것이다.`;
    } else if (/연락|카톡|문자|전화/.test(p)) {
      loveTactic = `답장을 너무 재지 마라. 진솔하고 담백한 한마디가 백 마디 밀당보다 상대의 마음을 녹인다.`;
    }

    return {
      headline: `💘 ${alias}과의 천기 인연 대조 · ${shinsalMain} 맞춤 공략`,
      strategyText:
        `(눈을 번뜩이며 귓가에 낮게 속삭이듯) "똑똑히 들어라! ${chemistryNote} ` +
        `내일 ${ganjiText} 날은 도화와 홍염의 붉은 불길이 요동친다. ` +
        `${inputSnippet ? `${inputSnippet}에서 ` : ''}어설프게 잰체하지 말고 시선을 깊게 맞춰라. ` +
        `${loveTactic} 감정을 섬세하게 조율하며 주도권을 쥐는 쪽이 상대의 심장을 통째로 사로잡는다!"`,
      needsPartnerNotice: false,
    };
  }

  // 4. 💼 [직업 (Career)]: 비견·양인의 독선 경계, 조직 내 입지와 평판 극대화
  if (category === 'career') {
    const isYangin = omen.shinsal.list.includes('양인살(羊刃殺)');
    let careerTactic = '윗사람이나 동료들의 불필요한 참견에 발끈하지 마라. 독선은 경계하되 네 전문성만큼은 양보 없이 밀어붙여라.';
    if (/이직|퇴사|면접|스카우트/.test(p)) {
      careerTactic = `성급하게 칼을 뽑지 말고 조건을 냉정하게 따져라. 면접 자리에서는 양인의 당당함으로 판을 장악하되 오만함은 감춰라.`;
    } else if (/보고|발표|프레젠테이션|pt/.test(p)) {
      careerTactic = `수식어는 다 쳐내고 숫자가 담긴 핵심 결론부터 던져라. 논리가 서슬 퍼럴 때 청중의 기립박수가 터진다.`;
    } else if (/상사|팀장|동료|부하|정치/.test(p)) {
      careerTactic = `사내 정치의 구설수에 휘말리지 마라. 오직 문서와 결과물로만 발언하고 묵묵히 네 진지를 지켜라.`;
    }

    return {
      headline: `💼 ${omen.stemGod}·${isYangin ? '양인(羊刃) 직무 결전' : '신용 증명'} · 업무 집중과 평판 극대화`,
      strategyText:
        `(칼을 쥐어주듯 노려보며) "내일은 직장에서 네 내공이 만천하에 드러나는 ${omen.stemGod}의 시험대다! ` +
        `${inputSnippet ? `${inputSnippet} 업무에서 ` : ''}잡생각을 버리고 오직 압도적인 결과물로만 증명해라. ` +
        `${careerTactic} 내일 흘린 땀방울 하나가 네 승진과 평판의 황금 갑옷이 된다!"`,
    };
  }

  // 5. 🌿 [건강 (Health)]: 화(火) 과다에 따른 심혈관/두통 주의 및 금(金) 보충법
  if (category === 'health') {
    let healthTactic = '매운 음식과 카페인을 멀리하고, 찬물과 은빛 쇠(金) 기운을 가까이해라.';
    if (/두통|편두통|혈압|어지럼/.test(p)) {
      healthTactic = `치솟는 열기로 머리 쪽에 화(火)가 고였으니 관자놀이를 찬물로 식히고 카페인을 단칼에 끊어라.`;
    } else if (/잠|불면|수면|피로|야근/.test(p)) {
      healthTactic = `자기 전 스마트폰 화면을 끄고 미지근한 물에 발을 담가라. 뇌의 불길을 식혀야 깊은 잠이 든다.`;
    } else if (/위장|소화|속쓰림|식사/.test(p)) {
      healthTactic = `자극적인 음식을 금하고 담백한 밥과 따뜻한 보리차로 위장의 열독을 가라앉혀라.`;
    }

    return {
      headline: `🌿 적화(赤火) 과다 경고 · 심혈관·두통 주의 및 금(金) 기운 보충`,
      strategyText:
        `(어깨를 묵직하게 다독이며 엄하게 타이르듯) "몸이 무너지면 천하의 명예와 황금도 물거품이다! ` +
        `내일 ${ganjiText} 날은 한낮의 맹렬한 불(火) 기운이 솟구쳐 심혈관, 혈압, 편두통과 가슴 답답증이 도지기 쉽다. ` +
        `${inputSnippet ? `${inputSnippet} 소화하더라도 ` : ''}${healthTactic} ` +
        `내일 밤은 온탕에 몸을 담그고 일찍 불을 꺼라. 몸을 다스려야 다음 주의 칼날을 휘두를 수 있다!"`,
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
