import { calculateSaju } from './calculator';
import { getTenGod } from './timelineEngine';
import type { EarthlyBranch, FiveElement, HeavenlyStem, SajuResult } from './types';
import { formatSajuTerm } from '../utils/sajuTerms';

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

const ELEMENT_TITLE_MAP_JA: Record<FiveElement, string> = {
  Wood: '青木（木気）の気運',
  Fire: '赤火（火気）の気運',
  Earth: '黄土（土気）の気運',
  Metal: '白金（金気）の気運',
  Water: '黒水（水気）の気運',
};

const BRANCH_SHINSAL_MAP: Record<string, { dohwa: EarthlyBranch; yeokma: EarthlyBranch; hwagae: EarthlyBranch }> = {
  '寅午戌': { dohwa: '卯', yeokma: '申', hwagae: '戌' },
  '申子辰': { dohwa: '酉', yeokma: '寅', hwagae: '辰' },
  '巳酉丑': { dohwa: '午', yeokma: '亥', hwagae: '丑' },
  '亥卯未': { dohwa: '子', yeokma: '巳', hwagae: '未' },
};

const BAEKHO_LIST = new Set(['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑']);
const YANGIN_STEM_BRANCH: Record<string, EarthlyBranch> = {
  '甲': '卯',
  '丙': '午',
  '戊': '午',
  '庚': '酉',
  '壬': '子',
};

const STEM_COMBINES: Record<string, string> = {
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
};

const BRANCH_SIX_COMBINES: Record<string, string> = {
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳',
  '午': '未', '未': '午',
};

const BRANCH_CLASHES: Record<string, string> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳',
};

const BRANCH_MAIN_STEM: Record<EarthlyBranch, HeavenlyStem> = {
  '子': '癸',
  '丑': '己',
  '寅': '甲',
  '卯': '乙',
  '辰': '戊',
  '巳': '丙',
  '午': '丁',
  '未': '己',
  '申': '庚',
  '酉': '辛',
  '戌': '戊',
  '亥': '壬',
};

const GOD_JA_MAP: Record<string, string> = {
  '비견': '比肩',
  '겁재': '劫財',
  '식신': '食神',
  '상관': '傷官',
  '편재': '偏財',
  '정재': '正財',
  '편관': '偏官',
  '정관': '正官',
  '편인': '偏印',
  '정인': '印綬',
};

function formatGod(god: string, isJa: boolean): string {
  if (!isJa) return god;
  return GOD_JA_MAP[god] ?? formatSajuTerm(god, 'jp');
}

function formatShinsal(name: string, isJa: boolean): string {
  if (!isJa) return name;
  if (name.includes('천을귀인') || name.includes('天乙貴人')) return '天乙貴人';
  if (name.includes('양인살') || name.includes('羊刃殺')) return '羊刃';
  if (name.includes('백호살') || name.includes('白虎殺')) return '白虎';
  if (name.includes('도화살') || name.includes('桃花殺')) return '桃花';
  if (name.includes('역마살') || name.includes('驛馬殺')) return '駅馬';
  if (name.includes('화개살') || name.includes('華蓋殺')) return '華蓋';
  return formatSajuTerm(name, 'jp');
}

/** 특정 날짜 기준 일진 및 정통 신살 계산 */
export function getTomorrowOmen(
  saju: SajuResult | null,
  targetDate: Date = new Date(),
  lang?: string
): TomorrowOmen {
  const isJa = lang === 'jp' || lang === 'ja';
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const weekDay = isJa
    ? (['日', '月', '火', '水', '木', '金', '土'][targetDate.getDay()] ?? '')
    : (['일', '월', '화', '수', '목', '금', '토'][targetDate.getDay()] ?? '');
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
  const elementTitle = isJa
    ? (ELEMENT_TITLE_MAP_JA[element] ?? '赤火（火気）の気運')
    : (ELEMENT_TITLE_MAP[element] ?? '적화(赤火)의 기운');

  const myDayMaster = saju?.dayMaster ?? '戊';
  const stemGod = getTenGod(myDayMaster, stem);
  const branchGod = getTenGod(myDayMaster, BRANCH_MAIN_STEM[branch]);

  const shinsalList: string[] = [];
  const userDayBranch = saju?.pillars.day.branch ?? '辰';

  // 1. 양인살
  if (YANGIN_STEM_BRANCH[myDayMaster] === branch) {
    shinsalList.push(isJa ? '羊刃' : '양인살(羊刃殺)');
  }

  // 2. 백호대살
  if (BAEKHO_LIST.has(ganji)) {
    shinsalList.push(isJa ? '白虎' : '백호살(白虎殺)');
  }

  // 3. 삼합 도화/역마/화개
  for (const [group, val] of Object.entries(BRANCH_SHINSAL_MAP)) {
    if (group.includes(userDayBranch)) {
      if (branch === val.dohwa) shinsalList.push(isJa ? '桃花' : '도화살(桃花殺)');
      if (branch === val.yeokma) shinsalList.push(isJa ? '駅馬' : '역마살(驛馬殺)');
      if (branch === val.hwagae) shinsalList.push(isJa ? '華蓋' : '화개살(華蓋殺)');
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
    shinsalList.push(isJa ? '天乙貴人' : '천을귀인(天乙貴人)');
  }

  const primaryShinsal = shinsalList[0] ?? (isJa ? '五行の作用' : `${elementTitle}의 작용`);
  const hasShinsal = (kr: string, ja: string) => shinsalList.includes(kr) || shinsalList.includes(ja);
  const shinsalDesc = isJa
    ? (hasShinsal('양인살(羊刃殺)', '羊刃') ? '極限の刃と鋭い決断力の気'
      : hasShinsal('백호살(白虎殺)', '白虎') ? '血湧き肉躍る推進力と果敢な突破の気'
      : hasShinsal('도화살(桃花殺)', '桃花') ? '注目を集め魅力が溢れ出す気'
      : hasShinsal('역마살(驛馬殺)', '駅馬') ? '遠くへ旅立ち局面を動かす疾走の気'
      : hasShinsal('화개살(華蓋殺)', '華蓋') ? '芸術적インスピレーションと秘蔵の武器を研ぎ澄ます気'
      : hasShinsal('천을귀인(天乙貴人)', '天乙貴人') ? '天が助け、貴人が手を差し伸べる最高の吉兆'
      : '本元の中心を立て実利を掴む気')
    : (hasShinsal('양인살(羊刃殺)', '羊刃') ? '극강의 칼날과 서슬 퍼런 결단력의 기운'
      : hasShinsal('백호살(白虎殺)', '백호살(白虎殺)') ? '피 튀기는 추진력과 과감한 돌파의 기운'
      : hasShinsal('도화살(桃花殺)', '도화살(桃花殺)') ? '이목을 집중시키고 매력이 뿜어져 나오는 기운'
      : hasShinsal('역마살(驛馬殺)', '역마살(驛馬殺)') ? '먼 길을 떠나고 판을 흔드는 질주의 기운'
      : hasShinsal('화개살(華蓋殺)', '화개살(華蓋殺)') ? '예술적 영감과 비장의 무기를 벼리는 기운'
      : hasShinsal('천을귀인(天乙貴人)', '천을귀인(天乙貴人)') ? '하늘이 돕고 귀인이 손을 내미는 최고의 길조'
      : '본원의 중심을 세우고 실리를 챙기는 기운');

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

function cleanStrategy(res: StrategyResult): StrategyResult {
  return {
    ...res,
    headline: res.headline.replace(/\([^)]*\)/g, '').trim(),
    strategyText: res.strategyText.replace(/\([^)]*\)/g, '').trim(),
  };
}

/** 5대 본질 코어 카테고리 기반 사주 명리학 맞춤 작전 생성 */
export function generateCoreStrategy(
  category: CoreCategory,
  planText: string,
  omen: TomorrowOmen,
  mySaju: SajuResult | null,
  partnerSaju: SajuResult | null,
  partnerAlias?: string | null,
  lang?: string
): StrategyResult {
  const isJa = lang === 'jp' || lang === 'ja';
  const p = planText.trim();
  const myDay = mySaju?.dayMaster ?? '戊';
  const ganjiText = omen.ganji;
  const shinsalMain = omen.shinsal.primary;
  const isYangin = omen.shinsal.list.includes('양인살(羊刃殺)') || omen.shinsal.list.includes('羊刃');
  const defaultHeadline = isJa ? '【明日の作戦指針】神童の一刀両断' : '【내일의 작전 지침】옥동자 일도양단';

  // 1. 💰 [재물 (Wealth)]
  if (category === 'wealth') {
    if (isJa) {
      const stemGodLabel = formatGod(omen.stemGod, true);
      const branchGodLabel = formatGod(omen.branchGod, true);
      let situationLead = '明日、金が動く道筋で算盤を弾き、夜も眠れずにいることだろう。';
      let actionTactic = '衝動的な出費や中途半端な情けは一刀両断に切り捨てろ！入るべき金は期日を釘付けにして督促し、単価交渉では己の利益を1円たりとも削るな。';

      if (/투자|코인|주식|펀드|부동산|청약|投資|株|仮想通貨|FX|不動産/.test(p)) {
        situationLead = '血の汗流して稼いだ種銭を増やそうと、チャートや相場表を睨みつけて息を詰めているのだな。己の内側で一攫千金を狙う強欲と不安が渦巻いているのが手に取るように見えるぞ！';
        actionTactic = `明日の${ganjiText}の日は、お前の日干${myDay}にとって${isYangin ? '比肩と鋭利な刃の如き羊刃殺が煌めく日だ！羊刃は一瞬で蔵を空にする破財の刺客だ。' : `${stemGodLabel}の試練の日だ。`}新規の買いや飛びつき買いは一刀両断に切り捨て、元本を金庫に固く縛り付けておけ！`;
      } else if (/회수|빌려|외상|미수|받을|정산|입금|빌려준|回収|貸した|未収|精算|振込|売掛/.test(p)) {
        situationLead = '回収できぬ金、貸した金を取り戻そうと、歯を食いしばって機会を窺っていることだろう。';
        actionTactic = `明日は${isYangin ? '羊刃の研ぎ澄まされた刃がうってつけだ！' : '情けを捨てよ！'}相手の顔色を窺って躊躇うな、明日までに振り込めと期限を厳格に釘付けにせよ。非情に徹してこそ己の金が戻ってくるのだ！`;
      } else if (/협상|단가|계약|비용|가격|인상|인하|마진|交渉|単価|契約|費用|価格|値上げ|値下げ|マージン/.test(p)) {
        situationLead = '取引先と相対し、単価一つ、マージン1円を巡って血の滲むような神経戦を戦わねばならず、心臓が縮み上がる思いだろう。';
        actionTactic = '単価交渉の場で1円でも先に譲歩すれば主導権を奪われる。明日は己の利益を断頭台のように死守せよ！';
      } else if (/지출|쇼핑|결제|충동|사고|구매|사야|支出|買い物|決済|衝動買い|購入/.test(p)) {
        situationLead = '財布の紐が緩み、決済画面の前で行きつ戻りつ心が揺らいでいるのだな。';
        actionTactic = '財布を開いた瞬間、破財の罠に掛かるぞ。気にかかる物があろうとも、今すぐ決済画面を閉じて一晩寝かせろ！';
      }

      return cleanStrategy({
        headline: defaultHeadline,
        strategyText:
          `刮目して見よ！${situationLead} ` +
          `明日の${ganjiText}の日は、お前の日干である${myDay}にとって${stemGodLabel}と${isYangin ? '比肩と刃の如き羊刃が閃く' : branchGodLabel}の日だ。 ` +
          `財布の紐が緩めば瞬く間に金をむしり取られるぞ。${actionTactic} ` +
          `明日は守り抜き、掻き集めた者が最後に笑うのだ！`,
      });
    }

    // Korean wealth
    let situationLead = '내일 돈이 오가는 길목에서 주판알을 튕기며 밤잠을 설치고 있겠지.';
    let actionTactic = '충동적인 지출이나 애매한 호의는 단칼에 잘라내라! 들어올 돈은 날짜를 못박아 독촉하고, 단가 협상에서는 네 이익을 1원도 깎아주지 마라.';

    if (/투자|코인|주식|펀드|부동산|청약/.test(p)) {
      situationLead = '피 같은 종잣돈을 굴려보겠다고 차트와 시세판을 노려보며 가슴 졸이고 있구나. 네 안에서 대박을 노리는 탐욕과 불안이 뒤엉켜 요동치는 게 다 보인다!';
      actionTactic = `내일 ${ganjiText} 날은 네 일간 ${myDay}에게 비견과 칼날 같은 양인살(羊刃)이 번뜩이는 날이다! 양인은 순식간에 곳간을 털어가는 손재수의 칼잡이야. 신규 매수나 추격 매수는 단칼에 잘라내고 원금을 금고에 꽁꽁 묶어둬라!`;
    } else if (/회수|빌려|외상|미수|받을|정산|입금|빌려준/.test(p)) {
      situationLead = '못 받은 돈, 빌려준 돈을 돌려받으려고 이를 악물고 기회를 엿보고 있겠지.';
      actionTactic = '내일은 양인의 서슬 퍼런 칼날이 제격이다! 상대 눈치 보며 우물쭈물하지 말고 내일까지 입금하라고 칼같이 기한을 못박아라. 내일은 독하게 굴어야 네 돈이 돌아온다!';
    } else if (/협상|단가|계약|비용|가격|인상|인하|마진/.test(p)) {
      situationLead = '거래처와 마주 앉아 단가 하나, 마진 한 푼을 두고 피 말리는 신경전을 치러야 하니 심장이 바짝 졸아들 테지.';
      actionTactic = '단가 협상 자리에서 1원이라도 먼저 깎아주면 기선제압당한다. 내일은 네 마진을 단두대처럼 지키는 놈이 판돈을 쓸어 담는다!';
    } else if (/지출|쇼핑|결제|충동|사고|구매|사야/.test(p)) {
      situationLead = '지갑이 들썩거리고 결제창 앞에서 서성거리며 마음이 흔들리고 있구나.';
      actionTactic = '지갑을 여는 순간 손재수의 덫에 걸린다. 눈에 밟히는 것이 있어도 당장 결제창을 닫고 하룻밤 재워라!';
    }

    return cleanStrategy({
      headline: defaultHeadline,
      strategyText:
        `똑똑히 봐라! ${situationLead} ` +
        `내일 ${ganjiText} 날은 네 일간 ${myDay}에게 비견과 ${isYangin ? '칼날 같은 양인살(羊刃)이 번뜩이는' : `${omen.stemGod}의`} 날이다. ` +
        `지갑이 헐거워지면 눈 깜짝할 새에 돈이 털린다. ${actionTactic} ` +
        `내일은 지키고 긁어모으는 놈이 마지막에 웃는다!`,
    });
  }

  // 2. 🏢 [비즈니스 (Business)]
  if (category === 'business') {
    if (isJa) {
      let situationLead = '盤勢を設計し、人と対峙して決断を下さねばならず、頭の中が混濁していることだろう。';
      let actionTactic = '表向きは穏やかに相手の言葉を最後まで傾聴しつつ、指先では契約条項の隠れた罠を顕微鏡のように暴き出せ。';

      if (/계약|도장|서명|조항|특약|싸인|契約|捺印|署名|条項|特約|サイン/.test(p)) {
        situationLead = '重大な文書に判を捺すべき岐路で、隠された罠があるのではないかと神経を尖らせているのだな。';
        actionTactic = '契約書に印を捺す前に、不利な隠し特約や違約金条項を三度精読せよ。焦った方が必ず鼻面を引き回されるぞ。';
      } else if (/미팅|협상|담판|대표|파트너|동업|ミーティング|交渉|直談判|代表|パートナー|共同経営/.test(p)) {
        situationLead = '相手と膝を突き合わせて談判し、新たな局面を築かねばならず、あらゆる損得勘定が頭を巡っていることだろう。';
        actionTactic = '相手の甘い提案の裏に潜む企みを見透かせ。己の手札を先に晒すな、沈黙をもって相手を焦らせろ！';
      } else if (/분쟁|소송|싸움|갈등|경쟁|紛争|訴訟|喧嘩|葛藤|競争|トラブル/.test(p)) {
        situationLead = '相手ともつれた葛藤や争いの中で、刃を抜きたい心情であろう。';
        actionTactic = '感情でぶつかるな、明文化された証拠と記録で相手を包囲せよ。羊刃の刀は法理と大義を握る時こそ百戦百勝なのだ！';
      }

      return cleanStrategy({
        headline: defaultHeadline,
        strategyText:
          `明日の${ganjiText}の日は、お前の気勢が天を衝く反面、${isYangin ? '羊刃の刃が己の身を斬りかねない' : '大義名分を握るべき'}試練の場だ！ ` +
          `${situationLead} 独善に走れば取引先と破裂音を生むぞ。 ` +
          `${actionTactic} 盤勢を掌握した上で判を捺せば、天下の足場はお前の手の内に落ちる！`,
      });
    }

    // Korean business
    let situationLead = '판세를 설계하고 사람들과 마주 앉아 결단을 내려야 하니 머릿속이 복잡하겠지.';
    let actionTactic = '겉으로는 온화하게 상대의 말을 끝까지 들어주되, 손끝으로는 계약서 조항의 숨은 덫을 현미경으로 파헤쳐라.';

    if (/계약|도장|서명|조항|특약|싸인/.test(p)) {
      situationLead = '중대한 문서에 도장을 찍어야 하는 기로에서 숨은 덫이 있을까 봐 촉을 곤두세우고 있구나.';
      actionTactic = '계약서에 도장을 찍기 전, 숨겨진 불리한 특약이나 위약금 조항을 세 번 정독해라. 서두르는 쪽이 반드시 코를 꿰인다.';
    } else if (/미팅|협상|담판|대표|파트너|동업/.test(p)) {
      situationLead = '상대방과 마주 앉아 담판을 짓고 새 판을 짜야 하니 온갖 계산이 머릿속을 스치겠지.';
      actionTactic = '상대방의 달콤한 제안 뒤에 숨은 꿍꿍이를 꿰뚫어 봐라. 네 패를 먼저 까주지 말고 침묵으로 상대를 안달 나게 해라!';
    } else if (/분쟁|소송|싸움|갈등|경쟁/.test(p)) {
      situationLead = '상대와 얽힌 갈등과 싸움 속에서 칼을 빼들고 싶은 심정일 테지.';
      actionTactic = '감정적으로 맞서지 말고 명문화된 증거와 기록으로 상대를 포위해라. 양인의 칼은 법도와 명분을 쥘 때 백전백승이다!';
    }

    return cleanStrategy({
      headline: defaultHeadline,
      strategyText:
        `내일 ${ganjiText} 날은 네 기세가 하늘을 찌르되, ${isYangin ? '양인의 칼날이 제 살을 벨 수도 있는' : '명분을 쥐어야 하는'} 시험대다! ` +
        `${situationLead} 네 고집만 부리다간 거래처와 파열음이 난다. ` +
        `${actionTactic} 판을 장악한 뒤 도장을 찍으면 천하의 터전이 네 손안에 들어온다!`,
    });
  }

  // 3. ❤️ [사랑 (Love)]
  if (category === 'love') {
    if (!partnerSaju) {
      if (isJa) {
        return cleanStrategy({
          headline: defaultHeadline,
          strategyText:
            `胸の内に恋情の炎が揺らめいているが、まだ相手の四柱命式が我が手に届いておらぬ！ ` +
            `明日の${ganjiText}の日は${formatShinsal(shinsalMain, true)}の気が立ち込め、雰囲気は燃え上がるだろうが、相手の本心と二人の合沖を見極めねば空振りに終わるのが関の山だ。 ` +
            `下の登録窓から相手の生年月日をまず刻み込め。さすれば明日の夜、手を握るべきか引くべきか、天機を突き刺してくれよう！`,
          needsPartnerNotice: true,
        });
      }
      return cleanStrategy({
        headline: defaultHeadline,
        strategyText:
          `네 가슴에 연정의 불길이 일렁이나, 아직 상대방의 사주 명식이 내 손에 들어오지 않았다! ` +
          `내일 ${ganjiText} 날은 ${shinsalMain}의 기운이 맴도니 분위기는 타오르겠으나, 상대의 속마음과 두 사람의 합충을 보지 못하면 헛발질하기 십상이다. ` +
          `아래 등록창에서 상대방의 생년월일을 먼저 새겨라. 그래야 내일 밤 손을 덥석 잡을지, 한 발 물러설지 천기를 찔러준다!`,
        needsPartnerNotice: true,
      });
    }

    const partnerDay = partnerSaju.dayMaster;
    const partnerBranch = partnerSaju.pillars.day.branch;
    const myBranch = mySaju?.pillars.day.branch ?? '辰';

    const isStemCombined = STEM_COMBINES[myDay] === partnerDay;
    const isBranchCombined = BRANCH_SIX_COMBINES[myBranch] === partnerBranch;
    const isBranchClashed = BRANCH_CLASHES[myBranch] === partnerBranch;

    if (isJa) {
      const alias = partnerAlias ? formatSajuTerm(partnerAlias, 'jp') : 'お相手';
      let chemistryNote = '';
      if (isStemCombined || isBranchCombined) {
        chemistryNote = `お前と${alias}の間には天地の強固な合が噛み合い、桃花の花弁が咲き誇る。`;
      } else if (isBranchClashed) {
        chemistryNote = `お前と${alias}の座が沖で激突するゆえ、意地の張り合いや不用意な一言で盤が砕け散る恐れがある。`;
      } else {
        chemistryNote = `${alias}の日干${partnerDay}とお前の日干${myDay}の間に、微妙な緊張と引力が交錯する日だ。`;
      }

      let situationLead = '心に抱く人との関係で舵を取れず、胸が激しく波打っているのだな。';
      let actionTactic = isBranchClashed
        ? '決して意地を張らず、相手の我が儘を一拍呑み込んで受け止めろ。'
        : '機が熟した瞬間、躊躇わずにお前から手を握れ。';

      if (/싸움|다툼|서운|화해|갈등|喧嘩|言い争い|不満|和解|葛藤|すれ違い/.test(p)) {
        situationLead = '心無い一言にプライドを傷つけられ、拗れた感情をどうにもできず苦悶しているのだろう。';
        actionTactic = '明日はプライドを振りかざした方が敗者だ。相手の寂しさを先に包み込み、一歩譲歩してこそ拗れた糸が解ける。';
      } else if (/고백|소개팅|데이트|첫만남|告白|マッチング|デート|初対面/.test(p)) {
        situationLead = '想い人を前にする高鳴りと恐れで、胸が早鐘を打っているのだな。';
        actionTactic = '視線を逸らすな、3秒以上じっと見つめろ。お前の眼差しに宿る桃花の光が、相手の心臓を先に叩くはずだ。';
      } else if (/연락|카톡|문자|전화|LINE|連絡|メッセージ|電話|返信/.test(p)) {
        situationLead = 'スマートフォンばかり見つめ、たった一通の連絡に心が乱高下しているのだな。';
        actionTactic = '返信の駆け引きをするな。飾り気のない率直な一言こそが、百の駆け引きより相手の心を溶かすのだ。';
      }

      return cleanStrategy({
        headline: defaultHeadline,
        strategyText:
          `耳をかっぽじって聞け！${chemistryNote} ${situationLead} ` +
          `明日の${ganjiText}の日は、桃花と紅艶の紅蓮の炎が渦巻く。生半可な気取りは捨て、視線を深く絡めろ。 ` +
          `${actionTactic} 感情を繊細に調律し、主導権を握った者が相手の心臓を丸ごと手に入れるのだ！`,
        needsPartnerNotice: false,
      });
    }

    // Korean love
    const alias = partnerAlias || '그 사람';
    let chemistryNote = '';
    if (isStemCombined || isBranchCombined) {
      chemistryNote = `너와 ${alias} 사이에는 하늘과 땅의 끈끈한 합(合)이 들어맞아 도화의 꽃잎이 활짝 피어난다.`;
    } else if (isBranchClashed) {
      chemistryNote = `너와 ${alias}의 자리가 沖(충)으로 맞부딪치니 자존심 싸움이나 말실수 한 번에 판이 깨질 수 있다.`;
    } else {
      chemistryNote = `${alias}의 일간 ${partnerDay}와 네 일간 ${myDay} 사이에 미묘한 긴장과 끌림이 교차하는 날이다.`;
    }

    let situationLead = '마음에 품은 사람과의 관계에서 갈피를 잡지 못하고 가슴이 쿵쾅거리고 있구나.';
    let actionTactic = isBranchClashed
      ? '절대 고집부리지 말고 상대의 투정을 한 박자 받아줘라.'
      : '분위기가 무르익었을 때 뜸 들이지 말고 먼저 손을 쥐어라.';

    if (/싸움|다툼|서운|화해|갈등/.test(p)) {
      situationLead = '서운한 말 한마디에 자존심이 상해 뒤틀린 마음을 어쩌지 못하고 끙끙 앓고 있겠지.';
      actionTactic = '내일은 자존심 세우는 쪽이 패자다. 상대의 서운함을 먼저 보듬어주고 한 발 양보해야 뒤틀린 실타래가 풀린다.';
    } else if (/고백|소개팅|데이트|첫만남/.test(p)) {
      situationLead = '마음에 품은 사람을 마주할 생각에 설렘과 두려움으로 가슴이 방망이질 치고 있구나.';
      actionTactic = '시선을 피하지 말고 3초 이상 지그시 응시해라. 네 눈빛에 깃든 도화의 빛이 상대의 심장을 먼저 두드릴 것이다.';
    } else if (/연락|카톡|문자|전화/.test(p)) {
      situationLead = '휴대폰만 들여다보며 연락 한 줄에 마음이 롤러코스터를 타고 있구나.';
      actionTactic = '답장을 너무 재지 마라. 진솔하고 담백한 한마디가 백 마디 밀당보다 상대의 마음을 녹인다.';
    }

    return cleanStrategy({
      headline: defaultHeadline,
      strategyText:
        `똑똑히 들어라! ${chemistryNote} ${situationLead} ` +
        `내일 ${ganjiText} 날은 도화와 홍염의 붉은 불길이 요동친다. 어설프게 잰체하지 말고 시선을 깊게 맞춰라. ` +
        `${actionTactic} 감정을 섬세하게 조율하며 주도권을 쥐는 쪽이 상대의 심장을 통째로 사로잡는다!`,
      needsPartnerNotice: false,
    });
  }

  // 4. 💼 [직업 (Career)]
  if (category === 'career') {
    if (isJa) {
      const stemGodLabel = formatGod(omen.stemGod, true);
      let situationLead = '職場で己の座を守り、成果を証明せねばならず、肩にずっしりと重圧がのしかかっていることだろう。';
      let actionTactic = '上司や同僚の無用な口出しに色をなすな。独善は戒めつつも、己の専門性だけは一切譲らず押し通せ。';

      if (/이직|퇴사|면접|스카우트|転職|退職|面接|スカウト/.test(p)) {
        situationLead = '新たな天地へ打って出るべく刀を研ぎ、面接官の前に立たねばならず、心臓が跳ね血の気が引く思いだろう。';
        actionTactic = '性急に抜刀せず、条件を冷徹に見定めろ。面接の場では堂々たる気迫で場を呑み込み、慢心だけは隠し通せ。';
      } else if (/보고|발표|프레젠테이션|pt|報告|発表|プレゼン|登壇/.test(p)) {
        situationLead = '大勢の前に立ち、己の実力を白日の下に晒さねばならず、緊張が極に達しているのだな。';
        actionTactic = '修飾語はすべて削ぎ落とし、数字を伴う核心の結論から叩きつけろ。論理が研ぎ澄まされた時、満場の拍手が湧き起こる。';
      } else if (/상사|팀장|동료|부하|정치|上司|リーダー|同僚|部下|社内政治/.test(p)) {
        situationLead = '社内の人間関係や上司の顔色伺いに業を煮やし、いっそすべてを引っ繰り返したい衝動に駆られているのだな。';
        actionTactic = '社内政治の雑音に巻き込まれるな。ただ文書と圧倒的な結果でのみ発言し、黙々と己の陣地を死守せよ。';
      }

      return cleanStrategy({
        headline: defaultHeadline,
        strategyText:
          `明日は職場においてお前の内功が天下に示される${stemGodLabel}の試練の場だ！ ` +
          `${situationLead} 雑念を捨て、ただ圧倒的な成果物のみで証明せよ。 ` +
          `${actionTactic} 明日流した一滴の汗が、昇進と名声の黄金の鎧となる！`,
      });
    }

    // Korean career
    let situationLead = '일터에서 네 자리를 지키고 성과를 증명해야 하니 어깨가 천 근 만 근 무겁겠지.';
    let actionTactic = '윗사람이나 동료들의 불필요한 참견에 발끈하지 마라. 독선은 경계하되 네 전문성만큼은 양보 없이 밀어붙여라.';

    if (/이직|퇴사|면접|스카우트/.test(p)) {
      situationLead = '새로운 터전으로 칼을 갈아 면접관들 앞에 서야 하니 심장이 쿵쾅거리고 피가 마를 게다.';
      actionTactic = '성급하게 칼을 뽑지 말고 조건을 냉정하게 따져라. 면접 자리에서는 양인의 당당함으로 판을 장악하되 오만함은 감춰라.';
    } else if (/보고|발표|프레젠테이션|pt/.test(p)) {
      situationLead = '사람들 앞에 서서 네 실력을 만천하에 드러내야 하니 긴장될 테지.';
      actionTactic = '수식어는 다 쳐내고 숫자가 담긴 핵심 결론부터 던져라. 논리가 서슬 퍼럴 때 청중의 기립박수가 터진다.';
    } else if (/상사|팀장|동료|부하|정치/.test(p)) {
      situationLead = '사내 인간관계와 윗사람 눈치에 속이 터져 한판 엎어버리고 싶은 충동이 일었겠어.';
      actionTactic = '사내 정치의 구설수에 휘말리지 마라. 오직 문서와 결과물로만 발언하고 묵묵히 네 진지를 지켜라.';
    }

    return cleanStrategy({
      headline: defaultHeadline,
      strategyText:
        `내일은 직장에서 네 내공이 만천하에 드러나는 ${omen.stemGod}의 시험대다! ` +
        `${situationLead} 잡생각을 버리고 오직 압도적인 결과물로만 증명해라. ` +
        `${actionTactic} 내일 흘린 땀방울 하나가 네 승진과 평판의 황금 갑옷이 된다!`,
    });
  }

  // 5. 🌿 [건강 (Health)]
  if (category === 'health') {
    if (isJa) {
      let situationLead = 'すり減らした肉体が悲鳴を上げているにもかかわらず、息つく暇もなく一日を耐え忍び、崖っぷちに立っているのだな。';
      let actionTactic = '刺激の強い食事やカフェインを断ち、冷水と白銀の金気の気を近くに置け。';

      if (/잠|수면|불면|피로|만성|睡眠|不眠|疲労|倦怠感/.test(p)) {
        situationLead = '夜になっても頭の熱が冷めず、寝返りを打ちながら睡眠不足の泥沼に足を取られているのだろう。';
        actionTactic = '寝床に入る1時間前から電子機器の光を断て。ぬるめの湯で熱気を鎮め、暗闇の中で息を整えろ。';
      } else if (/두통|어지럼|혈압|가슴|심장|頭痛|めまい|血圧|動悸|心臓/.test(p)) {
        situationLead = 'こめかみがズキズキと痛み、胸が詰まって深呼吸すらままならぬのだな。';
        actionTactic = '激しい運動や怒りの感情を避けよ。首筋に冷たいタオルを当て、熱気を下半身へ降ろせ。';
      } else if (/위장|소화|속쓰림|식사|胃腸|消化|胃もたれ|食事/.test(p)) {
        situationLead = '胃が痛み、内臓が軋んで飯の一粒も喉を通らぬほど気力が枯れ果てているのだな。';
        actionTactic = '刺激物を固く禁じ、消化に良い温かい粥や白湯で胃腸の熱毒を鎮めよ。';
      }

      return cleanStrategy({
        headline: defaultHeadline,
        strategyText:
          `体が崩れれば天下の名誉も黄金も水の泡だ！ ${situationLead} ` +
          `明日の${ganjiText}の日は、猛烈な火気が立ち上り、心血管、血圧、偏頭痛や胸の詰まりが再発しやすい。 ` +
          `${actionTactic} 明日の夜は湯船に浸かり、早々に明かりを消せ。肉体を律してこそ、次なる刃を振るうことができるのだ！`,
      });
    }

    // Korean health
    let situationLead = '갈아 넣은 육신이 비명을 지르는데도 쉴 틈 없이 하루를 버텨내느라 벼랑 끝에 서 있구나.';
    let actionTactic = '매운 음식과 카페인을 멀리하고, 찬물과 은빛 쇠(金) 기운을 가까이해라.';

    if (/두통|편두통|혈압|어지럼/.test(p)) {
      situationLead = '머리가 깨질 듯 지끈거리고 가슴이 답답해 숨을 헐떡였겠구나.';
      actionTactic = '치솟는 열기로 머리 쪽에 화(火)가 고였으니 관자놀이를 찬물로 식히고 카페인을 단칼에 끊어라.';
    } else if (/잠|불면|수면|피로|야근/.test(p)) {
      situationLead = '밤새 뒤척이며 잠 못 이루고 갈아 넣은 육신이 비명을 지르는데도 악으로 버티고 있구나.';
      actionTactic = '자기 전 스마트폰 화면을 끄고 미지근한 물에 발을 담가라. 뇌의 불길을 식혀야 깊은 잠이 든다.';
    } else if (/위장|소화|속쓰림|식사/.test(p)) {
      situationLead = '속이 쓰리고 위장이 뒤틀려 밥 한술 제대로 넘기지 못할 정도로 기운이 메말랐어.';
      actionTactic = '자극적인 음식을 금하고 담백한 밥과 따뜻한 보리차로 위장의 열독을 가라앉혀라.';
    }

    return cleanStrategy({
      headline: defaultHeadline,
      strategyText:
        `몸이 무너지면 천하의 명예와 황금도 물거품이다! ${situationLead} ` +
        `내일 ${ganjiText} 날은 한낮의 맹렬한 불(火) 기운이 솟구쳐 심혈관, 혈압, 편두통과 가슴 답답증이 도지기 쉽다. ` +
        `${actionTactic} 내일 밤은 온탕에 몸을 담그고 일찍 불을 꺼라. 몸을 다스려야 다음 주의 칼날을 휘두를 수 있다!`,
    });
  }

  // 기본 fallback
  if (isJa) {
    return cleanStrategy({
      headline: defaultHeadline,
      strategyText:
        `明日は${ganjiText}の日、${formatGod(omen.stemGod, true)}と${formatShinsal(shinsalMain, true)}の気が激動する！己の意志のみを信じ、迷いなく世を切り拓け！`,
    });
  }

  return cleanStrategy({
    headline: defaultHeadline,
    strategyText:
      `내일은 ${ganjiText} 날, ${omen.stemGod}과 ${shinsalMain}의 기운이 요동친다! 네 심지 하나 믿고 거침없이 세상을 베어라!`,
  });
}

/** 3초 오행 정산 후 메인 카드 [오늘의 열쇠]에 반영될 동적 구어체 신점 해단 (3단계 심층 장문 서사) */
export function generateTodayCustomAdvice(
  emotion: string,
  event: string,
  memo?: string
): { keyword: string; fortuneText: string } {
  const m = memo?.trim() ?? '';
  const keyword = `${emotion}化の精算`;

  // 1단계 [폐부 통찰] 풀
  let introList: string[] = [];

  if (/어려|힘들|지치|피곤|외롭|눈물|슬프|버티|포기|서럽|아프|무겁|한숨|우울|벅차|고단|번아웃/.test(m)) {
    introList = [
      '문턱을 넘어 들어서는 발소리부터 숨이 턱 끝까지 차오른 기색이 완연하구나. 남들 앞에서는 태연한 척 웃음을 지었을지 몰라도, 네 눈빛 안쪽에 시커멓게 엉겨 붙은 그 지독한 피로와 허망함까지 내 눈을 속일 수는 없다. 어디 한 곳 마음 편히 기댈 언덕도 없이, 밑 빠진 독에 제 살을 깎아 넣듯 홀로 버텨온 시간들이 얼마나 모질고 서러웠겠느냐.',
      '남들은 네가 무던하고 속 편한 줄 알겠지만, 네 속은 이미 시커멓게 타들어 간 숯검정이 아니더냐. 겉으로는 웃으며 비위를 맞추고 뒤에서는 삭여낸 한숨이 바다를 이루었을 텐데, 아무도 네 텅 빈 등을 쓸어내려 주지 않았을 게다. 남의 짐까지 덤터기 쓰고 네 뼈마디가 닳도록 버텨온 세월의 무게가 참으로 안쓰럽고 먹먹하구나.',
      '너는 참으로 모질도록 네 자신을 혹사시켜 왔다. 남의 작은 섭섭함은 귀신같이 알아채고 맞춰주면서, 정작 제 속이 진물 나도록 곪아 터지는 것은 모른 체 외면했지. 이 악물고 버티는 것만이 어른인 줄 알고 견뎌온 네 억척스러움이 이제는 네 숨통을 쥐어짜고 있는 것이다.',
    ];
  } else if (/화|짜증|열받|분노|억울|배신|싸움|다툼|상사|팀장|거래처|사기|답답|욕|들이받/.test(m)) {
    introList = [
      '네 가슴팍에 시퍼렇게 맺힌 그 독기와 피멍을 내 어찌 모를까. 정직하게 땀 흘린 대가는 온데간데없고, 얄팍한 입놀림으로 공을 가로채는 자들 틈바구니에서 얼마나 분통이 터지고 속이 뒤집어졌겠느냐. 내색조차 못 하고 밤마다 홀로 주먹을 쥐었다 폈을 네 억울함이 이 방안을 가득 메우고 있다.',
      '치밀어 오르는 분통과 억울함을 꾹꾹 눌러 삼키느라 가슴팍에 시커먼 피멍이 들었구나! 네 죄도 아닌데 독박을 쓰고 그 분을 참아내느라 얼마나 속이 뒤집어졌겠느냐. 남의 죗값을 왜 네가 대신 앓고 있느냔 말이다. 삼킨 피눈물이 목구멍을 틀어막았을 네 분노가 서슬 퍼렇게 느껴진다.',
      '믿었던 도끼에 발등을 찍히고 사람의 간사한 민낯을 보며 치가 떨렸을 게다. 앞에서 웃던 낯짝들이 등 뒤에서 칼을 꽂는 꼴을 지켜보며, 세상에 기댈 놈 하나 없다는 고독과 배신감이 네 뼛속까지 시리게 파고들었을 테지.',
    ];
  } else if (/돈|지출|빚|월급|통장|계좌|단가|비용|정산|손해|투자|주식|코인/.test(m)) {
    introList = [
      '피 같은 돈 때문에 머리털이 쭈뼛 서고 계산기 두드리느라 속이 바짝 타들어갔구나. 옹졸해서가 아니라 피땀 흘려 번 결실이기에 한 푼이라도 헛되이 샐까 봐 신경이 곤두선 그 치열함이 가슴을 친다. 곳간이 말라붙을까 전전긍긍하며 밤마다 식은땀을 흘렸을 네 고단함이 훤히 보인다.',
      '새는 구멍을 막아보려 발버둥 쳐도 밑 빠진 독처럼 줄줄 새어 나가는 재물에 억장이 무너졌을 테지. 정직하게 일한 대가는 손에 쥐어지지도 않고 남 좋은 일만 시킨 것 같아 밤잠을 설치며 주판알을 튕기던 네 막막함이 내 눈을 찌른다.',
    ];
  } else if (/고민|선택|갈등|결정|어쩌|막막|불안|앞날|혼란|진로/.test(m)) {
    introList = [
      '갈림길에 서서 짙은 안개 속을 헤매느라 머리가 터질 듯 복잡했겠구나. 이쪽으로 가자니 벼랑이고 저쪽으로 가자니 가시밭길 같아 가슴을 졸이며 주판알을 튕기던 그 막막함이 훤하다. 아무도 확실한 답을 주지 않고 세상은 너더러 알아서 살아남으라 떠밀기만 했으니 얼마나 외로웠겠느냐.',
      '벼랑 끝에 선 심정으로 한 걸음 한 걸음 살얼음판을 딛듯 여기까지 걸어왔구나. 머리는 쥐어뜯길 듯 복잡하고 가슴은 답답해 숨조차 제대로 쉬어지지 않는데, 세상은 너더러 더 달려라 채찍질만 해댔을 테지. 제 몫을 다하고도 죄인처럼 숨죽여 울던 네 고단함이 뼛속까지 시리게 전해져 온다.',
    ];
  } else {
    if (/직장|생존|work/.test(event)) {
      introList = [
        '오늘 일터에서 윗사람 눈치 보랴 쏟아지는 업무 쳐내랴 숨 쉴 틈도 없이 시달렸구나. 속에서 천불이 나도 겉으로는 입술을 깨물며 버텨냈을 네 인내의 무게가 참으로 무겁고 먹먹하다.',
        '남의 밥그릇 밑에서 제 살을 깎아 바치며 살아남으려 발버둥 친 하루였을 게다. 칭찬 한마디는커녕 트집 잡히지 않으려 온 신경을 곤두세우느라 너덜너덜해진 네 영혼이 안쓰럽구나.',
      ];
    } else if (/돈|지출|money/.test(event)) {
      introList = [
        '오늘 돈 나갈 곳만 보이고 곳간을 지키느라 속이 까맣게 탔겠어. 피땀 흘려 번 결실이기에 한 푼도 허투루 샐까 봐 신경이 곤두선 네 치열한 분투를 내가 안다.',
      ];
    } else if (/치정|바람|관계|relation/.test(event)) {
      introList = [
        '오늘 사람 속에서 치이고 부대끼며 겉웃음 짓느라 속은 진물이 흐르도록 곪았을 게다. 믿었던 마음에 상처를 입고도 차마 내색 못 한 채 삭여낸 네 고독이 가슴을 친다.',
      ];
    } else {
      introList = [
        '오늘 이러지도 저러지도 못하는 마음의 파도에 휩쓸려 갈피를 잡지 못하고 기운을 소진했구나. 어디로 튈지 모르는 세상에서 네 중심을 지켜내느라 참으로 애 많이 썼다.',
      ];
    }
  }

  // 2단계 [오행·기운 해단] 풀
  const analysisList = [
    '오늘 들어온 일진을 보아라. 하늘에는 서슬 퍼런 칠살(七殺)의 쇳소리가 울리고 땅바닥에는 메마른 불길이 치솟아 네 사주의 여린 심지를 거칠게 흔들어 놓았다. 네가 못나서 부침을 겪은 것이 아니다. 오행의 상극이 맹렬하게 부딪치며 불순물을 태워 없애고 순도 높은 강철로 담금질하는 형국이니, 운명의 결이 커다란 고개를 넘으며 제 살을 에어내고 있을 뿐이다.',
    '네 사주에 본디 품은 맑은 수기(水氣)가 오늘 들어온 탁한 토기(土氣)에 가로막혀 갈 길을 잃고 소용돌이쳤기 때문이다. 편관의 억압이 짓누르고 상관의 반골 기질이 치받으니, 속에서는 천불이 나고 머리는 터질 듯 혼란스러울 수밖에 없었다. 허나 명심해라. 흙탕물이 거세게 일렁이는 것은 새로운 물길을 터서 더 큰 바다로 나아가기 위한 전조에 불과하다.',
    '이것은 기운이 흩어지는 파재(破財)의 액운이 아니라, 오히려 묵은 허물을 벗겨내는 천간(天干)의 매서운 정화 과정이다. 네 심지에 과도하게 몰렸던 화기(火氣)가 지지의 금(金)을 녹이며 신경을 곤두서게 만들었으니, 사람에게 치이고 말 한마디에 피가 마르는 것은 당연한 이치다. 쇠는 뜨거운 모루 위에서 수천 번 두들겨 맞아야 비로소 명검으로 거듭나는 법이다.',
    '사주팔자의 수레바퀴에서 흉신(凶神)이 지나가는 길목에 서면 누구라도 사방이 꽉 막힌 벽처럼 느껴지는 법이다. 비겁(比劫)의 시기와 질투가 네 어깨를 짓누르고, 식신(食神)의 빛이 잠시 그늘에 가려져 네 진심이 왜곡되었을 뿐이다. 하늘이 너를 망하게 하려고 이 풍파를 보낸 것이 아니다. 오만하고 간사한 인간들을 솎아내고 네 본령을 단단히 세우라는 천기(天氣)의 신호다.',
    '오늘 일진의 기운은 양기가 지나치게 치솟아 음기의 휴식을 침범한 형국이다. 바닥까지 방전된 네 오행의 배터리에 억지로 시동을 걸었으니 삐걱거리는 것이 순리다. 세상만사 모든 순환에는 겨울의 동면이 필요한 법인데, 너는 사계절 내내 여름처럼 타오르려 했으니 이제 운때가 네 걸음을 강제로 멈춰 세운 것이다.',
  ];

  // 3단계 [단호한 비책] 풀
  const prescriptionList = [
    '공허한 위로 따위는 집어치우고 당장 오늘 밤부터 행동을 고쳐 잡아라. 문에 빗장을 걸어 잠그고 휴대폰은 손 닿지 않는 구석으로 내던져라. 남의 안부나 세상의 소음에 귀 기울이지 말고 네 거친 숨소리부터 고르게 가라앉혀라. 내일 아침 문을 나설 때는 누구에게도 네 약한 기색을 보이지 말고, 차가운 물 한 잔으로 속을 달랜 뒤 거절해야 할 부탁은 칼로 자르듯 단호하게 끊어내라.',
    '오늘 밤은 잘잘못을 따지는 생각의 꼬리를 당장 가위질해라. 억울한 사연을 곱씹어봤자 네 명줄만 갉아먹는다. 내일 날이 밝으면 일터에서 네 몫이 아닌 일에는 단 한 뼘도 손대지 마라. 어설픈 친절은 독이 되고 상냥함은 만만한 먹잇감이 될 뿐이다. 등 뒤에서 수군거리는 잡것들의 말에는 대꾸도 하지 말고 네 갈 길만 묵묵히 걸어가라.',
    '지금 네게 필요한 것은 값싼 동정이 아니라 냉철한 결단이다. 오늘 밤은 따뜻한 온수로 묵은 피로를 씻어내고 머리맡에 잡동사니를 치워 머리를 북쪽으로 뉘어라. 그리고 내일 마주칠 인간관계에서는 네 패를 먼저 보여주지 마라. 입은 무겁게 닫고 눈빛은 서늘하게 유지하며, 네 이익과 권리를 침범하는 자에게는 한 치의 양보도 없이 단호한 쐐기를 박아라.',
    '더 이상 밑 빠진 독에 네 정성을 쏟아붓지 마라. 오늘 밤은 스스로에게 주는 마지막 한숨을 길게 토해내고 일찍 불을 꺼라. 내일 해가 뜨면 너를 갉아먹는 관계의 끈부터 가차 없이 끊어내야 한다. 네가 단호해지지 않으면 세상은 너를 계속 벼랑 끝으로 몰 것이다. 네 심지의 불꽃을 지키는 것은 오직 네 자신의 매서운 결기뿐이다.',
    '오늘 겪은 수모와 피로는 오늘 밤 자정에 묻어버려라. 내일은 하늘의 판도가 바뀌는 날이다. 일터든 집이든 네 영역을 침범하려는 자가 있다면 한마디 군더더기 없이 서슬 퍼런 침묵으로 제압해라. 너는 굽실거릴 처지가 아니며, 네 실력과 내공으로 세상과 정면 승부할 때 비로소 판이 뒤집힌다.',
  ];

  const pickRand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const p1 = pickRand(introList);
  const p2 = pickRand(analysisList);
  const p3 = pickRand(prescriptionList);

  const rawFortune = `${p1}\n\n${p2}\n\n${p3}`;
  const fortuneText = rawFortune.replace(/\([^)]*\)/g, '').trim();

  return {
    keyword,
    fortuneText,
  };
}
