import type { EarthlyBranch, FiveElement, HeavenlyStem, SajuResult } from './types';
import type { PartnerRadarResult, RadarLevel } from './partnerRadar';
import { getPeachTargets } from './partnerRadar';
import { getActiveLanguage } from '../utils/langManager';

export interface PrescriptionSection {
  key: string;
  title: string;
  lines: string[];
}

export interface PartnerPrescription {
  title?: string;
  prescriptionLabel?: string;
  sections: PrescriptionSection[];
  actions: string[];
  verdict: string;
}

export const PRESCRIPTION_LABEL_KO = '사이버동자 처방';
export const PRESCRIPTION_LABEL_JA = 'サイバー神童処方';

type PillarKey = 'year' | 'month' | 'day' | 'time';

const BRANCH_KO: Record<EarthlyBranch, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

const BRANCH_MONTH: Record<EarthlyBranch, number> = {
  寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11, 子: 12, 丑: 1,
};

const CLASH: Record<EarthlyBranch, EarthlyBranch> = {
  子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅',
  卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳',
};

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  甲: 'Wood', 乙: 'Wood', 丙: 'Fire', 丁: 'Fire', 戊: 'Earth',
  己: 'Earth', 庚: 'Metal', 辛: 'Metal', 壬: 'Water', 癸: 'Water',
};

const PILLAR_MEANING: Record<PillarKey, { name: string; meaning: string }> = {
  year: { name: '년지', meaning: '밖에서 받는 시선. 처음 만나는 사람들이 먼저 이 사람에게 눈길을 줍니다.' },
  month: { name: '월지', meaning: '일터와 모임 자리. 직장·사회 활동 속에서 호감이 오가는 구조입니다.' },
  day: { name: '일지', meaning: '배우자 자리. 이 사람의 가장 속 깊은 마음이 사는 방이라, 여기에 도화가 들면 흔들림이 곧 속마음입니다.' },
  time: { name: '시지', meaning: '숨겨 둔 마음의 자리. 겉으로는 말하지 않는 끌림이 밤과 혼자 있는 시간에 올라옵니다.' },
};

const ELEMENT_TRAIT: Record<FiveElement, { who: string; leak: string }> = {
  Wood: { who: '곧게 뻗는 나무 같은 사람', leak: '답답하면 말없이 바깥으로 가지를 뻗습니다' },
  Fire: { who: '불꽃처럼 감정이 앞서는 사람', leak: '식은 만큼 빠르게 다른 불을 찾습니다' },
  Earth: { who: '묵직하게 눌러 담는 사람', leak: '말은 안 해도 마음은 조용히 이사를 갑니다' },
  Metal: { who: '칼처럼 선이 분명한 사람', leak: '한 번 선을 그으면 뒤도 안 보고 정리합니다' },
  Water: { who: '물처럼 스며드는 사람', leak: '눈에 안 띄게 흘러 다른 곳에 고입니다' },
};

const PILLAR_ORDER: readonly PillarKey[] = ['year', 'month', 'day', 'time'];

interface LevelCopy {
  contactPattern: string[];
  actions: string[];
  verdict: string;
}

const LEVEL_COPY: Record<RadarLevel, LevelCopy> = {
  안정: {
    contactPattern: [
      '연락이 끊기는 건 딴 사람이 생겨서가 아니라 마음이 식어서입니다. 이 사주는 바람보다 무관심이 먼저 옵니다.',
      '답장이 짧아지고 안부가 사라지면 그게 신호입니다. 변명이 늘어나는 게 아니라 말수가 줄어듭니다.',
    ],
    actions: [
      '의심부터 하지 말고 표현을 늘리세요. 이 사람은 감시가 아니라 방치에 무너집니다.',
      '한 달에 한 번은 단둘이 하는 일정을 못 박으세요. 약속이 있어야 마음이 머뭅니다.',
      '서운한 건 그날 말하세요. 쌓아 두면 이 사주는 말없이 정리합니다.',
    ],
    verdict: '칼날이 밖을 향한 사주가 아닙니다. 지킬 건 이 사람이 아니라 둘 사이의 온도입니다. 온도만 지키면 갈 사람은 안 갑니다.',
  },
  주의: {
    contactPattern: [
      '시선을 받는 일이 잦아서 본인은 가볍게 넘기는데, 상대는 그 가벼움에서 틈을 봅니다.',
      '갑자기 약속이 늘고, 휴대폰을 엎어 두고, 모임 이야기가 모호해지면 마음이 한쪽으로 기운 겁니다. 아직 선은 안 넘었습니다.',
      '해명이 빠른 날보다 해명이 매끄러운 날을 조심하세요. 준비된 말은 숨기고 싶은 게 있다는 뜻입니다.',
    ],
    actions: [
      '캐묻지 말고 한 번만 가볍게 짚으세요. 두 번째부터는 상대가 숨는 법을 배웁니다.',
      '위험한 달에는 일정을 함께 잡아 단둘이 있는 시간을 먼저 선점하세요.',
      '내 쪽에서 불안을 드러내지 마세요. 흔들리는 쪽이 지는 구조입니다. 대신 매력은 내 쪽에서 올리세요.',
    ],
    verdict: '문은 열려 있는데 아직 안 나간 사람입니다. 붙잡는 힘이 아니라 이 집이 더 따뜻하다는 느낌이 이 사람을 앉힙니다.',
  },
  경계: {
    contactPattern: [
      '도화가 겹겹이 깔린 사주라 본인이 가만히 있어도 사람이 붙습니다. 문제는 거절하지 않는 날이 오면 그때부터 샌다는 겁니다.',
      '답장이 늦어지고, 만난 사람 이야기를 얼버무리고, 갑자기 외모와 향에 신경 쓰기 시작하면 이미 마음이 한 발 걸쳐 있습니다.',
      '아니라고 세게 말하는 날이 제일 위험합니다. 이 사주는 켕기는 게 있을수록 화부터 냅니다.',
    ],
    actions: [
      '증거를 쫓지 마세요. 쫓을수록 이 사람은 더 깊이 숨습니다. 대신 일정과 동선을 자연스럽게 공유하는 규칙부터 만드세요.',
      '위험한 달에는 내가 먼저 곁에 있으세요. 같이 있는 시간이 이 사주의 유일한 방어선입니다.',
      '선을 넘었는지 확인하는 것보다, 선을 넘고 싶게 만든 빈틈이 무엇인지 먼저 보세요. 거기를 메우는 게 처방입니다.',
    ],
    verdict: '타고난 도화를 없앨 수는 없습니다. 다스릴 수 있는 건 환경입니다. 틈을 주지 않는 쪽이 이깁니다. 이 사람은 믿음의 문제가 아니라 구조의 문제입니다.',
  },
};

export const LEVEL_COPY_JA: Record<RadarLevel, LevelCopy> = {
  안정: {
    contactPattern: [
      '連絡が途絶えるのは、別の相手ができたからではなく、心が冷めてしまったからです。この命式は浮気よりも無関心が先に訪れます。',
      '返信が短くなり近況を尋ねる言葉が消えたら、それが危険信号です。言い訳が増えるのではなく口数が減っていきます。',
    ],
    actions: [
      '疑うことから始めず、愛情表現を増やしてください。この人は監視ではなく放置によって崩れます。',
      '月に一度は二人きりの予定を確定させてください。約束があってこそ心が留まります。',
      '寂しいことや不満はその日のうちに伝えてください。溜め込むとこの人は何も言わずに整理します。',
    ],
    verdict: '刃が外に向いている命式ではありません。守るべきはこの人ではなく二人の間の温度です。温度さえ保てば、去る人はいません。',
  },
  주의: {
    contactPattern: [
      '視線を浴びることが多いため本人は軽く流しますが、相手はその軽さの中に隙を見出します。',
      '急に予定が増え、スマホを伏せて置き、集まりの話を曖昧にし始めたら心が片方に傾いた証拠です。まだ一線は越えていません。',
      '言い訳が早い日よりも、説明が滑らかすぎる日に警戒してください。準備された言葉は隠したいことがある証です。',
    ],
    actions: [
      '問い詰めるのではなく、一度だけ軽く指摘してください。二度目からは相手が隠れる術を覚えます。',
      '危険な月には二人きりの予定を先に入れて、一緒に過ごす時間を確保してください。',
      'こちらから不安を表に出さないでください。動揺した側が主導権を失う構造です。代わりに自分の魅力を高めてください。',
    ],
    verdict: '扉は開いていますが、まだ外に出てはいない人です。繋ぎ止める力ではなく、この家庭が温かいという実感こそがこの人を留まらせます。',
  },
  경계: {
    contactPattern: [
      '桃花が重なる命式のため、本人がじっとしていても人が寄ってきます。問題は断らない日が訪れた瞬間、そこから心が漏れ出すことです。',
      '返信が遅れ、会った人の話を濁し、急に外見や香りに気を使い始めたら、既に心が片足を突っ込んでいます。',
      '「絶対に違う」と強く否定する日が一番危険です。この命式はやましいことがあるほど逆ギレします。',
    ],
    actions: [
      '証拠を追わないでください。追えば追うほどこの人は深く隠れます。代わりに予定や動線を自然に共有するルールを作ってください。',
      '危険な月には自分から側にいてください。共に過ごす時間こそが、この命式の唯一の防波堤です。',
      '一線を越えたか確認するより、一線を越えたくさせた心の隙間を見つめてください。そこを埋めることこそが真の処方です。',
    ],
    verdict: '生まれ持った桃花を消し去ることはできません。統御できるのは環境です。隙を与えない側が勝ちます。この人は信頼の問題ではなく構造の問題です。',
  },
};

export { LEVEL_COPY_JA as PRESCRIPTION_COPY_JA };

const ELEMENT_TRAIT_JA: Record<FiveElement, { who: string; leak: string }> = {
  Wood: { who: 'まっすぐ伸びる大樹のような人', leak: '息苦しさを感じると言葉もなく外へと枝を伸ばします' },
  Fire: { who: '炎のように感情が先立つ人', leak: '冷めた分だけ素早く別の火種を求めます' },
  Earth: { who: '重厚に胸の内へ溜め込む人', leak: '口には出さずとも心は静かに別の場所へと引っ越します' },
  Metal: { who: '刃のように境界線が明確な人', leak: '一度境界線を引いてしまうと、二度と振り返らずに冷徹に整理します' },
  Water: { who: '水のように染み込む人', leak: '目立たぬよう静かに流れ、別の水たまりへと溜まります' },
};

function partnerAliasJa(alias?: string | null): string {
  if (!alias) return '配偶者';
  if (alias === '배우자') return '配偶者';
  if (alias === '애인') return '恋人';
  if (alias === '썸') return '気になる人';
  if (alias === '짝사랑') return '片思いの相手';
  if (alias === '전연인' || alias === '전애인') return '元恋人';
  if (alias === '친구') return '友人';
  if (alias === '동료') return '同僚';
  return alias;
}

function formatMonths(months: number[]): string {
  return months.map((m) => `${m}월`).join(' · ');
}

function formatMonthsJa(months: number[]): string {
  return months.map((m) => `${m}月`).join('・');
}

/**
 * 상대 사주와 딴마음 지수로 사이버동자(サイバー神童) 심층 처방 리포트를 만든다.
 * 도화 위치, 위험한 달(도화 달 + 배우자 자리를 치는 달), 연락 패턴, 행동 강령을 모두 로컬 규칙으로 구성한다.
 */
export function buildPartnerPrescription(
  saju: SajuResult,
  radar: PartnerRadarResult,
  alias: string,
  year: number = new Date().getFullYear(),
  lang?: string
): PartnerPrescription {
  const effectiveLang = lang ?? (getActiveLanguage() === 'jp' ? 'jp' : 'kr');
  const isJa = effectiveLang === 'jp' || effectiveLang === 'ja';
  const targets = getPeachTargets(saju);
  const targetNames = isJa ? [...targets].join('・') : [...targets].map((b) => `${BRANCH_KO[b]}`).join('·');
  const element = STEM_ELEMENT[saju.dayMaster];
  const trait = ELEMENT_TRAIT[element];

  const peachPillars = PILLAR_ORDER.filter((key) => targets.has(saju.pillars[key].branch));
  const dayBranch = saju.pillars.day.branch;

  let peachLines: string[];
  if (isJa) {
    const aliasJa = partnerAliasJa(alias);
    const traitJa = ELEMENT_TRAIT_JA[element] || ELEMENT_TRAIT_JA.Metal;
    peachLines = [
      `${aliasJa}様は${traitJa.who}です。桃花を司る地支は${targetNames}ですが、四柱推命の4つの柱のうち${radar.peachCount}箇所にこの気運が巡っています。`,
    ];
    if (peachPillars.length === 0) {
      peachLines.push('桃花の地支が命式内に直接鎮座しているわけではありません。異性の視線は生まれつきというより、置かれた環境や振る舞いによって惹きつけられるタイプです。');
    } else {
      const pillarMeaningJa: Record<PillarKey, { name: string; meaning: string }> = {
        year: { name: '年柱地支', meaning: '外の世界からの視線。初対面の人々がまずこの人に惹きつけられます。' },
        month: { name: '月柱地支', meaning: '仕事場や社会的な集まり。職場・社会活動の中で自然と好意が交わされる構造です。' },
        day: { name: '日柱地支', meaning: '配偶者の座。この人の最も深い本心が宿る場所であり、ここに桃花が入ると心の揺らぎが直ちに本音へと直結します。' },
        time: { name: '時柱地支', meaning: '秘めたる心の座。普段は表に出さない魅力が夜や一人の時間に現れます。' },
      };
      peachPillars.forEach((key) => {
        const info = pillarMeaningJa[key];
        peachLines.push(`${info.name}(${saju.pillars[key].branch})に桃花が座しています。${info.meaning}`);
      });
    }
    peachLines.push(
      radar.charmCount >= 2
        ? `子・午・卯・酉の魅力地支が${radar.charmCount}個あり、言葉遣いや雰囲気だけで人を惹きつけます。本人が意図せずとも魅力を放ちます。`
        : `子・午・卯・酉の魅力地支は${radar.charmCount}個と多くありません。惹きつける力があるとしても、外見より関係が深まってから現れるタイプです。`
    );
  } else {
    peachLines = [
      `${alias}님은 ${trait.who}입니다. 도화로 보는 지지는 ${targetNames}인데, 사주 네 자리 중 ${radar.peachCount}곳에 이 기운이 들어와 있습니다.`,
    ];
    if (peachPillars.length === 0) {
      peachLines.push('도화 지지가 사주 안에 직접 앉아 있지는 않습니다. 이성의 시선은 타고난 게 아니라 환경이 만들어 주는 쪽입니다.');
    } else {
      peachPillars.forEach((key) => {
        const info = PILLAR_MEANING[key];
        peachLines.push(`${info.name}(${BRANCH_KO[saju.pillars[key].branch]})에 도화가 앉았습니다. ${info.meaning}`);
      });
    }
    peachLines.push(
      radar.charmCount >= 2
        ? `자·오·묘·유 매력 지지가 ${radar.charmCount}개라 말투와 분위기만으로도 사람을 끕니다. 본인이 의도하지 않아도 그렇습니다.`
        : `자·오·묘·유 매력 지지는 ${radar.charmCount}개로 많지 않습니다. 끌림이 있다면 겉모습보다 관계가 깊어진 뒤에 생기는 쪽입니다.`
    );
  }

  const peachMonths = new Set<number>();
  targets.forEach((b) => peachMonths.add(BRANCH_MONTH[b]));
  const clashMonth = BRANCH_MONTH[CLASH[dayBranch]];
  const peachList = [...peachMonths].sort((a, b) => a - b);
  const allRisk = [...new Set([...peachList, clashMonth])].sort((a, b) => a - b);

  let timingLines: string[];
  if (isJa) {
    timingLines = [
      `${year}年基準、この人の心が外に向きやすい月は${formatMonthsJa(allRisk)}です。暦の月を基準とした目安であり、節入りによって数日の差が生じます。`,
      `${formatMonthsJa(peachList)}は桃花の気運が巡る月であり、新たな出会いや好奇心が刺激されます。`,
      `${clashMonth}月は配偶者の座(${dayBranch})を正面から冲(衝突)する月です。この人の胸の内が最も波立つ時期であり、些細な口論が別れ話にまで発展しやすいので注意が必要です。`,
      `その他の月は比較的平穏です。警戒すべき月に集中して絆を深めてください。`,
    ];
  } else {
    timingLines = [
      `${year}년 기준, 이 사람 마음이 바깥으로 올라오는 달은 ${formatMonths(allRisk)}입니다. 달력 월 기준 대략의 시기이며 절기에 따라 며칠 차이가 납니다.`,
      `${formatMonths(peachList)}은 도화 기운이 드는 달이라 새로운 만남과 호기심이 붙습니다.`,
      `${clashMonth}월은 배우자 자리(${BRANCH_KO[dayBranch]})를 정면으로 치는 달입니다. 이 사람 속이 가장 시끄러운 시기라 사소한 말다툼이 이별 이야기까지 번지기 쉽습니다.`,
      `그 밖의 달은 비교적 잠잠합니다. 위험한 달에만 힘을 모으세요.`,
    ];
  }

  const contactLines: string[] = isJa
    ? [
        ...LEVEL_COPY_JA[radar.level].contactPattern,
        `心が離れ始め、${ELEMENT_TRAIT_JA[element]?.leak ?? '一度境界線を引いてしまうと、二度と振り返らずに冷徹に整理します'}。`,
      ]
    : [
        ...LEVEL_COPY[radar.level].contactPattern,
        `마음이 움직이기 시작하면 ${trait.leak}.`,
      ];

  const sections: PrescriptionSection[] = [
    { key: 'peach', title: isJa ? '桃花分析・この人の魅力構造' : '도화 분석 · 이 사람의 끌림 구조', lines: peachLines },
    { key: 'timing', title: isJa ? '浮気心・気の迷いが生じる時期' : '딴마음이 올라오는 시기', lines: timingLines },
    { key: 'pattern', title: isJa ? '連絡が途絶えがちになるパターン' : '연락이 뜸해지는 패턴', lines: contactLines },
  ];

  const actions = isJa
    ? LEVEL_COPY_JA[radar.level].actions
    : LEVEL_COPY[radar.level].actions;

  const verdict = isJa
    ? LEVEL_COPY_JA[radar.level].verdict
    : LEVEL_COPY[radar.level].verdict;

  const prescriptionLabel = isJa ? PRESCRIPTION_LABEL_JA : PRESCRIPTION_LABEL_KO;
  const prescriptionTitle = isJa ? `${PRESCRIPTION_LABEL_JA}・自分から実践すべき3つの行動` : `${PRESCRIPTION_LABEL_KO} · 내가 먼저 할 행동 3가지`;

  return {
    title: prescriptionTitle,
    prescriptionLabel,
    sections,
    actions,
    verdict,
  };
}
