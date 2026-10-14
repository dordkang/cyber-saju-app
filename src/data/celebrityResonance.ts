/**
 * [CYBER-SAJU] 영혼의 공명(Soul Frequency Matrix) 셀럽 공명 DB 및 매칭 엔진
 * (src/data/celebrityResonance.ts)
 * 
 * - 한·일·글로벌 레전드 인물 10인 정밀 데이터셋
 * - kr / jp 언어 완벽 분리 (일본어 모드에서 한국어 0% 보장)
 * - 정중한 경어체(~합니다 / です・ます調) 및 사용자 닉네임 자동 치환
 */

import type { SajuResult, FiveElement, HeavenlyStem } from '../engine/types';

export type CelebrityCategory = 'tech' | 'business' | 'sports' | 'history';
export type SajuElementHanja = '木' | '火' | '土' | '金' | '水';

export interface CelebrityLocalizedText {
  kr: string;
  jp: string;
}

export interface CelebrityData {
  id: string;
  category: CelebrityCategory;
  element: SajuElementHanja;
  tenGod: CelebrityLocalizedText;
  baseFrequency: number; // 60 ~ 99
  emojiIcon: string;
  themeColor: string; // 네온 컬러
  glowColor: string;
  name: CelebrityLocalizedText;
  title: CelebrityLocalizedText;
  coreKeyword: CelebrityLocalizedText;
  resonanceMessage: CelebrityLocalizedText;
}

export interface CelebrityMatchItem {
  celebrity: CelebrityData;
  syncRate: number; // 60 ~ 99
  isBestMatch: boolean;
}

export interface CelebrityMatchResult {
  bestMatch: CelebrityMatchItem;
  allMatches: CelebrityMatchItem[];
}

/**
 * 10인의 레전드 셀럽 데이터셋 (kr & jp 완벽 분리)
 */
export const CELEBRITY_RESONANCE_DATASET: readonly CelebrityData[] = [
  // 1. 손정의 (Masayoshi Son)
  {
    id: 'masayoshi-son',
    category: 'business',
    element: '火',
    tenGod: {
      kr: '편관(偏官) 돌파형',
      jp: '偏官 突破型',
    },
    baseFrequency: 91,
    emojiIcon: '🚀',
    themeColor: '#FF3366',
    glowColor: 'rgba(255, 51, 102, 0.75)',
    name: {
      kr: '손정의',
      jp: '孫正義',
    },
    title: {
      kr: '소프트뱅크 창업자 / 시대의 승부사',
      jp: 'ソフトバンクグループ創業者 / 時代の勝負師',
    },
    coreKeyword: {
      kr: '거대한 패러다임 시프트를 꿰뚫어보는 과감한 돌파력',
      jp: '巨大なパラダイムシフトを見抜く圧倒的な突破力',
    },
    resonanceMessage: {
      kr: '${userName} 님, 거대한 시대의 파도가 칠 때 계산기를 내려놓고 본능적인 결단으로 미래를 거머쥐는 승부사의 기질을 공유하고 계십니다. 칠흑 같은 불확실성 속에서도 판세를 단숨에 뒤집는 강력한 편관(偏官)의 추진력과 비전이 두 사람의 운명을 관통합니다.',
      jp: '${userName}様、巨大な時代の潮流が訪れた時、電卓を捨て直感の決断で未来を掴み取る勝負師の気質を共有していらっしゃいます。先の見えない暗闇の中でも盤面を一変させる強力な偏官の推進力とビジョンが、お二人の運命を貫いています。',
    },
  },

  // 2. 오타니 쇼헤이 (Shohei Ohtani)
  {
    id: 'shohei-ohtani',
    category: 'sports',
    element: '木',
    tenGod: {
      kr: '양인(羊刃) · 식신(食神) 초격차 승부사',
      jp: '羊刃・食神 超格差の勝負師',
    },
    baseFrequency: 96,
    emojiIcon: '⚾',
    themeColor: '#00F5D4',
    glowColor: 'rgba(0, 245, 212, 0.75)',
    name: {
      kr: '오타니 쇼헤이',
      jp: '大谷翔平',
    },
    title: {
      kr: '메이저리그 슈퍼스타 / 이도류의 개척자',
      jp: 'メジャーリーグのスーパースター / 二刀流の開拓者',
    },
    coreKeyword: {
      kr: '불가능을 상식으로 바꾸는 극한의 규율과 초격차 실행력',
      jp: '不可能を常識に変える極限の規律と超格差の実行力',
    },
    resonanceMessage: {
      kr: '${userName} 님, 세상이 불가능하다고 말하는 경계를 비웃듯 오직 정밀한 루틴과 무서운 몰입으로 자신만의 역사를 쓰는 식신(食神)의 장인 정신을 닮으셨습니다. 타인의 평가에 휘둘리지 않고 내면의 이상을 현실로 증명해 내는 양인(羊刃)의 강인함이 함께합니다.',
      jp: '${userName}様、世間が不可能と決めつける限界を超え、緻密なルーティンと凄まじい没頭で自らの歴史を切り拓く食神の職人魂に通じていらっしゃいます。周囲の雑音に惑わされず、内なる理想を現実へと具現化する羊刃の強靭さを共有されています。',
    },
  },

  // 3. 일론 머스크 (Elon Musk)
  {
    id: 'elon-musk',
    category: 'tech',
    element: '土',
    tenGod: {
      kr: '상관(傷官) · 편재(偏財) 파괴적 혁신가',
      jp: '傷官・偏財 破壊的革新者',
    },
    baseFrequency: 98,
    emojiIcon: '⚡',
    themeColor: '#FF2A4B',
    glowColor: 'rgba(255, 42, 75, 0.75)',
    name: {
      kr: '일론 머스크',
      jp: 'イーロン・マスク',
    },
    title: {
      kr: '테슬라·스페이스X CEO / 화성을 향한 승부사',
      jp: 'テスラ・スペースX CEO / 火星を目指す革新者',
    },
    coreKeyword: {
      kr: '기존의 물리적·사회적 상식을 부수는 제1원리 파괴력',
      jp: '従来の常識や物理的制約を打ち破る第一原理の思考力',
    },
    resonanceMessage: {
      kr: '${userName} 님, 기존의 틀과 규칙에 안주하지 않고 본질에서부터 새 판을 짜버리는 상관(傷官)의 파괴적 천재성을 품고 계십니다. 자본과 파산의 벼랑 끝에서도 대담한 모험을 감행하며 세상을 재설계하는 편재(偏財)의 스케일이 깊이 공명합니다.',
      jp: '${userName}様、既成概念や既得権益の枠に安住せず、本質から新たな盤面を創出する傷官の破壊的独創性を宿していらっしゃいます。極限の危機の最中でも大胆な賭けに出て世界を再設計する偏財のスケールが深く共鳴しています。',
    },
  },

  // 4. 스티브 잡스 (Steve Jobs)
  {
    id: 'steve-jobs',
    category: 'tech',
    element: '火',
    tenGod: {
      kr: '상관(傷官) · 정인(印綬) 직관의 천재',
      jp: '傷官・印綬 直観の天才',
    },
    baseFrequency: 93,
    emojiIcon: '🍎',
    themeColor: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.75)',
    name: {
      kr: '스티브 잡스',
      jp: 'スティーブ・ジョブズ',
    },
    title: {
      kr: '애플 창업자 / 미학적 직관의 비전가',
      jp: 'Apple創業者 / 美的直感のビジョナリー',
    },
    coreKeyword: {
      kr: '본질만 남기고 군더더기를 베어내는 타협 없는 완벽주의',
      jp: '妥協なきシンプリシティと現実を再創造する直観力',
    },
    resonanceMessage: {
      kr: '${userName} 님, 타협 없는 미학적 기준과 군더더기를 가차 없이 깎아내는 정인(印綬)의 깊은 통찰력을 지니셨습니다. 시장 조사가 아니라 내면의 직관을 믿고 세상을 자신의 철학으로 끌어당기는 상관(傷官)의 비전이 강렬하게 일치합니다.',
      jp: '${userName}様、一切の妥協を許さない美的基準と、本質以外を削ぎ落とす印綬の深遠な洞察力を備えていらっしゃいます。市場調査ではなく内なる直感を信じ、自らの哲学へと世界を引き寄せる傷官のビジョンが見事に一致しています。',
    },
  },

  // 5. 워런 버핏 (Warren Buffett)
  {
    id: 'warren-buffett',
    category: 'business',
    element: '土',
    tenGod: {
      kr: '정재(正財) · 식신(食神) 복리의 제왕',
      jp: '正財・食神 複利の帝王',
    },
    baseFrequency: 82,
    emojiIcon: '📈',
    themeColor: '#FFB800',
    glowColor: 'rgba(255, 184, 0, 0.75)',
    name: {
      kr: '워런 버핏',
      jp: 'ウォーレン・バフェット',
    },
    title: {
      kr: '버크셔 해서웨이 회장 / 오마하의 현인',
      jp: 'バークシャー・ハサウェイ会長 / オマハの賢人',
    },
    coreKeyword: {
      kr: '시간과 복리를 내 편으로 만드는 흔들리지 않는 원칙주의',
      jp: '時間と複利を味方につける揺るぎなき原則主義',
    },
    resonanceMessage: {
      kr: '${userName} 님, 남들이 탐욕에 눈멀거나 공포에 질려 던질 때 홀로 태산처럼 냉정을 유지하는 정재(正財)의 내공을 타고나셨습니다. 조급함을 버리고 오랜 시간 정직한 신용과 복리의 법칙을 누적하여 거대한 성을 쌓는 식신(食神)의 현자입니다.',
      jp: '${userName}様、他人が強欲に駆られ恐慌に陥る時でも、泰然自若として冷徹さを保つ正財の底力を秘めていらっしゃいます。焦りを捨て、時間をかけて誠実な信用と複利の法則を積み上げ巨大な城を築く食神の賢者です。',
    },
  },

  // 6. 정주영 (Chung Ju-yung)
  {
    id: 'chung-ju-yung',
    category: 'business',
    element: '金',
    tenGod: {
      kr: '겁재(劫財) · 편관(偏官) 불굴의 개척자',
      jp: '劫財・偏官 不屈の開拓者',
    },
    baseFrequency: 86,
    emojiIcon: '🏗️',
    themeColor: '#E2E8F0',
    glowColor: 'rgba(226, 232, 240, 0.75)',
    name: {
      kr: '정주영',
      jp: '鄭周永 (チョン・ジュヨン)',
    },
    title: {
      kr: '현대그룹 창업주 / 불굴의 거목',
      jp: '現代グループ創業者 / 不屈の巨木',
    },
    coreKeyword: {
      kr: '"해보기나 했어?" 시련을 황금 갑옷으로 벼려내는 야성의 추진력',
      jp: '「やってみもせぬうちから諦めるな」 試練を糧とする野生の推進力',
    },
    resonanceMessage: {
      kr: '${userName} 님, "이봐, 해보기나 했어?"라는 일갈처럼 어떤 절벽 앞에서도 물러서지 않고 길을 만들어내는 겁재(劫財)의 야성을 지니셨습니다. 시련을 겪을수록 더욱 단단한 강철로 벼려지는 불굴의 편관(偏官) 카리스마가 당신의 뼈대에 깃들어 있습니다.',
      jp: '${userName}様、「やってみもせぬうちから諦めるな」という気迫の通り、いかなる断崖の前でも退かず道を切り拓く劫財の野性を宿していらっしゃいます。試練に直面するほど鋼のように鍛え上げられる不屈の偏官のカリスマが、骨身に宿っています。',
    },
  },

  // 7. 손흥민 (Son Heung-min)
  {
    id: 'son-heung-min',
    category: 'sports',
    element: '木',
    tenGod: {
      kr: '비견(比肩) · 식신(食神) 월드클래스 캡틴',
      jp: '比肩・食神 ワールドクラス主将',
    },
    baseFrequency: 95,
    emojiIcon: '⚽',
    themeColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.75)',
    name: {
      kr: '손흥민',
      jp: '孫興慜 (ソン・フンミン)',
    },
    title: {
      kr: '토트넘 홋스퍼 캡틴 / 월드클래스 피니셔',
      jp: 'トッテナム主将 / ワールドクラスの決定力',
    },
    coreKeyword: {
      kr: '반복된 기본기와 겸손 위에 꽃피운 폭발적인 스프린트',
      jp: '泥臭い反復と謙虚さの上に咲き誇る爆発的スプリント',
    },
    resonanceMessage: {
      kr: '${userName} 님, 화려한 스포트라이트 뒤편에서 피땀 흘리는 반복을 감내하며 자신을 증명해 낸 식신(食神)의 뚝심을 공유하고 계십니다. 동료들을 아우르면서도 승부처에서는 가장 날카로운 궤적으로 골문을 가르는 비견(比肩)의 리더십이 함께합니다.',
      jp: '${userName}様、華やかなスポットライトの裏で血のにじむ反復鍛錬を耐え抜き、自らを証明し続けた食神の粘り強さを共有していらっしゃいます。仲間を鼓舞し支えつつも、勝負所では最も鋭い軌道でゴールを射抜く比肩の統率力を宿しています。',
    },
  },

  // 8. 마츠시타 고노스케 (Konosuke Matsushita)
  {
    id: 'konosuke-matsushita',
    category: 'business',
    element: '水',
    tenGod: {
      kr: '정재(正財) · 정관(正官) 경영의 신',
      jp: '正財・正官 経営の神様',
    },
    baseFrequency: 79,
    emojiIcon: '🏮',
    themeColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.75)',
    name: {
      kr: '마츠시타 고노스케',
      jp: '松下幸之助',
    },
    title: {
      kr: '파나소닉 창업주 / 경영의 신',
      jp: 'パナソニック創業者 / 経営の神様',
    },
    coreKeyword: {
      kr: '가난·병약·무학의 3대 역경을 하늘의 축복으로 바꾼 덕망',
      jp: '貧困・病弱・無学の三大逆境を天の恵みへと転じた徳望',
    },
    resonanceMessage: {
      kr: '${userName} 님, 스스로의 결핍과 역경을 원망하지 않고 오히려 가장 큰 배움의 밑천으로 승화시킨 정관(正官)의 성숙한 인품을 품으셨습니다. 물 흐르듯 유연하면서도 만인을 품어 안아 거대한 상단을 완성하는 정재(正財)의 지혜가 당신을 비춥니다.',
      jp: '${userName}様、自らの欠乏や逆境を恨むことなく、むしろ最大の学問の礎へと昇華させた正官の成熟した人格を宿していらっしゃいます。水のように柔軟でありながら万人の心を包み込み、大業を成し遂げる正財の深遠な知恵があなたを照らしています。',
    },
  },

  // 9. 사카모토 료마 (Sakamoto Ryoma)
  {
    id: 'sakamoto-ryoma',
    category: 'history',
    element: '水',
    tenGod: {
      kr: '상관(傷官) · 역마(駅馬) 시대의 혁명가',
      jp: '傷官・駅馬 時代の革命家',
    },
    baseFrequency: 89,
    emojiIcon: '⛵',
    themeColor: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.75)',
    name: {
      kr: '사카모토 료마',
      jp: '坂本龍馬',
    },
    title: {
      kr: '막말의 풍운아 / 메이지 유신의 설계자',
      jp: '幕末の風雲児 / 明治維新の設計者',
    },
    coreKeyword: {
      kr: '진영 논리를 초월해 거대한 연대를 엮어낸 자유로운 영혼',
      jp: '陣営論理を超越して巨大な連帯を成し遂げた自由の魂',
    },
    resonanceMessage: {
      kr: '${userName} 님, 낡은 신분과 진영의 벽에 갇히지 않고 바다 너머 넓은 세상을 향해 돛을 올리는 역마(駅馬)의 자유로운 기상을 공유하십니다. 서로 총을 겨누던 적들을 설득해 새로운 시대를 여는 동맹을 엮어낸 상관(傷官)의 유연한 협상력이 당신 안에 살아있습니다.',
      jp: '${userName}様、古びた身分や陣営の壁に囚われず、海の彼方の広大な世界へと帆を揚げる駅馬の自由な気概を共有していらっしゃいます。互いに銃を向け合っていた仇敵を説得し新時代を開く同盟を成し遂げた傷官の柔軟な交渉力が、あなたの中に息づいています。',
    },
  },

  // 10. 이순신 (Yi Sun-sin)
  {
    id: 'yi-sun-sin',
    category: 'history',
    element: '金',
    tenGod: {
      kr: '편관(偏官) · 건록(建祿) 불멸의 지휘관',
      jp: '偏官・建禄 不滅の指揮官',
    },
    baseFrequency: 97,
    emojiIcon: '⚔️',
    themeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.75)',
    name: {
      kr: '이순신',
      jp: '李舜臣将軍',
    },
    title: {
      kr: '삼도수군통제사 / 불멸의 제독',
      jp: '三道水軍統制使 / 不滅の提督',
    },
    coreKeyword: {
      kr: '"신에게는 아직 열두 척의 배가 남아있습니다" 필사즉생의 신념',
      jp: '「死即生、生即死」 絶体絶命の危機をも覆す不滅の守護神',
    },
    resonanceMessage: {
      kr: '${userName} 님, "필사즉생(必死則生)"의 각오로 절대적인 열세 속에서도 한 치의 오차 없는 전략과 지형을 활용해 승리를 낚아채는 건록(建祿)의 굳건함을 지니셨습니다. 고독한 중압감 속에서도 원칙과 책임을 지켜내며 기적을 현실로 만드는 편관(偏官)의 수호신입니다.',
      jp: '${userName}様、「死即生、生即死」の覚悟のもと、圧倒的劣勢にあっても寸分の狂いなき戦略と地の利を活かして勝利を掴み取る建禄の剛直さを宿していらっしゃいます。孤独な重圧の中でも原則と責任を守り抜き、奇跡を現実に変える偏官の守護神です。',
    },
  },
];

/**
 * 천간별 오행 매핑
 */
const STEM_ELEMENT_MAP: Record<string, SajuElementHanja> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const FIVE_ELEMENT_EN_MAP: Record<FiveElement, SajuElementHanja> = {
  Wood: '木',
  Fire: '火',
  Earth: '土',
  Metal: '金',
  Water: '水',
};

/**
 * 오행 상생/동일/상극 매트릭스 점수 (가중치)
 */
function getElementAffinityScore(userElement: SajuElementHanja, celebElement: SajuElementHanja): number {
  if (userElement === celebElement) return 14; // 비견/겁재 (완전 동일 파동)

  // 상생 관계 (Wood -> Fire -> Earth -> Metal -> Water -> Wood)
  const generates: Record<SajuElementHanja, SajuElementHanja> = {
    木: '火',
    火: '土',
    土: '金',
    金: '水',
    水: '木',
  };

  if (generates[userElement] === celebElement) return 11; // 내가 생해줌 (식상)
  if (generates[celebElement] === userElement) return 12; // 나를 생해줌 (인성)

  // 상극 관계
  const controls: Record<SajuElementHanja, SajuElementHanja> = {
    木: '土',
    土: '水',
    水: '火',
    火: '金',
    金: '木',
  };

  if (controls[userElement] === celebElement) return 8; // 내가 극함 (재성)
  if (controls[celebElement] === userElement) return 9; // 나를 극함 (관성)

  return 7;
}

/**
 * 사주 기반 동적 매칭 및 주파수 정렬 함수 (calculateCelebrityMatches)
 * 
 * - 사용자의 일간 오행 및 최다/결핍 오행을 셀럽의 오행·십신과 대조하여 공명 일치율(60% ~ 99%)을 동적으로 계산.
 * - 가장 일치율이 높은 1위 인물(92% ~ 99%)을 '최고 공명 인물(Best Resonance)'로 선정하고,
 * - 나머지 인물들을 주파수 대역별(내림차순)로 정렬하여 반환.
 */
export function calculateCelebrityMatches(saju: SajuResult | null | undefined): CelebrityMatchResult {
  // 사주 정보가 없을 경우 기본값 폴백 (일론 머스크 1위)
  if (!saju) {
    const sorted = [...CELEBRITY_RESONANCE_DATASET].sort((a, b) => b.baseFrequency - a.baseFrequency);
    const matches: CelebrityMatchItem[] = sorted.map((celeb, idx) => ({
      celebrity: celeb,
      syncRate: idx === 0 ? 98 : Math.max(60, celeb.baseFrequency - 3),
      isBestMatch: idx === 0,
    }));
    return {
      bestMatch: matches[0],
      allMatches: matches,
    };
  }

  // 1. 사용자 일간 오행 추출
  const userStem = saju.dayMaster || '甲';
  const userElement = STEM_ELEMENT_MAP[userStem] || '木';

  // 2. 사용자 최다 오행 (가장 비율이 높은 오행) 추출
  let dominantElement: SajuElementHanja = userElement;
  if (saju.elementsRatio) {
    let maxRatio = -1;
    (Object.keys(saju.elementsRatio) as FiveElement[]).forEach((el) => {
      const ratio = saju.elementsRatio[el] || 0;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        dominantElement = FIVE_ELEMENT_EN_MAP[el] || '木';
      }
    });
  }

  // 3. 각 셀럽별 동적 공명 스코어 산출
  const scored = CELEBRITY_RESONANCE_DATASET.map((celeb) => {
    const affinityDay = getElementAffinityScore(userElement, celeb.element);
    const affinityDom = getElementAffinityScore(dominantElement, celeb.element);

    // 개인 사주 고유 해시 (사주 원국 천간/지지 결합으로 미세 핑거프린트 생성)
    const seed =
      (userStem.charCodeAt(0) * 7 +
        (saju.pillars?.day?.branch?.charCodeAt(0) || 5) * 13 +
        celeb.id.charCodeAt(0) * 11) %
      7;

    // 점수 합산: 기본 주파수(40%) + 일간 친화도(30%) + 최다오행 친화도(20%) + 사주 시드(10%)
    const rawScore =
      celeb.baseFrequency * 0.45 +
      affinityDay * 2.1 +
      affinityDom * 1.4 +
      seed * 0.8;

    return {
      celebrity: celeb,
      rawScore,
    };
  });

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.rawScore - a.rawScore);

  // 1위를 94~99% 범위의 최고 일치율로 보정하고, 나머지는 60~92% 대역으로 매끄럽게 정규화
  const topRaw = scored[0].rawScore;
  const bottomRaw = scored[scored.length - 1].rawScore;
  const range = Math.max(1, topRaw - bottomRaw);

  const allMatches: CelebrityMatchItem[] = scored.map((item, idx) => {
    let syncRate: number;
    if (idx === 0) {
      // 1위: 94% ~ 99%
      syncRate = Math.min(99, Math.max(94, Math.round(94 + ((item.rawScore % 5) + 0.8))));
    } else {
      // 2위 이하: 62% ~ 91%
      const normalized = (item.rawScore - bottomRaw) / range;
      syncRate = Math.min(91, Math.max(62, Math.round(62 + normalized * 28)));
    }

    return {
      celebrity: item.celebrity,
      syncRate,
      isBestMatch: idx === 0,
    };
  });

  // syncRate 내림차순 재정렬 (동점 방지 위해 미세 조정)
  allMatches.sort((a, b) => b.syncRate - a.syncRate);

  return {
    bestMatch: allMatches[0],
    allMatches,
  };
}

/**
 * 사용자 닉네임 정중한 경어체 치환 함수
 * 
 * - userName이 있으면: '${userName} 님' / '${userName}様'
 * - userName이 없으면: '인연자 님' / 'ご縁者様'
 */
export function formatResonanceMessage(
  template: string,
  userName?: string | null,
  lang: 'kr' | 'jp' = 'kr'
): string {
  const isJa = lang === 'jp';
  const defaultName = isJa ? 'ご縁者' : '인연자';
  const honorific = isJa ? '様' : ' 님';
  const cleanName = (userName && userName.trim()) || defaultName;
  const formattedCall = `${cleanName}${honorific}`;

  return template.replace(/\$\{userName\}(\s*님|様)?/g, formattedCall);
}
