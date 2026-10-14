/**
 * [CYBER-SAJU] 영혼의 공명(Soul Frequency Matrix) 셀럽 공명 DB 및 매칭 엔진
 * (src/data/celebrityResonance.ts)
 * 
 * - 한·일·글로벌 레전드 인물 10인 정밀 데이터셋
 * - kr / jp 언어 완벽 분리 (일본어 모드에서 한국어 0% 보장)
 * - 정중한 경어체(~합니다 / です・ます調) 및 사용자 닉네임 자동 치환
 */

import type { SajuResult, FiveElement, HeavenlyStem } from '../engine/types';

export type CelebrityCategory = 'tech' | 'business' | 'sports' | 'history' | 'culture';
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

  // 11. 젠슨 황 (Jensen Huang)
  {
    id: 'jensen-huang',
    category: 'tech',
    element: '金',
    tenGod: {
      kr: '편관(偏官) · 상관(傷官) AI 혁명가',
      jp: '偏官・傷官 AI革命家',
    },
    baseFrequency: 96,
    emojiIcon: '🦾',
    themeColor: '#76B900',
    glowColor: 'rgba(118, 185, 0, 0.75)',
    name: {
      kr: '젠슨 황',
      jp: 'ジェンスン・ファン',
    },
    title: {
      kr: '엔비디아 창업자·CEO / AI 컴퓨팅의 황제',
      jp: 'NVIDIA創業者・CEO / AIコンピューティングの覇者',
    },
    coreKeyword: {
      kr: '"더 많이 살수록 더 많이 아낀다" 가속 컴퓨팅으로 문명을 재정의하는 배짱',
      jp: '「買えば買うほど節約になる」 加速コンピューティングで文明を再定義する気概',
    },
    resonanceMessage: {
      kr: '${userName} 님, 아무도 믿지 않던 가속 컴퓨팅에 30년간 모든 것을 걸었던 것처럼, 세상의 회의론을 비웃고 미래의 인프라를 독점해 버리는 상관(傷官)의 선구안을 지니셨습니다. 실패와 벼랑 끝에서도 가죽 자켓 하나로 전열을 정비해 전 세계를 이끄는 편관(偏官)의 야성이 당신의 명식과 깊이 공명합니다.',
      jp: '${userName}様、誰も信じなかった加速コンピューティングに30年間全てを賭けたように、世間の懐疑論を一蹴して未来のインフラを独占する傷官の先見の明を備えていらっしゃいます。絶体絶命の危機をも糧にして世界を牽引する偏官の野性が、あなたのお命脈と深く共鳴しています。',
    },
  },

  // 12. 샘 올트먼 (Sam Altman)
  {
    id: 'sam-altman',
    category: 'tech',
    element: '水',
    tenGod: {
      kr: '편인(偏印) · 식신(食神) AGI 설계자',
      jp: '偏印・食神 AGI設計者',
    },
    baseFrequency: 94,
    emojiIcon: '🧠',
    themeColor: '#10A37F',
    glowColor: 'rgba(16, 163, 127, 0.75)',
    name: {
      kr: '샘 올트먼',
      jp: 'サム・アルトマン',
    },
    title: {
      kr: 'OpenAI CEO / 생성형 AI 혁명의 설계자',
      jp: 'OpenAI CEO / 生成AI革命の設計者',
    },
    coreKeyword: {
      kr: '인간의 지능을 넘어서는 초지능(AGI)의 지평을 여는 고요한 야심',
      jp: '人間の知能を超える超知能(AGI)の地平を切り拓く静かな野心',
    },
    resonanceMessage: {
      kr: '${userName} 님, 거대한 지각 변동의 씨앗을 누구보다 먼저 포착하고 비범한 인재들을 결집시켜 현실로 구현해 내는 편인(偏印)의 비전을 타고나셨습니다. 요동치는 권력 투쟁과 위기 속에서도 결코 흔들리지 않고 중심을 되찾는 식신(食神)의 유연함이 두 사람의 운명을 잇고 있습니다.',
      jp: '${userName}様、地殻変動の胎動を誰よりも早く捉え、並外れた俊英たちを結集して具現化する偏印の先見性を宿していらっしゃいます。激動の権力闘争や危機の中にあっても決して動じることなく主導権を取り戻す食神の柔軟さが、お二人の運命を繋いでいます。',
    },
  },

  // 13. 페이커 이상혁 (Faker)
  {
    id: 'faker-lee',
    category: 'sports',
    element: '火',
    tenGod: {
      kr: '상관(傷官) · 정인(印綬) e스포츠의 신',
      jp: '傷官・印綬 eスポーツの絶対神',
    },
    baseFrequency: 99,
    emojiIcon: '👑',
    themeColor: '#E50914',
    glowColor: 'rgba(229, 9, 20, 0.75)',
    name: {
      kr: '페이커 (이상혁)',
      jp: 'Faker (イ・サンヒョク)',
    },
    title: {
      kr: 'T1 주장 / 롤드컵 5회 우승의 불사대마왕',
      jp: 'T1主将 / 世界大会5度制覇の不死の大魔王',
    },
    coreKeyword: {
      kr: '"모든 길은 저를 통합니다" 정점에 서서도 흔들리지 않는 평정심',
      jp: '「すべての道は私に通じる」 頂点に君臨しながらも揺るがぬ平熱の狂気',
    },
    resonanceMessage: {
      kr: '${userName} 님, 찰나의 순간에 전장의 판세를 읽어내고 망설임 없이 기적을 만들어내는 상관(傷官)의 번뜩이는 감각을 공유하십니다. 10년이 넘는 세월 동안 부상과 슬럼프를 오직 책과 절제, 자기성찰로 극복하고 다시 왕관을 지켜낸 정인(印綬)의 위대한 품격이 함께합니다.',
      jp: '${userName}様、刹那の瞬間に戦況を読み解き、躊躇なく奇跡を紡ぎ出す傷官の閃きを共有していらっしゃいます。10年を超える歳月の中で怪我やスランプを読書と規律、自己省察のみで乗り越え、再び王冠を戴いた印綬の高潔な品格が宿っています。',
    },
  },

  // 14. 마이클 조던 (Michael Jordan)
  {
    id: 'michael-jordan',
    category: 'sports',
    element: '土',
    tenGod: {
      kr: '비견(比肩) · 편관(偏官) 농구 황제',
      jp: '比肩・偏官 バスケットボールの神様',
    },
    baseFrequency: 97,
    emojiIcon: '🏀',
    themeColor: '#CE1141',
    glowColor: 'rgba(206, 17, 65, 0.75)',
    name: {
      kr: '마이클 조던',
      jp: 'マイケル・ジョーダン',
    },
    title: {
      kr: 'NBA 레전드 / 농구 황제',
      jp: 'NBAレジェンド / バスケットボールの神様',
    },
    coreKeyword: {
      kr: '"나는 실패를 받아들일 수 있지만, 시도조차 하지 않는 것은 받아들일 수 없다"',
      jp: '「失敗は受け入れられるが、挑戦しないことは許せない」 勝利への偏執',
    },
    resonanceMessage: {
      kr: '${userName} 님, 지는 것을 죽기보다 싫어하는 타협 없는 승부욕과 결정적인 클러치 순간에 스스로 공을 쥐는 비견(比肩)의 패기를 닮으셨습니다. 수천 번의 슛 실패를 딛고 기어코 우승 반지를 쟁취하는 편관(偏官)의 철저한 지배력이 당신의 영혼을 강타합니다.',
      jp: '${userName}様、敗北を死よりも忌み嫌う妥協なき闘争心と、決定的な勝負所で自らボールを握る比肩の覇気を通底していらっしゃいます。幾千ものシュートの失敗を糧にして必ずや王座を勝ち取る偏官の絶対的な支配力が、あなたの魂を貫いています。',
    },
  },

  // 15. 후지이 소타 (Sota Fujii)
  {
    id: 'sota-fujii',
    category: 'culture',
    element: '木',
    tenGod: {
      kr: '정인(正印) · 식신(食神) 반상의 절대자',
      jp: '正印・食神 盤上の絶対王者',
    },
    baseFrequency: 95,
    emojiIcon: '♟️',
    themeColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.75)',
    name: {
      kr: '후지이 소타',
      jp: '藤井聡太',
    },
    title: {
      kr: '일본 장기 사상 최초 8대 타이틀 독점 / 반상의 천재',
      jp: '将棋界史上初の全八冠独占 / 盤上の絶対王者',
    },
    coreKeyword: {
      kr: '수천만 수를 탐색하는 AI를 뛰어넘는 인간 직관과 정밀한 수읽기',
      jp: 'AIの演算をも凌駕する深奥な大局観と一分の狂いなき詰将棋',
    },
    resonanceMessage: {
      kr: '${userName} 님, 눈앞의 이익이나 얕은 꼼수에 현혹되지 않고 반상의 가장 순수한 최선의 한 수를 끝까지 찾아내는 정인(正印)의 학구열을 품고 계십니다. 조용한 침묵 속에서 수만 갈래의 미래를 꿰뚫어보고 결국 필승의 포석을 완성하는 식신(食神)의 깊은 지혜가 일치합니다.',
      jp: '${userName}様、目先の小利や安易な罠に惑わされることなく、盤上の最も美しく純粋な最善手をどこまでも探求する正印の探究心を宿していらっしゃいます。静寂の中で幾万の手を読み切り、最後には盤面を完全掌握する食神の深遠な知恵が重なっています。',
    },
  },

  // 16. 봉준호 (Bong Joon-ho)
  {
    id: 'bong-joon-ho',
    category: 'culture',
    element: '水',
    tenGod: {
      kr: '편인(偏印) · 상관(傷官) 디테일의 거장',
      jp: '偏印・傷官 演出の巨匠',
    },
    baseFrequency: 92,
    emojiIcon: '🎬',
    themeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.75)',
    name: {
      kr: '봉준호',
      jp: 'ポン・ジュノ',
    },
    title: {
      kr: '영화감독 / 칸 황금종려상 & 아카데미 4관왕',
      jp: '映画監督 / カンヌ最高賞＆アカデミー4冠',
    },
    coreKeyword: {
      kr: '"가장 개인적인 것이 가장 창의적인 것이다" 디테일로 세계를 홀리는 연출력',
      jp: '「最も個人的なことが最もクリエイティブである」 緻密なディテール',
    },
    resonanceMessage: {
      kr: '${userName} 님, 사회의 모순과 인간 내면의 뒤틀린 단면을 한 치의 빈틈없는 스토리보드로 엮어내는 편인(偏印)의 날카로운 관찰력을 지니셨습니다. 유머와 서스펜스를 자유자재로 넘나들며 전 세계의 심장을 쥐락펴락하는 상관(傷官)의 독창적인 표현력이 당신의 기운과 닿아 있습니다.',
      jp: '${userName}様、社会の矛盾と人間の深層を寸分の隙もない絵コンテへと編み上げる偏印の鋭利な観察眼を備えていらっしゃいます。ユーモアとサスペンスを縦横無尽に行き来し世界中の観客を魅了する傷官の独創的表現力が、あなたの気運と響き合っています。',
    },
  },

  // 17. 아이유 (IU)
  {
    id: 'iu-lee',
    category: 'culture',
    element: '木',
    tenGod: {
      kr: '정관(正官) · 식신(食神) 영혼을 울리는 음유시인',
      jp: '正官・食神 魂を響かせる吟遊詩人',
    },
    baseFrequency: 94,
    emojiIcon: '🎵',
    themeColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.75)',
    name: {
      kr: '아이유 (이지은)',
      jp: 'アイユー (IU)',
    },
    title: {
      kr: '싱어송라이터·배우 / 대중음악의 아이콘',
      jp: 'シンガーソングライター・女優 / ポップス界のアイコン',
    },
    coreKeyword: {
      kr: '자신의 나이와 계절을 진솔한 언어로 승화시켜 온 세대를 위로하는 공감력',
      jp: '自らの年齢と季節を飾らぬ言霊へと昇華し世代を超えて癒やす共感力',
    },
    resonanceMessage: {
      kr: '${userName} 님, 자신의 상처와 고민을 진솔한 언어로 벼려내어 타인의 마음을 어루만지는 식신(食神)의 따스한 감수성을 품으셨습니다. 어린 나이의 성공에 안주하지 않고 끊임없이 자기 기준을 갱신하며 정상의 자리를 지켜내는 정관(正官)의 단단한 자존감이 빛납니다.',
      jp: '${userName}様、自らの痛みや葛藤を飾らぬ言霊へと昇華させ、人々の心を包み込み癒やす食神の温かな感受性を宿していらっしゃいます。若くして得た名声に溺れることなく、自らの基準を更新し続け頂点に立ち続ける正官の揺るぎなき自尊心が輝いています。',
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

  // 2. 사용자 최다 오행 (가장 비율이 높은 오행) 및 결핍 오행 추출
  let dominantElement: SajuElementHanja = userElement;
  let lackingElement: SajuElementHanja = '金';
  if (saju.elementsRatio) {
    let maxRatio = -1;
    let minRatio = 999;
    (Object.keys(saju.elementsRatio) as FiveElement[]).forEach((el) => {
      const ratio = saju.elementsRatio[el] || 0;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        dominantElement = FIVE_ELEMENT_EN_MAP[el] || '木';
      }
      if (ratio < minRatio) {
        minRatio = ratio;
        lackingElement = FIVE_ELEMENT_EN_MAP[el] || '金';
      }
    });
  }

  // 3. 각 셀럽별 동적 공명 스코어 산출
  const scored = CELEBRITY_RESONANCE_DATASET.map((celeb) => {
    const affinityDay = getElementAffinityScore(userElement, celeb.element);
    const affinityDom = getElementAffinityScore(dominantElement, celeb.element);
    // 결핍 오행을 보완해주는 셀럽인 경우 보완적 시너지 가산점 (+10점)
    const complementScore = celeb.element === lackingElement ? 10 : 0;

    // 개인 사주 고유 해시 (사주 원국 천간/지지 결합으로 미세 핑거프린트 생성)
    const seed =
      (userStem.charCodeAt(0) * 7 +
        (saju.pillars?.day?.branch?.charCodeAt(0) || 5) * 13 +
        celeb.id.charCodeAt(0) * 11) %
      7;

    // 점수 합산: 기본 주파수(40%) + 일간 친화도(20%) + 최다오행 친화도(15%) + 결핍오행 보완(15%) + 사주 시드(10%)
    const rawScore =
      celeb.baseFrequency * 0.40 +
      affinityDay * 1.8 +
      affinityDom * 1.2 +
      complementScore * 1.2 +
      seed * 0.7;

    return {
      celebrity: celeb,
      rawScore,
    };
  });

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.rawScore - a.rawScore);

  // 1위를 92~99% 범위의 최고 일치율로 보정하고, 나머지는 60~91% 대역으로 매끄럽게 정규화
  const topRaw = scored[0].rawScore;
  const bottomRaw = scored[scored.length - 1].rawScore;
  const range = Math.max(1, topRaw - bottomRaw);

  const allMatches: CelebrityMatchItem[] = scored.map((item, idx) => {
    let syncRate: number;
    if (idx === 0) {
      // 1위: 92% ~ 99%
      const topBonus = Math.round((item.rawScore * 3.7) % 8); // 0 ~ 7
      syncRate = Math.min(99, Math.max(92, 92 + topBonus));
    } else {
      // 2위 이하: 60% ~ 91%
      const normalized = (item.rawScore - bottomRaw) / range;
      syncRate = Math.min(91, Math.max(60, Math.round(60 + normalized * 31)));
    }

    return {
      celebrity: item.celebrity,
      syncRate,
      isBestMatch: idx === 0,
    };
  });

  // 2위 이하가 1위와 같거나 이전 등수보다 낮도록 정렬 보정 (동점 방지 및 주파수 계단식 보장)
  for (let i = 1; i < allMatches.length; i++) {
    if (allMatches[i].syncRate >= allMatches[i - 1].syncRate) {
      allMatches[i].syncRate = Math.max(60, allMatches[i - 1].syncRate - 1);
    }
  }

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

  if (template.includes('${userName}')) {
    return template.replace(/\$\{userName\}(\s*님|様)?/g, formattedCall);
  }
  return `${formattedCall}, ${template}`;
}
