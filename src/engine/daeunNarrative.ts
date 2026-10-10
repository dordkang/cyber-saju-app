import type { EarthlyBranch, HeavenlyStem } from './types';
import type { InteractionNote, LifeStage, TenGod, TwelveStage } from './timelineEngine';

/**
 * 대운 카드 서사 생성기. 십성 × 인생 시기 × 12운성 × 형충회합을 조합해
 * headline(은유 헤드라인) / summary(한 줄 운명 서사) / detail(심층 풀이) / factCheck(적중 질문)를 만든다.
 * 외부 호출 없이 룰 테이블만 사용하며, timelineEngine과는 타입만 공유한다.
 */

export type DaeunTiming = 'past' | 'current' | 'future';

export interface DaeunNarrativeInput {
  dayMaster: HeavenlyStem;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemGod: TenGod;
  branchGod: TenGod;
  stage12: TwelveStage;
  lifeStage: LifeStage;
  timing: DaeunTiming;
  interactions: readonly InteractionNote[];
  /** 원국 지지가 일간 기준 어떤 십성인지. 재성이 인성을 치는 충(재극인)을 가려내는 데 쓴다. */
  natalBranchGod: (branch: EarthlyBranch) => TenGod;
  /** 현재 대운이 끝나기까지 남은 햇수. 현재 대운에서만 의미가 있다. */
  yearsLeft?: number;
  /** 다음 대운. 마지막 대운이면 null. */
  next?: { ganjiLabel: string; stemGod: TenGod } | null;
}

export interface DaeunNarrative {
  headline: string;
  summary: string;
  detail: string;
  factCheck: string;
}

// ───────────────────────── 조사 처리 ─────────────────────────

function finalSyllable(word: string): number | null {
  const core = word.replace(/\([^)]*\)\s*$/u, '').trimEnd();
  for (let i = core.length - 1; i >= 0; i -= 1) {
    const code = core.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) return code;
  }
  return null;
}

function hasBatchim(word: string): boolean {
  const code = finalSyllable(word);
  return code !== null && (code - 0xac00) % 28 !== 0;
}

/** 받침 유무에 따라 조사를 붙인다. 예: josa('칼날', '이', '가') → '칼날이' */
function josa(word: string, withBatchim: string, without: string): string {
  return `${word}${hasBatchim(word) ? withBatchim : without}`;
}

// ───────────────────────── 이미지 · 용어 테이블 ─────────────────────────

const STEM_HOOK: Record<HeavenlyStem, string> = {
  甲: '甲木의 우람한 거목',
  乙: '乙木의 질긴 풀뿌리',
  丙: '丙火의 이글대는 태양',
  丁: '丁火의 타오르는 촛불',
  戊: '戊土의 묵직한 태산',
  己: '己土의 촉촉한 논밭',
  庚: '庚金의 서슬 푸른 쇳덩이',
  辛: '辛金의 날카로운 칼날',
  壬: '壬水의 넘실대는 큰 강물',
  癸: '癸水의 스며드는 빗물',
};

const BRANCH_IMG: Record<EarthlyBranch, string> = {
  子: '子水의 한겨울 찬 물결',
  丑: '丑土의 얼어붙은 진흙밭',
  寅: '寅木의 새벽 호랑이',
  卯: '卯木의 빽빽한 나무숲',
  辰: '辰土의 물기 밴 흙더미',
  巳: '巳火의 꿈틀대는 불길',
  午: '午火의 한낮 불바다',
  未: '未土의 바싹 마른 흙',
  申: '申金의 번뜩이는 쇠붙이',
  酉: '酉金의 서릿발 칼날',
  戌: '戌土의 불씨 품은 메마른 땅',
  亥: '亥水의 깊은 밤바다',
};

const ELEMENT_KO: Record<string, string> = { 木: '나무', 火: '불', 土: '흙', 金: '쇠', 水: '물' };

const TRIAD_ELEMENT: ReadonlyArray<readonly [string, string]> = [
  ['寅午戌', '火'], ['亥卯未', '木'], ['巳酉丑', '金'], ['申子辰', '水'],
];

const GOD_GROUP: Record<TenGod, '비겁' | '식상' | '재성' | '관성' | '인성'> = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성',
  편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
};

const TENSE: Record<DaeunTiming, string> = { past: '던', current: '는', future: '게 될' };

const LIFE_NOUN: Record<LifeStage, string> = {
  초년: '성장기',
  청년: '청춘기',
  중년: '중년기',
  말년: '황혼기',
};

const AREA: Record<string, string> = {
  연주: '어린 시절의 뿌리(조상·부모 자리)',
  월주: '직업과 사회적 터전',
  일주: '나 자신과 배우자 자리',
  시주: '자식과 말년의 결실',
  원국: '사주 전체의 판',
};

// ───────────────────────── 십성 × 인생 시기 (headline · scene · fact) ─────────────────────────

interface StageText {
  /** 1줄 은유 헤드라인 */
  head: string;
  /** summary에 들어가는 동사구. 뒤에 '던/는/게 될'이 붙으므로 어간으로 끝낸다. */
  scene: string;
  /** 지나간 대운에 던지는 팩트체크 질문 */
  fact: string;
}

const GOD_STAGE: Record<TenGod, Record<LifeStage, StageText>> = {
  비견: {
    초년: {
      head: '또래와 코를 맞대고 서열을 다투며 자란 골목대장',
      scene: '또래와 서열을 다투며 내 자리를 악착같이 지키',
      fact: '어릴 적 형제나 또래와 물건·관심·서열을 두고 유독 치열하게 다투거나 대장 노릇을 한 기억이 선명하지 않습니까?',
    },
    청년: {
      head: '남 밑에선 숨이 막혀 내 깃발을 꽂은 고독한 독립기',
      scene: '남의 그늘 아래서는 숨이 막혀 맨땅에 내 터전과 이름을 세우',
      fact: '이 시기에 직장이나 조직 생활의 한계를 절감하고, 내 이름 석 자를 건 사업이나 독립을 단행해 피땀 흘리지 않았습니까?',
    },
    중년: {
      head: '같은 판 위의 라이벌과 끝장 승부를 보는 자존심의 시간',
      scene: '동업자와 경쟁자 사이에서 내 몫과 자존심을 끝까지 지키',
      fact: '동업자·동료·형제와 몫을 두고 갈라서거나, 보증·빌려준 돈 때문에 속을 끓인 적이 있습니까?',
    },
    말년: {
      head: '내 힘으로 선 사람만 곁에 남는 홀로서기의 노년',
      scene: '곁에 남은 동년배와 형제를 가늠하며 마지막 내 몫을 챙기',
      fact: '형제나 오랜 친구와 재산·집안일을 두고 서운함을 겪거나, 이제는 홀로 서야겠다고 마음먹은 적이 있습니까?',
    },
  },
  겁재: {
    초년: {
      head: '내 몫을 빼앗기지 않으려 주먹부터 쥐던 아이',
      scene: '형제·친구와 물건과 관심을 두고 치열하게 내 몫을 다투',
      fact: '어릴 적 형제나 친구에게 물건과 부모의 관심을 빼앗기는 기분에 억울해하거나 다툼이 잦지 않았습니까?',
    },
    청년: {
      head: '내 밥그릇 뺏기지 않으려 이 악물고 버틴 인맥의 칼바람',
      scene: '남 좋은 일 시켜 주고 속앓이하며 내 밥그릇을 이 악물고 지키',
      fact: '이 시기에 주변 사람이나 동료를 너무 믿었다가 공을 가로채이거나 돈·기회에서 억울한 배신을 겪은 적이 있습니까?',
    },
    중년: {
      head: '동업과 보증의 늪에서 곳간 새는 소리를 듣는 시간',
      scene: '동업·보증·빌려준 돈으로 곳간이 새는 소리를 들으며 내 몫을 사수하',
      fact: '동업자나 지인에게 돈을 빌려주거나 보증을 섰다가 떼이거나 갈라선 적이 있습니까?',
    },
    말년: {
      head: '움켜쥔 몫을 두고 혈육과 갈라서는 서늘한 노년',
      scene: '재산과 상속을 두고 혈육·지인과 서늘하게 갈라서',
      fact: '형제·친척과 재산이나 상속·부양 문제로 마음이 크게 상한 적이 있습니까?',
    },
  },
  식신: {
    초년: {
      head: '내 손으로 밥벌이 무기를 벼려내던 생존의 기틀',
      scene: '나만의 재능과 기술로 세상에 맞설 숨통을 틔우',
      fact: '어린 시절 남들과 똑같은 공부 대신 나만의 특별한 손재주나 기술, 독립의 수단을 찾아 몰두하지 않았습니까?',
    },
    청년: {
      head: '재주 하나로 세상 한복판에 밥상을 차려 낸 첫 승부',
      scene: '가진 재주 하나를 돈 되는 기술로 벼려 내 밥상을 직접 차리',
      fact: '직장보다 나만의 기술·재능·결과물로 먹고살 길을 찾아 헤맨 적이 있지 않습니까?',
    },
    중년: {
      head: '갈고닦은 기술이 간판이 되어 밥줄로 열매 맺는 시간',
      scene: '오래 갈고닦은 기술과 노하우를 간판 삼아 먹고살 기반을 단단히 다지',
      fact: '내 기술이나 노하우를 상품·콘텐츠·가게로 만들어 안정적인 수입 라인을 세운 적이 있습니까?',
    },
    말년: {
      head: '움켜쥐지 않고 나눠도 곳간이 마르지 않는 여유',
      scene: '쌓은 재주를 후배와 자식에게 풀어 놓으며 느긋하게 나눠 주',
      fact: '이 무렵 취미나 재능을 나누며 여유를 되찾았거나 후배·자식에게 아낌없이 베푼 기억이 있습니까?',
    },
  },
  상관: {
    초년: {
      head: '세상이 정해준 틀을 깨부수던 작은 반역아',
      scene: '어른들의 잔소리와 뻔한 규칙에 본능적으로 반발하',
      fact: '어릴 적 부모나 선생님의 억압적인 훈육에 숨이 턱 끝까지 막혀 겉돌거나 반항한 적이 있습니까?',
    },
    청년: {
      head: '입 하나로 판을 뒤집다 구설에 베인 날 선 청춘',
      scene: '말과 재능으로 윗사람의 권위를 들이받다 구설과 마찰을 달고 다니',
      fact: '상사나 선배와 말 한마디로 크게 부딪쳐 회사를 박차고 나오거나 평판이 갈린 적이 있습니까?',
    },
    중년: {
      head: '조직의 틀을 걷어차고 내 방식으로 승부하는 이단아',
      scene: '조직의 규율을 걷어차고 내 방식과 목소리로 판을 짜',
      fact: '조직이나 관공서와 마찰이 커져 직장을 뛰쳐나왔거나, 말 때문에 관재·구설에 휘말린 적이 있습니까?',
    },
    말년: {
      head: '참았던 말을 쏟아내며 자유를 되찾는 늦깎이 반항',
      scene: '평생 눌러 둔 말과 재주를 쏟아 내며 자식·후배와 부딪치',
      fact: '자식이나 아랫사람과 말다툼 끝에 소원해졌거나, 늦게나마 하고 싶던 일에 뛰어든 적이 있습니까?',
    },
  },
  편재: {
    초년: {
      head: '철들기 전에 돈의 냄새부터 맡아 버린 조숙한 아이',
      scene: '집안의 돈줄과 아버지의 사정을 일찍부터 피부로 느끼',
      fact: '어릴 적 집안 경제 사정이 크게 출렁이거나 아버지의 사업·직업 변동으로 환경이 흔들린 적이 있습니까?',
    },
    청년: {
      head: '큰돈의 냄새를 쫓아 거친 파도에 올라탄 승부사',
      scene: '기회가 있는 곳이면 어디든 달려가 큰돈을 쫓아 판을 벌이',
      fact: '한 방을 노린 투자·장사·사업에 뛰어들었다가 큰돈이 들락날락한 적이 있습니까?',
    },
    중년: {
      head: '판이 커진 만큼 돈도 사람도 크게 들락이는 대어의 시간',
      scene: '큰 판을 벌여 돈과 사람이 크게 오가는 사업의 한복판에 서',
      fact: '사업 확장이나 투자로 큰돈이 들어왔다가, 그만큼 크게 새 나간 적이 있습니까?',
    },
    말년: {
      head: '굴려야 할 곳간과 놓아야 할 욕심이 맞서는 갈림길',
      scene: '쌓아 둔 자산을 굴릴지 지킬지를 두고 마지막 큰 결단을 내리',
      fact: '부동산·자산을 크게 움직였거나, 큰돈을 잘못 굴려 낭패를 본 일이 있습니까?',
    },
  },
  정재: {
    초년: {
      head: '알뜰한 살림 속에서 현실을 일찍 배운 모범생',
      scene: '성실한 살림살이와 알뜰한 규율 속에서 현실 감각을 일찍 익히',
      fact: '어릴 적 용돈이나 살림 문제로 현실을 일찍 깨달았거나, 부모의 검소한 생활 방식에 깊이 영향받지 않았습니까?',
    },
    청년: {
      head: '월급 한 푼의 무게를 알아 가며 뿌리를 내린 시절',
      scene: '꾸준한 벌이와 안정된 터전을 한 푼씩 쌓으며 현실에 뿌리를 내리',
      fact: '안정된 직장과 월급을 붙잡고, 결혼이나 내 집 마련 같은 현실 문제를 진지하게 따져 보지 않았습니까?',
    },
    중년: {
      head: '꼬박꼬박 쌓은 곳간이 비로소 열매 맺는 알짜의 시간',
      scene: '성실하게 쌓은 신용과 고정 수입으로 곳간을 채우',
      fact: '고정 수입이나 부동산·저축이 눈에 띄게 불었거나 가정의 경제 기반이 단단해진 적이 있습니까?',
    },
    말년: {
      head: '아껴 둔 곳간으로 노년의 평온을 사는 시간',
      scene: '쌓아 둔 재산과 연금으로 노후의 안정과 평온을 다지',
      fact: '노후 자금이나 연금·임대수입 같은 안정적인 수입 구조를 챙기려 부지런히 움직인 적이 있습니까?',
    },
  },
  편관: {
    초년: {
      head: '어린 어깨에 호랑이 같은 엄격함이 얹히던 시간',
      scene: '엄격한 규율과 어른들의 통제 아래서 어린 어깨가 눌리',
      fact: '어릴 적 부모나 선생님의 엄한 통제·체벌, 또는 집안의 무거운 분위기에 짓눌려 지낸 기억이 있습니까?',
    },
    청년: {
      head: '시퍼런 칼날 같은 시험대 위에서 단련된 청춘',
      scene: '시험·취업·상사의 압박이라는 칼바람에 맞서 단련되',
      fact: '취업·승진·시험에서 피가 마르는 압박을 받거나 조직의 서슬 퍼런 눈치 속에서 버틴 적이 있습니까?',
    },
    중년: {
      head: '책임이 칼이 되어 어깨를 짓누르는 가장의 무게',
      scene: '일과 가족의 책임을 한 몸에 지고 관재와 압박을 정면으로 견디',
      fact: '소송·세무조사·관공서 문제나 직장 내 책임 문제로 크게 곤욕을 치른 적이 있습니까?',
    },
    말년: {
      head: '몸이 먼저 보내는 경고장을 읽어야 하는 시간',
      scene: '몸이 보내는 경고와 역할의 무게를 감당하며 내려놓을 것을 가리',
      fact: '건강 경고(수술·입원)나 사회적 책임을 내려놓아야 하는 압박을 실감한 적이 있습니까?',
    },
  },
  정관: {
    초년: {
      head: '반듯한 틀 안에서 칭찬받으며 자란 모범의 시간',
      scene: '규칙과 질서를 따르며 어른들에게 인정받는 반듯한 아이로 자라',
      fact: '어릴 적 반장·모범생처럼 규율을 잘 지켜 어른들의 기대를 한 몸에 받은 적이 있습니까?',
    },
    청년: {
      head: '제도권의 문을 두드리며 이름 석 자의 값을 증명하는 시간',
      scene: '제도권의 문을 두드리며 직함과 평판으로 내 이름값을 증명하',
      fact: '공채·자격시험·공직 같은 제도권의 길을 걷거나, 직함이 곧 내 자존심이 된 적이 있습니까?',
    },
    중년: {
      head: '평판과 직함이 곧 재산이 되는 명예의 정점',
      scene: '직위와 평판을 쌓아 조직 안에서 신뢰와 명예를 얻',
      fact: '승진·직책·명예로운 자리를 얻었거나, 반대로 체면 때문에 스스로를 옭아맨 적이 있습니까?',
    },
    말년: {
      head: '내려놓은 직함 뒤에 남은 품위의 시간',
      scene: '지난 직함과 명예를 정리하며 품위 있게 물러날 자리를 찾',
      fact: '직책이나 사회적 역할을 정리하며 아쉬움이나 홀가분함을 크게 느낀 적이 있습니까?',
    },
  },
  편인: {
    초년: {
      head: '남들과 다른 곳을 보며 혼자 외딴 방을 짓던 아이',
      scene: '남들이 안 보는 곳을 혼자 파고들며 마음의 외딴 방을 짓',
      fact: '어릴 적 또래와 어울리기보다 혼자만의 세계에 빠지거나, 부모·양육자와 거리감을 느낀 적이 있습니까?',
    },
    청년: {
      head: '정해진 길을 버리고 낯선 공부에 빠져 헤매던 이방인',
      scene: '정해진 길을 버리고 낯선 공부와 사색으로 길을 헤매',
      fact: '전공·진로를 갈아타거나 남들이 가지 않는 특이한 공부·자격·종교에 깊이 빠진 적이 있습니까?',
    },
    중년: {
      head: '거대한 겨울 바다 위로 지혜의 태양이 솟는 대전환',
      scene: '조직이나 몸을 갈아 넣는 낡은 방식을 버리고 나만의 지식과 시스템으로 길을 개척하',
      fact: '낡은 방식으로는 한계를 절감하고 새로운 공부·자격·기술(시스템)로 방향을 튼 적이 있습니까?',
    },
    말년: {
      head: '세속의 소음을 끄고 깊은 사색으로 들어서는 시간',
      scene: '세상의 소음을 덜어 내고 공부·신앙·사색에 깊이 잠기',
      fact: '종교·철학·공부에 깊이 빠지거나 홀로 보내는 시간이 부쩍 늘지 않았습니까?',
    },
  },
  정인: {
    초년: {
      head: '어머니의 품과 울타리 속에서 배움을 쌓던 보호의 시간',
      scene: '어머니와 어른들의 보호 아래 안정적으로 배움을 쌓',
      fact: '어릴 적 어머니나 어른의 헌신적인 보살핌 속에서 공부에 몰두하거나 학업의 도움을 받은 기억이 있습니까?',
    },
    청년: {
      head: '귀인의 손과 문서로 길을 뚫던 배움의 청춘',
      scene: '스승·선배의 도움과 자격·학위로 길을 뚫',
      fact: '스승이나 선배·윗사람의 도움으로 기회를 얻거나, 자격증·학위에 크게 투자한 적이 있습니까?',
    },
    중년: {
      head: '든든한 방파제 뒤에서 문서와 터전을 지켜 낸 버팀의 시간',
      scene: '문서와 귀인이라는 든든한 방파제 뒤에서 터전을 묶어 버티',
      fact: '계약서·부동산·자격 같은 문서로 터전을 굳히거나 귀인의 도움으로 위기를 넘긴 적이 있습니까?',
    },
    말년: {
      head: '평생 쌓은 덕이 돌아와 마음의 평안을 얻는 시간',
      scene: '평생 쌓은 덕과 배움이 돌아와 마음의 평안을 누리',
      fact: '주변의 도움이나 정신적 위안을 얻어 마음이 한결 편안해진 적이 있습니까?',
    },
  },
};

/** 진행 중인 대운에 던지는 질문 (현재형) */
const FACT_NOW: Record<TenGod, string> = {
  비견: '요즘 같은 업계의 동료·경쟁자와 몫을 두고 신경전을 벌이거나 홀로서기를 진지하게 고민하고 있지 않습니까?',
  겁재: '요즘 믿었던 사람 때문에 돈이나 기회를 놓쳤거나, 지출·보증 요구로 곳간이 새고 있다는 느낌이 들지 않습니까?',
  식신: '요즘 내 재주나 노하우를 돈이 되는 결과물로 바꾸고 싶다는 욕구가 하루가 다르게 커지고 있지 않습니까?',
  상관: '요즘 윗사람이나 조직의 방식이 답답해 한마디 쏟아내고 싶거나, 말 때문에 구설에 오른 일이 있지 않습니까?',
  편재: '요즘 큰돈이 오갈 만한 투자·사업 제안이 눈앞을 맴돌며 마음이 들떠 있지 않습니까?',
  정재: '요즘 고정 수입과 살림, 내 집이나 결혼 같은 현실 문제를 한 푼씩 따져 보고 있지 않습니까?',
  편관: '요즘 책임과 압박이 한꺼번에 몰려 몸이 먼저 무너지거나 관재·구설을 걱정한 적이 있지 않습니까?',
  정관: '요즘 직함이나 평판, 체면 때문에 하고 싶은 말을 삼키며 틀 안에서 버티고 있지 않습니까?',
  편인: '요즘 하던 방식에 회의가 들어 낯선 공부나 새로운 기술·자격에 마음이 끌리고 있지 않습니까?',
  정인: '요즘 문서·계약·터전 문제에서 누군가의 도움을 받고 있거나, 오래 붙들던 자리를 정리해야 하나 고민하고 있지 않습니까?',
};

/** 교운기(대운 끝자락)에 던지는 질문 */
const FACT_TURNING =
  '최근 몇 년 사이 오랜 터전·직업·관계를 정리하고 인생의 방향타를 크게 틀어 새로운 도전을 감행하고 있지 않습니까?';

/** 아직 오지 않은 대운에 던지는 질문 */
const FACT_AHEAD: Record<TenGod, string> = {
  비견: '머지않아 남의 밑이 아니라 내 이름 석 자로 서야 할 때가 온다는 예감이 들지 않습니까?',
  겁재: '머지않아 사람과 돈 문제로 내 몫을 두고 다툴 일이 닥친다는 예감이 들지 않습니까?',
  식신: '머지않아 내 재주 하나로 먹고살 길이 열릴 것 같다는 예감이 들지 않습니까?',
  상관: '머지않아 참아 온 말을 쏟아내고 낡은 틀을 박차고 나갈 일이 생길 것 같지 않습니까?',
  편재: '머지않아 큰돈과 큰 판이 눈앞에 펼쳐질 것 같다는 예감이 들지 않습니까?',
  정재: '머지않아 흔들리지 않는 수입과 터전을 제대로 다져야 할 때가 온다고 직감하고 있지 않습니까?',
  편관: '머지않아 책임과 압박이 한꺼번에 밀려와 단단히 각오해야 할 때가 온다고 느끼고 있지 않습니까?',
  정관: '머지않아 직함이나 평판을 걸고 정식으로 인정받을 자리가 열린다고 느끼고 있지 않습니까?',
  편인: '조직이나 내 몸을 갈아 넣는 노동 대신, 나만의 지적 자산과 도구(시스템)로 승부를 봐야 할 때임을 직감하고 있습니까?',
  정인: '머지않아 문서와 귀인의 도움으로 마음을 놓을 수 있는 든든한 울타리가 생길 것 같지 않습니까?',
};

// ───────────────────────── 심층 풀이 재료 ─────────────────────────

const STEM_PSYCHE: Record<TenGod, string> = {
  비견: '내 힘으로 서겠다는 오기와 자립심을 부추기고',
  겁재: '내 것을 지키려는 승부욕과 경계심에 불을 붙이고',
  식신: '재주를 밥벌이로 바꾸려는 숨통을 틔우고',
  상관: '기존 질서에 대한 반발과 날 선 표현욕을 부추기고',
  편재: '큰돈과 큰 판을 향한 모험심을 자극하고',
  정재: '한 푼씩 쌓아 올리는 현실 감각을 단단하게 하고',
  편관: '압박과 책임에 맞서는 독기와 긴장감을 키우고',
  정관: '체면과 규율, 인정받으려는 마음을 앞세우고',
  편인: '남다른 구상과 고독한 사색을 깊게 하고',
  정인: '배움과 보호를 갈구하는 마음을 다독이고',
};

const BRANCH_ENV: Record<TenGod, string> = {
  비견: '또래와 동료가 곁에서 경쟁하고 의지하는 환경을 만든다',
  겁재: '사람과 돈이 얽혀 내 몫을 다퉈야 하는 환경을 만든다',
  식신: '재능을 펼칠 무대와 먹고살 터전을 깔아 준다',
  상관: '틀을 깨고 나올 수밖에 없는 불편한 환경을 깔아 준다',
  편재: '돈과 기회가 크게 오가는 활동 무대를 열어 준다',
  정재: '꾸준한 수입과 안정된 살림의 터전을 다져 준다',
  편관: '엄격한 규율과 윗사람의 눈초리가 에워싸는 환경을 만든다',
  정관: '반듯한 질서와 제도권의 울타리를 둘러 준다',
  편인: '낯선 배움과 변칙적인 구상이 몰려드는 환경을 만든다',
  정인: '문서와 귀인이 받쳐 주는 든든한 울타리를 둘러 준다',
};

const STAGE_DRAMA: Record<TwelveStage, string> = {
  장생: '새 가능성이 싹터 오르는 시작의 숨결이다',
  목욕: '들뜨고 흔들리며 이성·유혹·소문에 휘청이기 쉬운 불안한 물결이다',
  관대: '갓 어른이 된 듯 자신감이 붙어 앞으로 나서는 기세다',
  건록: '남에게 기대지 않고 제 발로 서는 단단한 뿌리다',
  제왕: '힘이 정점에 올라 거칠 것 없지만 꺾이기도 쉬운 기세다',
  쇠: '정점을 넘어 속도를 늦추고 내실을 다지는 갈무리다',
  병: '기력이 달려 무리하면 몸이 먼저 비명을 지르는 자리다',
  사: '멈추고 정리하며 한 시절을 매듭짓는 가라앉은 기운이다',
  묘: '곳간 문을 걸어 잠그고 안으로 쌓아 두는 저장의 기운이다',
  절: '끊어졌다가 맨바닥에서 다시 시작하는 단절의 기운이다',
  태: '아직 눈에 보이지 않는 새 흐름이 잉태되는 준비의 기운이다',
  양: '조용히 길러지며 다음 도약을 준비하는 양육의 기운이다',
};

const BRANCH_CLASH_NOTE: Record<string, string> = {
  子午: '물과 불이 정면으로 들이받는 극단의 파도가 되어 오래 굳은 방식과 터전을 한 번에 뒤집는다',
  丑未: '얼어붙은 땅과 메마른 땅이 서로 밀어내며 재산·형제·집안 문제로 땅을 쩍 갈라놓는다',
  寅申: '호랑이와 쇠붙이가 길 위에서 맞붙어 느닷없는 이사·이직·사고수를 끌고 온다',
  卯酉: '나무가 칼날에 잘리듯 인연과 약속이 끊기고 사람이 갈라선다',
  辰戌: '두 개의 창고가 서로를 열어젖혀 묻어 둔 돈과 비밀이 한꺼번에 터져 나온다',
  巳亥: '불과 바다가 맞서며 마음이 쉴 새 없이 흔들리고 몸과 터전이 떠돈다',
};

const BRANCH_PUNISH_NOTE: Record<string, string> = {
  子卯: '무례지형(無禮之刑)이라, 베풀고도 뒤통수를 맞고 예의 없는 사람에게 속앓이를 하게 만든다',
  寅巳: '寅巳申 삼형(三刑)의 무은지형(無恩之刑)이라, 도와준 사람에게서 은혜를 원수로 돌려받고 구설·관재·수술의 불씨를 키운다',
  巳申: '寅巳申 삼형(三刑)의 무은지형(無恩之刑)이라, 도와준 사람에게서 은혜를 원수로 돌려받고 구설·관재·수술의 불씨를 키운다',
  寅申: '寅巳申 삼형(三刑)의 무은지형(無恩之刑)이라, 도와준 사람에게서 은혜를 원수로 돌려받고 구설·관재·수술의 불씨를 키운다',
  丑戌: '丑戌未 삼형(三刑)의 지세지형(持勢之刑)이라, 몫과 서열을 두고 윗사람·혈육과 힘겨루기를 벌이다 문서·송사 다툼으로 번지기 쉽다',
  戌未: '丑戌未 삼형(三刑)의 지세지형(持勢之刑)이라, 몫과 서열을 두고 윗사람·혈육과 힘겨루기를 벌이다 문서·송사 다툼으로 번지기 쉽다',
  丑未: '丑戌未 삼형(三刑)의 지세지형(持勢之刑)이라, 몫과 서열을 두고 윗사람·혈육과 힘겨루기를 벌이다 문서·송사 다툼으로 번지기 쉽다',
};

const SELF_PUNISH_NOTE =
  '자형(自刑)이라, 남이 아니라 스스로 판 함정에 빠져 고집과 자책으로 속을 끓이게 만든다';

const BRANCH_COMBINE_NOTE: Record<string, string> = {
  子丑: '물과 흙이 단단히 엉겨 붙어 문서와 터전이 한 몸처럼 묶이고 쉽게 흔들리지 않는다',
  寅亥: '호랑이와 바다가 손을 맞잡아 새 길을 열어 줄 귀인과 이동의 문이 열린다',
  卯戌: '풀뿌리와 마른 땅이 붙어 냉랭하던 인연이 뜨거운 약속으로 맺힌다',
  辰酉: '흙과 쇠가 맞물려 재주와 기술이 현실의 자리로 단단히 묶인다',
  巳申: '불과 쇠가 얽혀 단련 끝에 쓸 만한 인연이 맺히되 뒷말이 따라붙는다',
  午未: '불과 흙이 서로를 덥혀 마음 맞는 사람과 따뜻한 기반이 생긴다',
};

const STEM_CLASH_NOTE: Record<string, string> = {
  甲庚: '쇠도끼가 거목을 찍듯 윗선의 압박과 단호한 결별이 들이닥친다',
  乙辛: '칼날이 풀뿌리를 베듯 날 선 말과 규칙이 어린 싹을 겁박한다',
  丙壬: '큰 강물이 태양을 덮듯 윗사람·조직과 정면으로 부딪친다',
  丁癸: '찬 빗물이 촛불을 흔들듯 불안과 의심이 마음의 불씨를 꺼뜨리려 한다',
};

const STEM_COMBINE_NOTE: Record<string, string> = {
  甲己: '중정지합(中正之合)이라 신의로 맺는 안정된 관계가 생긴다',
  乙庚: '인의지합(仁義之合)이라 부드러움과 단호함이 손을 잡아 사람과 기회를 얻는다',
  丙辛: '위제지합(威制之合)이라 권위와 재물이 하나로 묶이는 인연이 생긴다',
  丁壬: '인수지합(仁壽之合)이라 문서와 인정이 얽혀 마음과 터전이 한데 묶인다',
  戊癸: '무정지합(無情之合)이라 겉은 담백하되 현실적 이득으로 맺어지는 관계가 생긴다',
};

const CASH_OUT_CLASH_NOTE =
  '새 자금줄(재성)이 낡은 문서·기득권(인성)을 들이받는 재극인(財剋印)의 충이라, 낡은 방식을 버리고 판을 갈아엎을 때 오히려 금맥이 열린다';

// ───────────────────────── 형충회합 해석 ─────────────────────────

function lookupPair(table: Record<string, string>, pair: string): string | undefined {
  const chars = [...pair];
  return table[pair] ?? table[chars.slice().reverse().join('')];
}

function triadElement(chars: readonly string[]): string {
  const hit = TRIAD_ELEMENT.find(([triad]) => chars.every((c) => triad.includes(c)));
  return hit ? (ELEMENT_KO[hit[1]] ?? '') : '';
}

const KIND_SUFFIX: Record<InteractionNote['kind'], string> = {
  천간합: '합', 육합: '합', 삼합: '삼합', 반합: '반합', 천간충: '충', 충: '충', 형: '형',
};

/** 영향력이 큰 작용을 먼저 고르기 위한 가중치. 충·삼합·형이 합보다 서사의 중심이 된다. */
const KIND_BONUS: Record<InteractionNote['kind'], number> = {
  충: 5, 삼합: 3, 형: 2, 천간충: 1, 육합: 0, 천간합: 0, 반합: 0,
};

/** 명리 관용 표기 순서(子卯·子丑·乙庚…)로 글자 쌍을 정렬한다. 운 → 원국 순서로 들어온 값을 그대로 쓰면 '卯子형'처럼 어색하다. */
function canonicalPair(note: InteractionNote): string {
  const chars = [...note.pair];
  if (chars.length !== 2) return note.pair;
  const [a, b] = chars as [string, string];
  const table: Record<string, string> | null =
    note.kind === '충' ? BRANCH_CLASH_NOTE
    : note.kind === '형' ? BRANCH_PUNISH_NOTE
    : note.kind === '육합' ? BRANCH_COMBINE_NOTE
    : note.kind === '천간충' ? STEM_CLASH_NOTE
    : note.kind === '천간합' ? STEM_COMBINE_NOTE
    : null;
  if (table) return table[`${a}${b}`] !== undefined || table[`${b}${a}`] === undefined ? `${a}${b}` : `${b}${a}`;
  if (note.kind === '반합') {
    const triad = TRIAD_ELEMENT.find(([t]) => t.includes(a) && t.includes(b))?.[0];
    if (triad) return triad.indexOf(a) <= triad.indexOf(b) ? `${a}${b}` : `${b}${a}`;
  }
  return note.pair;
}

function noteLabel(note: InteractionNote): string {
  return `${canonicalPair(note)}${KIND_SUFFIX[note.kind]}`;
}

function rankInteractions(interactions: readonly InteractionNote[]): InteractionNote[] {
  return [...interactions].sort(
    (a, b) => Math.abs(b.score) + KIND_BONUS[b.kind] - (Math.abs(a.score) + KIND_BONUS[a.kind])
  );
}

function areaOf(note: InteractionNote): string {
  const areas = [...new Set(note.pillars.map((p) => AREA[p] ?? p))];
  return areas.join(' · ');
}

function isCashOutClash(note: InteractionNote, input: DaeunNarrativeInput): boolean {
  if (note.kind !== '충' || !note.pair) return false;
  const [, target] = [...note.pair];
  if (!target) return false;
  const targetGod = input.natalBranchGod(target as EarthlyBranch);
  return GOD_GROUP[input.branchGod] === '재성' && GOD_GROUP[targetGod] === '인성';
}

function noteMeaning(note: InteractionNote, input: DaeunNarrativeInput): string {
  const chars = [...note.pair];
  switch (note.kind) {
    case '충':
      if (isCashOutClash(note, input)) return CASH_OUT_CLASH_NOTE;
      return lookupPair(BRANCH_CLASH_NOTE, note.pair) ?? '터전과 관계가 크게 흔들리며 변동이 일어난다';
    case '형':
      if (chars.length === 2 && chars[0] === chars[1]) return SELF_PUNISH_NOTE;
      return lookupPair(BRANCH_PUNISH_NOTE, note.pair) ?? '가시 돋친 마찰이 쌓여 구설과 속앓이로 번진다';
    case '육합':
      return lookupPair(BRANCH_COMBINE_NOTE, note.pair) ?? '인연과 터전이 한데 묶여 결속이 단단해진다';
    case '천간충':
      return lookupPair(STEM_CLASH_NOTE, note.pair) ?? '하늘의 기운이 정면으로 부딪쳐 마음이 날카로워진다';
    case '천간합':
      return lookupPair(STEM_COMBINE_NOTE, note.pair) ?? '하늘의 기운이 손을 맞잡아 마음이 한곳으로 묶인다';
    case '삼합': {
      const element = triadElement(chars);
      return `세 기운이 하나의 ${element ? `${element} ` : ''}국(局)을 이뤄 한쪽으로 기세가 크게 쏠린다`;
    }
    case '반합': {
      const element = triadElement(chars);
      return `두 기운이 서로를 끌어당겨 ${element ? `${element} ` : ''}기운을 부풀린다`;
    }
  }
}

/** summary의 앞머리: 대운과 원국이 만나는 장면을 한 구절로 그린다. */
function leadClause(ranked: readonly InteractionNote[], input: DaeunNarrativeInput): string {
  const note = ranked[0];
  if (!note) {
    return `${josa(STEM_HOOK[input.stem], '이', '가')} ${josa(BRANCH_IMG[input.branch], '을', '를')} 딛고 서서`;
  }
  const isBond = (n: InteractionNote) => n.kind === '천간합' || n.kind === '육합';
  const label = isBond(note)
    ? ranked.filter(isBond).slice(0, 2).map(noteLabel).join('·')
    : noteLabel(note);
  const chars = [...note.pair];
  const stemOf = (c: string | undefined) => STEM_HOOK[c as HeavenlyStem] ?? '';
  const branchOf = (c: string | undefined) => BRANCH_IMG[c as EarthlyBranch] ?? '';

  switch (note.kind) {
    case '천간충': {
      const [a, b] = chars;
      return `${josa(stemOf(a), '이', '가')} ${josa(stemOf(b), '과', '와')} 정면으로 맞부딪쳐(${label})`;
    }
    case '천간합': {
      const [a, b] = chars;
      return `${josa(stemOf(a), '이', '가')} ${josa(stemOf(b), '과', '와')} 손을 맞잡고 한 몸처럼 얽혀(${label})`;
    }
    case '충': {
      const [a, b] = chars;
      return `${josa(branchOf(a), '과', '와')} ${josa(branchOf(b), '이', '가')} 정면으로 맞부딪쳐(${label})`;
    }
    case '형': {
      const [a, b] = chars;
      return `${josa(branchOf(a), '과', '와')} ${josa(branchOf(b), '이', '가')} 서로 가시를 세우며 얽혀(${label})`;
    }
    case '육합': {
      const [a, b] = chars;
      return `${josa(branchOf(a), '과', '와')} ${josa(branchOf(b), '이', '가')} 한 몸으로 엉겨 붙어(${label})`;
    }
    case '삼합': {
      const element = triadElement(chars);
      return `세 기운이 하나로 뭉쳐 ${element ? `${element}의 ` : ''}국(局)을 이루니(${label})`;
    }
    case '반합': {
      const [a, b] = chars;
      const element = triadElement(chars);
      return `${josa(branchOf(a), '과', '와')} ${josa(branchOf(b), '이', '가')} 서로를 끌어당겨 ${element ? `${element} ` : ''}기운을 키우니(${label})`;
    }
  }
}

// ───────────────────────── 조립 ─────────────────────────

/** 현재 대운이 끝나기까지 이 햇수 이하로 남으면 교운기로 본다. */
const TURNING_YEARS_LEFT = 2;

function isTurningPoint(input: DaeunNarrativeInput): boolean {
  return (
    input.timing === 'current' &&
    !!input.next &&
    input.yearsLeft !== undefined &&
    input.yearsLeft <= TURNING_YEARS_LEFT
  );
}

function buildDetail(input: DaeunNarrativeInput, ranked: readonly InteractionNote[]): string {
  const { stemGod, branchGod, stem, branch, dayMaster, stage12 } = input;

  const line1 =
    `(신령한 눈빛으로 네 손등을 거칠게 부여잡으며) "똑똑히 봐라! 하늘의 ${josa(`${stemGod}(${stem})`, '은', '는')} ${STEM_PSYCHE[stemGod]}, ` +
    `땅의 ${josa(`${branchGod}(${branch})`, '은', '는')} ${BRANCH_ENV[branchGod]}."`;

  const line2 = `일간 ${dayMaster}에게 이 땅(${branch})은 12운성 ${stage12}의 자리로, ${STAGE_DRAMA[stage12]}.`;

  const primary = ranked[0];
  let line3: string;
  if (primary) {
    const label = noteLabel(primary);
    line3 = `${josa(label, '은', '는')} ${areaOf(primary)}에 닿아 ${noteMeaning(primary, input)}.`;
    const secondary = ranked[1];
    if (secondary) {
      const tail = secondary.tone === 'good' ? '든든한 결속이 한 겹 더해진다' : '파열음이 한 번 더 커진다';
      line3 += ` 여기에 ${noteLabel(secondary)}까지 겹쳐 ${tail}.`;
    }
  } else {
    line3 = `원국과 부딪치는 충·형·합이 없어 ${stemGod}의 기운이 군더더기 없이 곧장 삶에 꽂힌다.`;
  }

  if (isTurningPoint(input) && input.next) {
    line3 += ` 피눈물 흘리며 버텨온 세월은 헛된 것이 아니다! 곧 ${input.next.ganjiLabel}(${input.next.stemGod}) 대운이 문을 박차고 들어오는 교운기니, 네 칼날은 완성되었으니 나가서 세상을 당당히 베어라!`;
  } else {
    line3 += ` 하늘이 너를 거저 고생시킨 줄 아느냐? 천하를 쥐어주려고 황금 갑옷을 담금질하는 법이다!`;
  }

  return [line1, line2, line3].join('\n');
}

function buildFactCheck(input: DaeunNarrativeInput): string {
  if (input.timing === 'future') return FACT_AHEAD[input.stemGod];
  if (input.timing === 'current') return isTurningPoint(input) ? FACT_TURNING : FACT_NOW[input.stemGod];
  return GOD_STAGE[input.stemGod][input.lifeStage].fact;
}

export function buildDaeunNarrative(input: DaeunNarrativeInput): DaeunNarrative {
  const entry = GOD_STAGE[input.stemGod][input.lifeStage];
  const ranked = rankInteractions(input.interactions);

  const summary = `${leadClause(ranked, input)}, ${entry.scene}${TENSE[input.timing]} ${LIFE_NOUN[input.lifeStage]}.`;

  return {
    headline: entry.head,
    summary,
    detail: buildDetail(input, ranked),
    factCheck: buildFactCheck(input),
  };
}
