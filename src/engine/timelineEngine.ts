import { Solar, Lunar } from 'lunar-javascript';
import type { EarthlyBranch, HeavenlyStem } from './types';

/**
 * 일생 대운 · 신년 운세 · 월운 · 타임머신 슬라이더 로컬 룰베이스 엔진.
 * 외부 API 없이 음양오행 / 십신 / 12운성 / 형충회합 / 연두법(월건) 규칙으로만 계산한다.
 * 절기 경계(사주 원국·일진)만 lunar-javascript의 로컬 절기표를 사용한다.
 */

// ───────────────────────── 공개 타입 ─────────────────────────

export type TimelineGender = 'male' | 'female';
export type TimelineCalendarType = 'solar' | 'lunar';

export type InterestKey = 'wealth' | 'business' | 'love' | 'children' | 'health';
export const INTEREST_KEYS: readonly InterestKey[] = ['wealth', 'business', 'love', 'children', 'health'];
export const DEFAULT_INTERESTS: readonly InterestKey[] = ['wealth', 'business'];
export const INTEREST_LABEL: Record<InterestKey, string> = {
  wealth: '재물',
  business: '사업',
  love: '애정',
  children: '자식',
  health: '건강',
};

export const DEFAULT_TARGET_YEAR = 2026;
export const DEFAULT_LIFE_SYNC_RATIO = 80;

export type TenGod =
  | '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인';
export type TenGodGroup = '비겁' | '식상' | '재성' | '관성' | '인성';
export type TwelveStage =
  | '장생' | '목욕' | '관대' | '건록' | '제왕' | '쇠' | '병' | '사' | '묘' | '절' | '태' | '양';
export type StrengthLabel = '신강' | '신약' | '중화';
export type Grade = '대길' | '길' | '평' | '흉' | '대흉';
export type RiskLevel = 'safe' | 'caution' | 'danger';
export type LifeStage = '초년' | '청년' | '중년' | '말년';
export type Confidence = '높음' | '보통' | '낮음';

export interface Ganji {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  /** 예: 丙午 */
  label: string;
}

export interface InteractionNote {
  kind: '천간합' | '천간충' | '육합' | '삼합' | '반합' | '충' | '형';
  /** 작용하는 원국 기둥. 같은 작용이 여러 기둥에 걸리면 '월주·일주'처럼 묶는다. */
  pillar: string;
  tone: 'good' | 'bad';
  /** 점수 영향의 원값 합계 (합 +, 충·형 −) */
  score: number;
  detail: string;
}

export interface TimelineOptions {
  /** `HH:mm`. 생략하거나 '모름'이면 시주를 분석에서 제외한다. */
  birthTime?: string;
  calendarType?: TimelineCalendarType;
  gender?: TimelineGender | null;
  interests?: readonly string[];
  lifeSyncRatio?: number;
  /** '현재' 기준 일자. 테스트와 순수성을 위해 주입할 수 있다. */
  referenceDate?: Date | string;
}

export interface DaeunStory {
  title: string;
  summary: string;
  /** 사용자가 실제 경험과 대조해 싱크로율을 판단할 팩트체크 질문 */
  checkPoints: string[];
}

export interface DaeunPeriod {
  /** 1부터 시작하는 대운 순번 */
  index: number;
  /** 대운 교체일 시점의 만 나이 (International Age) */
  startAge: number;
  /** 구간 표기용 끝 나이 (startAge + 9). 다음 대운은 startAge + 10에서 시작한다. */
  endAge: number;
  /** 표시용 라벨. 예: 만 7세 ~ 16세 (i18n 시에는 startAge/endAge 숫자를 사용) */
  ageLabel: string;
  startYear: number;
  endYear: number;
  /** 대운 교체일 YYYY-MM-DD */
  startDate: string;
  ganji: Ganji;
  stemGod: TenGod;
  branchGod: TenGod;
  stage12: TwelveStage;
  lifeStage: LifeStage;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  theme: string;
  interactions: InteractionNote[];
  /** 과거 대운에만 채워진다. */
  story: DaeunStory | null;
}

export interface LifeDaeunResult {
  birthDate: string;
  gender: TimelineGender;
  dayMaster: HeavenlyStem;
  natalPillars: { year: Ganji; month: Ganji; day: Ganji; time: Ganji | null };
  strength: StrengthLabel;
  direction: '순행' | '역행';
  ageSystem: 'international';
  /** 첫 대운이 시작되는 시점의 만 나이 */
  firstDaeunAge: number;
  /** 기준일 현재 만 나이 */
  currentAge: number;
  currentAgeLabel: string;
  periods: DaeunPeriod[];
}

export interface YearFortuneResult {
  year: number;
  /** 해당 연도 1월 1일 / 12월 31일 시점의 만 나이 */
  ageStart: number;
  ageEnd: number;
  /** 예: 만 36~37세 */
  ageLabel: string;
  ganji: Ganji;
  dayMaster: HeavenlyStem;
  stemGod: TenGod;
  branchGod: TenGod;
  stage12: TwelveStage;
  interactions: InteractionNote[];
  /** 관심사 가중치와 싱크로율 보정이 반영된 0~100 종합 지수 */
  score: number;
  grade: Grade;
  interestScores: Record<InterestKey, number>;
  appliedInterests: InterestKey[];
  syncRatio: number;
  confidence: Confidence;
  keyword: string;
  summary: string;
  opportunities: string[];
  risks: string[];
  /** 해당 연도 중반에 머무는 대운. 성별을 모르거나 첫 대운 이전이면 null */
  daeunGanji?: Ganji | null;
  /** 대운 득근을 반영한 실질 신강/신약 */
  effectiveStrength?: StrengthLabel;
  /** 대운 득근 보정 설명. 보정이 없으면 빈 문자열 */
  strengthNote?: string;
  /** 현재 대운이 일간의 뿌리(득근)가 되는지. 대운을 알 수 없으면 false */
  isDaewunRooted?: boolean;
}

export interface MonthFortune {
  year: number;
  month: number;
  /** 예: 10월 */
  label: string;
  /** 해당 월의 만 나이 (현재 월은 기준일, 그 외는 15일 기준) */
  age: number;
  ageLabel: string;
  yearGanji: Ganji;
  /** 절기월 간지 (월건) */
  ganji: Ganji;
  /** 해당 절기월이 시작되는 절입일 YYYY-MM-DD (확인 불가 시 빈 문자열) */
  jieqiStart: string;
  /** 다음 절기월 절입일 */
  jieqiEnd: string;
  isCurrentMonth: boolean;
  stemGod: TenGod;
  branchGod: TenGod;
  stage12: TwelveStage;
  wealthScore: number;
  overallScore: number;
  grade: Grade;
  riskLevel: RiskLevel;
  keyword: string;
  alerts: string[];
  interactions: InteractionNote[];
  advice: string;
  daeunGanji?: Ganji | null;
  effectiveStrength?: StrengthLabel;
  strengthNote?: string;
  isDaewunRooted?: boolean;
  /** 원국 결핍 식상이 들어오는 식신제살·식신생재 특수 길조 월인지 */
  isSpecialLuck?: boolean;
}

export type TimeSliderMode = 'year' | 'month' | 'day';

export interface TimeSliderFortune {
  mode: TimeSliderMode;
  value: number;
  label: string;
  /** 연 모드는 1월 1일~12월 31일, 월·일 모드는 해당 시점의 만 나이 (두 값이 같음) */
  ageStart: number;
  ageEnd: number;
  ageLabel: string;
  /** 슬라이더 모드에 해당하는 기둥 (연운/월운/일진) */
  ganji: Ganji;
  yearGanji: Ganji;
  monthGanji: Ganji | null;
  dayGanji: Ganji | null;
  stemGod: TenGod;
  branchGod: TenGod;
  stage12: TwelveStage;
  score: number;
  grade: Grade;
  riskLevel: RiskLevel;
  interestScores: Record<InterestKey, number>;
  keyword: string;
  headline: string;
  opportunities: string[];
  risks: string[];
  advice: string;
  interactions: InteractionNote[];
  syncRatio: number;
  confidence: Confidence;
  daeunGanji?: Ganji | null;
  effectiveStrength?: StrengthLabel;
  strengthNote?: string;
  isDaewunRooted?: boolean;
}

// ───────────────────────── 기초 상수 (룰 테이블) ─────────────────────────

type Element = '木' | '火' | '土' | '金' | '水';
type PillarKey = 'year' | 'month' | 'day' | 'time';

const STEMS: readonly HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES: readonly EarthlyBranch[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
];

const STEM_ELEMENT: Record<HeavenlyStem, Element> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

const ELEMENT_GENERATES: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const ELEMENT_CONTROLS: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/** 지지 본기(정기) 천간 — 지지의 십신을 읽을 때 사용한다. */
const BRANCH_MAIN_STEM: Record<EarthlyBranch, HeavenlyStem> = {
  子: '癸', 丑: '己', 寅: '甲', 卯: '乙', 辰: '戊', 巳: '丙',
  午: '丁', 未: '己', 申: '庚', 酉: '辛', 戌: '戊', 亥: '壬',
};

const TEN_GOD_GROUP: Record<TenGod, TenGodGroup> = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성',
  편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
};

const TWELVE_STAGES: readonly TwelveStage[] = [
  '장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양',
];

/** 천간별 장생 지지 인덱스 (戊·己는 火土同宮 원칙에 따라 丙·丁과 같다). */
const LONGEVITY_BRANCH: Record<HeavenlyStem, number> = {
  甲: 11, 乙: 6, 丙: 2, 丁: 9, 戊: 2, 己: 9, 庚: 5, 辛: 0, 壬: 8, 癸: 3,
};

const STEM_COMBINATIONS: ReadonlyArray<readonly [HeavenlyStem, HeavenlyStem, Element]> = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火'],
];
const STEM_CLASHES: readonly string[] = ['甲庚', '乙辛', '丙壬', '丁癸'];

const BRANCH_CLASH: readonly string[] = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
const BRANCH_HARMONY: readonly string[] = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
const BRANCH_PUNISH: readonly string[] = ['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未', '子卯'];
const BRANCH_SELF_PUNISH: readonly string[] = ['辰', '午', '酉', '亥'];

/** 삼합 그룹: [생지, 왕지, 고지] — 반합은 왕지를 포함한 두 글자 */
const TRIADS: ReadonlyArray<readonly [EarthlyBranch, EarthlyBranch, EarthlyBranch]> = [
  ['寅', '午', '戌'], ['亥', '卯', '未'], ['巳', '酉', '丑'], ['申', '子', '辰'],
];

/** 연두법(五虎遁): 연간 % 5 → 인월(寅月) 천간 인덱스 */
const TIGER_MONTH_START_STEM: readonly number[] = [2, 4, 6, 8, 0];

const PILLAR_LABEL: Record<PillarKey, '연주' | '월주' | '일주' | '시주'> = {
  year: '연주', month: '월주', day: '일주', time: '시주',
};

type PillarTarget = '연주' | '월주' | '일주' | '시주' | '원국';

const PILLAR_IMPACT: Record<PillarTarget, string> = {
  연주: '초년 환경·외부 인연',
  월주: '직업·사회적 자리',
  일주: '배우자·본인 내면',
  시주: '자녀·결과물·말년',
  원국: '사주 전체의 판',
};

// ───────────────────────── 서술 텍스트 테이블 ─────────────────────────

const GOD_THEME: Record<TenGod, string> = {
  비견: '동료·경쟁자와 같은 판에서 부딪히며 자립을 시험받는 시기',
  겁재: '내 몫을 나눠 가려는 사람과 지출이 늘어나는 경쟁의 시기',
  식신: '재능과 표현이 꽃피고 먹고사는 기반이 안정되는 시기',
  상관: '틀을 깨고 말과 아이디어로 승부하지만 구설도 따르는 시기',
  편재: '큰돈과 사업 기회가 움직이는 활동량 많은 시기',
  정재: '꾸준한 수입과 안정적인 관계가 쌓이는 시기',
  편관: '압박·책임·시험이 몰려오지만 단련되는 시기',
  정관: '직위·평판·규율이 정돈되고 인정받는 시기',
  편인: '아이디어·공부·변칙적 구상이 늘고 생각이 많아지는 시기',
  정인: '문서·자격·귀인의 도움이 들어오는 보호의 시기',
};

const GOD_ADVICE: Record<TenGod, string> = {
  비견: '지출을 동료·지인과 나누는 일을 줄이고 내 몫과 경계를 분명히 하세요.',
  겁재: '보증·외상·동업 제안은 거절하고 현금 흐름부터 지키세요.',
  식신: '재능을 돈으로 바꾸는 작업(상품화·납품·콘텐츠)에 집중하세요.',
  상관: '말 한마디가 계약을 깨뜨릴 수 있으니 문서와 근거로 소통하세요.',
  편재: '기회가 크게 움직이는 만큼 한 번에 크게 거는 투자는 분산하세요.',
  정재: '고정 수입과 정기 수금을 굳히고 저축·정산을 챙기세요.',
  편관: '무리한 확장을 멈추고 규정·세무·계약상 허점부터 점검하세요.',
  정관: '평판과 신용이 곧 돈이 되는 때이니 약속과 기한을 엄수하세요.',
  편인: '결정이 늦어지기 쉬우니 구상만 하지 말고 작은 실행으로 검증하세요.',
  정인: '계약서·자격·지원 제도 같은 문서 일을 처리하고 귀인의 조언을 구하세요.',
};

const DAEUN_PHRASE: Record<TenGod, string> = {
  비견: '또래·동료와 어깨를 겨루며 자립심을 키우는 흐름',
  겁재: '경쟁과 지출, 사람 때문에 내 몫을 지켜야 하는 흐름',
  식신: '재능을 펼치고 먹고사는 기반을 다지는 흐름',
  상관: '기존 틀에 반발하며 새로운 길을 모색하는 흐름',
  편재: '큰 판과 기회, 돈의 출입이 커지는 흐름',
  정재: '꾸준한 수입과 안정적인 터전을 쌓는 흐름',
  편관: '압박과 책임, 시험이 몰려와 단련되는 흐름',
  정관: '규율과 평판을 얻으며 제도권 안에서 자리 잡는 흐름',
  편인: '남다른 공부와 생각, 방황과 탐색이 깊어지는 흐름',
  정인: '배움과 보호, 윗사람의 도움을 받는 흐름',
};

const LIFE_STAGE_DOMAIN: Record<LifeStage, string> = {
  초년: '학업과 가정환경',
  청년: '진로와 인간관계, 방황과 도전',
  중년: '사업과 재물, 책임의 무게',
  말년: '건강과 노후, 자식 문제',
};

const GROUP_ENVIRONMENT: Record<TenGodGroup, string> = {
  비겁: '또래와 경쟁하고 협력하는 구도',
  식상: '재능을 펼칠 수 있는 무대',
  재성: '돈과 현실적 책임이 따라붙는 구도',
  관성: '규칙과 윗사람의 통제가 강한 분위기',
  인성: '보호자와 배움이 받쳐 주는 울타리',
};

const STAGE_BRIEF: Record<TwelveStage, string> = {
  장생: '새로운 가능성이 싹트는 기운',
  목욕: '들뜨고 흔들리기 쉬운 불안정한 기운',
  관대: '자신감이 붙어 앞으로 나서는 기운',
  건록: '자기 힘으로 서는 실속 있는 기운',
  제왕: '정점에 올라 힘이 가장 센 기운',
  쇠: '정점을 지나 속도를 줄이는 기운',
  병: '기력이 약해져 무리하면 탈이 나는 기운',
  사: '멈추고 정리해야 하는 가라앉은 기운',
  묘: '안으로 저장하고 갈무리하는 기운',
  절: '끊어졌다가 다시 시작하는 단절의 기운',
  태: '새 흐름이 잉태되는 준비의 기운',
  양: '조용히 길러지는 양육의 기운',
};

const CHECKPOINTS: Record<LifeStage, Record<TenGodGroup, string>> = {
  초년: {
    비겁: '형제·친구 관계가 학창 시절의 중심이었거나 또래와의 경쟁·다툼이 잦았나요?',
    식상: '공부보다 특기·취미·말솜씨로 두각을 나타냈거나 튀는 행동이 잦았나요?',
    재성: '집안 경제 형편이 학업 선택에 영향을 주었거나 일찍 돈의 현실을 체감했나요?',
    관성: '부모·교사의 엄격한 통제나 시험 압박이 강했나요?',
    인성: '어른의 보살핌 속에서 공부에 몰입했거나 이사·전학 같은 환경 변화가 있었나요?',
  },
  청년: {
    비겁: '친구·동료와 동업하거나 돈을 빌려주고 빌리며 갈등을 겪은 적이 있나요?',
    식상: '진로를 자주 바꾸거나 창작·기술·표현 분야에서 길을 찾으려 방황했나요?',
    재성: '첫 직장이나 알바로 돈벌이를 시작하며 연애·소비 문제가 커졌나요?',
    관성: '취업·시험·조직 적응에서 큰 압박이나 중대한 선택을 겪었나요?',
    인성: '자격증·학업·유학 등 배움에 투자했거나 귀인의 도움을 받았나요?',
  },
  중년: {
    비겁: '사업·직장에서 동업자나 경쟁자와 재물 다툼, 보증·빌려준 돈 문제를 겪었나요?',
    식상: '독립·창업이나 전문성으로 승부를 걸며 조직과 충돌한 적이 있나요?',
    재성: '재물이 크게 늘거나 투자·사업 확장으로 큰돈이 오갔나요?',
    관성: '승진·책임 증가, 관재·구설 같은 사회적 압박이 컸나요?',
    인성: '이직 준비·자격·부동산 문서처럼 안정을 구하는 변화가 있었나요?',
  },
  말년: {
    비겁: '형제·친구·동년배와의 교류나 재산 분배 문제가 부각되었나요?',
    식상: '자식·제자·후배에게 베풀거나 새로운 취미·활동을 시작했나요?',
    재성: '자산 정리·상속·노후 자금 문제가 중심이었나요?',
    관성: '건강 관리나 사회적 역할 정리에서 압박을 느꼈나요?',
    인성: '쉼과 돌봄, 정신적 안정과 학문·종교적 관심이 커졌나요?',
  },
};

const INTEREST_OPPORTUNITY: Record<InterestKey, string> = {
  wealth: '재물 흐름이 열려 있어 수금·정산·고정 수익을 굳히기 좋은 때입니다.',
  business: '사업 확장과 새 거래처·상품을 시도하기에 기운이 받쳐 줍니다.',
  love: '인연과 관계가 움직여 마음을 표현하거나 관계를 정리하기 좋은 때입니다.',
  children: '자녀·후배·결과물과 관련된 일에서 좋은 소식이 기대됩니다.',
  health: '컨디션이 안정돼 운동·검진 등 몸을 다지는 루틴을 만들기 좋습니다.',
};

const INTEREST_RISK: Record<InterestKey, string> = {
  wealth: '재물 누수와 예상 밖 지출 위험이 있으니 큰 결제와 보증을 보류하세요.',
  business: '사업상 마찰과 판단 착오 위험이 있으니 확장보다 점검이 우선입니다.',
  love: '관계에서 오해와 감정 충돌이 커지기 쉬우니 중요한 결정은 미루세요.',
  children: '자녀·후배·결과물 문제로 신경 쓸 일이 생기기 쉬우니 대화를 늘리세요.',
  health: '체력 저하와 사고수에 유의하고 무리한 일정은 줄이세요.',
};

type FlagId =
  | 'gunGeop' | 'jaeDaSinYak' | 'sangGwanGyeonGwan' | 'hyoSinTalSik'
  | 'chilSal' | 'sikSinSaengJae' | 'jaeSeongAnjeong' | 'inSeongGwiin'
  | 'sikSinJeSalSaengJae' | 'sikSinJeSal';

interface FlagInfo {
  name: string;
  severity: 'danger' | 'caution' | 'good';
  text: string;
  advice: string;
}

const FLAGS: Record<FlagId, FlagInfo> = {
  gunGeop: {
    name: '군겁쟁재',
    severity: 'danger',
    text: '비겁이 재성을 나눠 가지는 구도라 미수금 독촉·보증·동업 분쟁으로 돈이 새기 쉽습니다.',
    advice: '외상·보증·공동 투자를 끊고 미수금은 서면으로 독촉해 기한 안에 회수하세요.',
  },
  jaeDaSinYak: {
    name: '재다신약',
    severity: 'danger',
    text: '재물은 눈앞에 많지만 이를 감당할 체력과 기반이 부족해 욕심내면 오히려 잃습니다.',
    advice: '수익 욕심보다 감당 가능한 규모로 줄이고 믿을 만한 파트너와 역할을 나누세요.',
  },
  sangGwanGyeonGwan: {
    name: '상관견관',
    severity: 'caution',
    text: '말과 행동이 윗사람·조직과 부딪혀 구설과 신용 문제가 생기기 쉽습니다.',
    advice: '불만은 공개적으로 말하지 말고 서면·근거로 정리해 전달하세요.',
  },
  hyoSinTalSik: {
    name: '효신탈식',
    severity: 'caution',
    text: '생각만 많아지고 실행과 수익 기반이 막히기 쉬운 구도입니다.',
    advice: '새 구상을 늘리지 말고 진행 중인 일 하나를 끝내 수익으로 연결하세요.',
  },
  chilSal: {
    name: '칠살 압박',
    severity: 'caution',
    text: '기반이 약한 상태에서 편관의 압박이 들어와 관재·구설·과로 위험이 커집니다.',
    advice: '무리한 책임을 줄이고 규정·계약·세무 쪽 허점을 먼저 점검하세요.',
  },
  sikSinSaengJae: {
    name: '식신생재',
    severity: 'good',
    text: '재능과 노동이 고정 수익으로 이어지는 결실의 구도입니다.',
    advice: '새 판을 벌이기보다 이미 돌아가는 수익 라인을 구조화하고 정산을 확정하세요.',
  },
  jaeSeongAnjeong: {
    name: '재성 안정',
    severity: 'good',
    text: '꾸준한 수입과 신용이 쌓이는 안정적인 재물 흐름입니다.',
    advice: '고정 수입과 정기 수금을 굳히고 저축·정산을 챙기세요.',
  },
  inSeongGwiin: {
    name: '인성 귀인',
    severity: 'good',
    text: '문서·계약·윗사람의 도움이 들어오는 보호의 구도입니다.',
    advice: '계약서·자격·지원 제도를 정리하고 귀인에게 조언을 구하세요.',
  },
  sikSinJeSalSaengJae: {
    name: '식신제살·식신생재',
    severity: 'good',
    text:
      '원국에 없던 식상이 들어와 태왕한 관살의 압박을 풀어 주고(제살) 곧바로 재성으로 이어지는(생재) 특수 길조라, ' +
      '막혀 있던 재물 회수와 계약 성사의 문이 열립니다.',
    advice:
      '정체되었던 자금줄이 풀리고 실질적 사업 결실을 거두는 시기입니다. 미뤄 둔 수금·계약·사업 확정을 이 달에 마무리하세요.',
  },
  sikSinJeSal: {
    name: '식신제살',
    severity: 'good',
    text: '결핍되어 있던 식상이 들어와 태왕한 관살의 압박을 눌러 주는 압박 해소의 구도입니다.',
    advice: '눌려 있던 일과 책임을 실행력으로 정리하고, 압박의 원인이 된 현안부터 해소하세요.',
  },
};

/** 원국 식상이 이 비율 이하이면 '무식상'으로 본다. */
const NO_SIKSANG_MAX_SHARE = 10;
/** 원국 관성이 이 비율 이상이면 '관살 태왕'으로 본다. */
const GWANSAL_DOMINANT_MIN_SHARE = 40;
const SPECIAL_FLOOR_FULL = 85;
const SPECIAL_FLOOR_JESAL = 72;

// ───────────────────────── 유틸 ─────────────────────────

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function stemAt(index: number): HeavenlyStem {
  return STEMS[mod(index, 10)] ?? '甲';
}

function branchAt(index: number): EarthlyBranch {
  return BRANCHES[mod(index, 12)] ?? '子';
}

function toStem(value: unknown): HeavenlyStem | null {
  return typeof value === 'string' ? (STEMS.find((s) => s === value) ?? null) : null;
}

function toBranch(value: unknown): EarthlyBranch | null {
  return typeof value === 'string' ? (BRANCHES.find((b) => b === value) ?? null) : null;
}

function makeGanji(stem: HeavenlyStem, branch: EarthlyBranch): Ganji {
  return { stem, branch, label: `${stem}${branch}` };
}

/** 60갑자 순번(0=甲子). 음양이 맞지 않는 조합이면 -1. */
function ganjiIndex(stem: HeavenlyStem, branch: EarthlyBranch): number {
  const s = STEMS.indexOf(stem);
  const b = BRANCHES.indexOf(branch);
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === s && i % 12 === b) return i;
  }
  return -1;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

interface YmdParts {
  year: number;
  month: number;
  day: number;
}

/**
 * 만 나이(International Age): 기준일 연도 − 출생 연도에서, 올해 생일이 아직 지나지 않았으면 1을 뺀다.
 * 2월 29일생은 평년에 3월 1일이 되어야 생일이 지난 것으로 본다. 출생 이전이면 0.
 */
export function calculateInternationalAge(birth: YmdParts, reference: YmdParts): number {
  const birthdayPassed =
    reference.month > birth.month || (reference.month === birth.month && reference.day >= birth.day);
  return Math.max(0, reference.year - birth.year - (birthdayPassed ? 0 : 1));
}

export function formatAgeLabel(age: number): string {
  return `만 ${age}세`;
}

export function formatAgeRangeLabel(startAge: number, endAge: number): string {
  return `만 ${startAge}세 ~ ${endAge}세`;
}

/** 연도 전체에 걸친 만 나이 구간 표기. 예: 만 36~37세, 생일이 1/1이면 만 36세 */
function formatAgeSpanLabel(startAge: number, endAge: number): string {
  return startAge === endAge ? formatAgeLabel(startAge) : `만 ${startAge}~${endAge}세`;
}

function ymdFromUtcStamp(stamp: number): YmdParts {
  const d = new Date(stamp);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function parseYmd(input: unknown): { year: number; month: number; day: number } | null {
  if (typeof input !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function isRealSolarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

function parseHm(input: unknown): { hour: number; minute: number } | null {
  if (typeof input !== 'string') return null;
  const match = /^(\d{2}):(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour > 23 || minute > 59 ? null : { hour, minute };
}

function resolveReferenceDate(ref: Date | string | undefined): { year: number; month: number; day: number } {
  if (typeof ref === 'string') {
    const parsed = parseYmd(ref);
    if (parsed) return parsed;
  }
  const date = ref instanceof Date && !Number.isNaN(ref.getTime()) ? ref : new Date();
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

function normalizeSyncRatio(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(Math.round(value), 0, 100)
    : DEFAULT_LIFE_SYNC_RATIO;
}

const INTEREST_ALIASES: Record<string, InterestKey> = {
  wealth: 'wealth', 재물: 'wealth',
  business: 'business', 사업: 'business',
  love: 'love', 애정: 'love',
  children: 'children', 자식: 'children',
  health: 'health', 건강: 'health',
};

export function normalizeInterests(values: readonly unknown[] | undefined | null): InterestKey[] {
  const result: InterestKey[] = [];
  if (Array.isArray(values)) {
    for (const value of values) {
      const key = typeof value === 'string' ? INTEREST_ALIASES[value.trim()] : undefined;
      if (key && !result.includes(key)) result.push(key);
    }
  }
  return result.length > 0 ? result : [...DEFAULT_INTERESTS];
}

// ───────────────────────── 십신 / 12운성 / 형충회합 ─────────────────────────

function isYang(stem: HeavenlyStem): boolean {
  return STEMS.indexOf(stem) % 2 === 0;
}

export function getTenGod(dayMaster: HeavenlyStem, other: HeavenlyStem): TenGod {
  const me = STEM_ELEMENT[dayMaster];
  const target = STEM_ELEMENT[other];
  const samePolarity = isYang(dayMaster) === isYang(other);
  if (me === target) return samePolarity ? '비견' : '겁재';
  if (ELEMENT_GENERATES[me] === target) return samePolarity ? '식신' : '상관';
  if (ELEMENT_CONTROLS[me] === target) return samePolarity ? '편재' : '정재';
  if (ELEMENT_CONTROLS[target] === me) return samePolarity ? '편관' : '정관';
  return samePolarity ? '편인' : '정인';
}

export function getBranchTenGod(dayMaster: HeavenlyStem, branch: EarthlyBranch): TenGod {
  return getTenGod(dayMaster, BRANCH_MAIN_STEM[branch]);
}

export function getTwelveStage(stem: HeavenlyStem, branch: EarthlyBranch): TwelveStage {
  const start = LONGEVITY_BRANCH[stem];
  const target = BRANCHES.indexOf(branch);
  const offset = isYang(stem) ? mod(target - start, 12) : mod(start - target, 12);
  return TWELVE_STAGES[offset] ?? '장생';
}

function hasPair(pairs: readonly string[], a: string, b: string): boolean {
  return pairs.includes(`${a}${b}`) || pairs.includes(`${b}${a}`);
}

// ───────────────────────── 원국 컨텍스트 ─────────────────────────

interface NatalPillar {
  key: PillarKey;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

interface NatalContext {
  dayMaster: HeavenlyStem;
  pillars: NatalPillar[];
  timeKnown: boolean;
  strengthRatio: number;
  strength: StrengthLabel;
  groupCounts: Record<TenGodGroup, number>;
  /** 원국 천간·지지(일간 포함) 전체에서 각 십신 그룹이 차지하는 비율(%) */
  groupShare: Record<TenGodGroup, number>;
  gender: TimelineGender | null;
}

interface LibEightChar {
  getYearGan(): string;
  getYearZhi(): string;
  getMonthGan(): string;
  getMonthZhi(): string;
  getDayGan(): string;
  getDayZhi(): string;
  getTimeGan(): string;
  getTimeZhi(): string;
  getYun(gender: number, sect?: number): LibYun;
}

interface LibSolar {
  getYear(): number;
  getMonth(): number;
  getDay(): number;
  getLunar(): LibLunar;
}

interface LibJie {
  getSolar(): LibSolar;
}

interface LibLunar {
  getEightChar(): LibEightChar;
  getSolar(): LibSolar;
  getPrevJie(wholeDay?: boolean): LibJie;
  getNextJie(wholeDay?: boolean): LibJie;
}

interface LibYun {
  isForward(): boolean;
  getStartSolar(): LibSolar;
}

interface SolarFactory {
  fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): LibSolar;
}

interface LunarFactory {
  fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): LibLunar;
}

const SolarApi = Solar as unknown as SolarFactory;
const LunarApi = Lunar as unknown as LunarFactory;

interface Chart {
  ctx: NatalContext;
  eightChar: LibEightChar;
  birthSolar: { year: number; month: number; day: number };
}

function readPillar(stem: string, branch: string): { stem: HeavenlyStem; branch: EarthlyBranch } | null {
  const s = toStem(stem);
  const b = toBranch(branch);
  return s && b ? { stem: s, branch: b } : null;
}

function buildStrength(pillars: NatalPillar[], dayMaster: HeavenlyStem) {
  const branchWeight: Record<PillarKey, number> = { year: 1, month: 3, day: 2, time: 1 };
  let support = 0;
  let total = 0;
  const groupCounts: Record<TenGodGroup, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };

  for (const pillar of pillars) {
    if (pillar.key !== 'day') {
      const group = TEN_GOD_GROUP[getTenGod(dayMaster, pillar.stem)];
      groupCounts[group] += 1;
      total += 1;
      if (group === '비겁' || group === '인성') support += 1;
    }
    const branchGroup = TEN_GOD_GROUP[getBranchTenGod(dayMaster, pillar.branch)];
    groupCounts[branchGroup] += 1;
    const weight = branchWeight[pillar.key];
    total += weight;
    if (branchGroup === '비겁' || branchGroup === '인성') support += weight;
  }

  const ratio = total > 0 ? support / total : 0.5;
  const strength: StrengthLabel = ratio >= 0.55 ? '신강' : ratio <= 0.45 ? '신약' : '중화';
  return { ratio, strength, groupCounts };
}

function buildGroupShare(pillars: NatalPillar[], dayMaster: HeavenlyStem): Record<TenGodGroup, number> {
  const counts: Record<TenGodGroup, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  let total = 0;
  for (const pillar of pillars) {
    counts[TEN_GOD_GROUP[getTenGod(dayMaster, pillar.stem)]] += 1;
    counts[TEN_GOD_GROUP[getBranchTenGod(dayMaster, pillar.branch)]] += 1;
    total += 2;
  }
  const share: Record<TenGodGroup, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  if (total === 0) return share;
  for (const group of Object.keys(counts) as TenGodGroup[]) {
    share[group] = (counts[group] / total) * 100;
  }
  return share;
}

function loadChart(birthDate: string, options: TimelineOptions): Chart | null {
  try {
    const date = parseYmd(birthDate);
    if (!date) return null;

    const calendarType: TimelineCalendarType = options.calendarType === 'lunar' ? 'lunar' : 'solar';
    const time = parseHm(options.birthTime);
    const hour = time?.hour ?? 12;
    const minute = time?.minute ?? 0;

    if (calendarType === 'solar' && !isRealSolarDate(date.year, date.month, date.day)) return null;

    const solar =
      calendarType === 'solar'
        ? SolarApi.fromYmdHms(date.year, date.month, date.day, hour, minute, 0)
        : LunarApi.fromYmdHms(date.year, date.month, date.day, hour, minute, 0).getSolar();
    const eightChar = solar.getLunar().getEightChar();

    const year = readPillar(eightChar.getYearGan(), eightChar.getYearZhi());
    const month = readPillar(eightChar.getMonthGan(), eightChar.getMonthZhi());
    const day = readPillar(eightChar.getDayGan(), eightChar.getDayZhi());
    const hourPillar = readPillar(eightChar.getTimeGan(), eightChar.getTimeZhi());
    if (!year || !month || !day || !hourPillar) return null;

    const timeKnown = time !== null;
    const pillars: NatalPillar[] = [
      { key: 'year', ...year },
      { key: 'month', ...month },
      { key: 'day', ...day },
    ];
    if (timeKnown) pillars.push({ key: 'time', ...hourPillar });

    const { ratio, strength, groupCounts } = buildStrength(pillars, day.stem);
    const gender = options.gender === 'male' || options.gender === 'female' ? options.gender : null;

    return {
      ctx: {
        dayMaster: day.stem,
        pillars,
        timeKnown,
        strengthRatio: ratio,
        strength,
        groupCounts,
        groupShare: buildGroupShare(pillars, day.stem),
        gender,
      },
      eightChar,
      birthSolar: { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() },
    };
  } catch {
    return null;
  }
}

// ───────────────────────── 형충회합 ─────────────────────────

interface Luck {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

interface RawInteraction {
  kind: InteractionNote['kind'];
  pillar: PillarTarget;
  pair: string;
  score: number;
  /** 재성이 인성을 충하되 뒷받침이 있어 '문서의 현금화'로 재해석된 충 */
  cashOut?: boolean;
}

/**
 * @param cashOutAllowed 대운 지지가 일간을 받쳐 주거나 식신제살·생재 특수 길조일 때 true.
 *   이때 재성이 인성을 충하는 경우(예: 子午沖)는 손재수가 아니라 문서의 현금화·사업 확장의 결실로 본다.
 */
function findInteractions(ctx: NatalContext, luck: Luck, cashOutAllowed = false): RawInteraction[] {
  const notes: RawInteraction[] = [];
  const push = (
    kind: InteractionNote['kind'],
    pillar: PillarTarget,
    score: number,
    pair: string,
    cashOut?: boolean
  ) => {
    notes.push(cashOut ? { kind, pillar, pair, score, cashOut } : { kind, pillar, pair, score });
  };

  const luckStemGroup = TEN_GOD_GROUP[getTenGod(ctx.dayMaster, luck.stem)];
  const luckBranchGroup = TEN_GOD_GROUP[getBranchTenGod(ctx.dayMaster, luck.branch)];

  for (const pillar of ctx.pillars) {
    const label = PILLAR_LABEL[pillar.key];

    const combo = STEM_COMBINATIONS.find(
      ([a, b]) => (a === luck.stem && b === pillar.stem) || (b === luck.stem && a === pillar.stem)
    );
    if (combo) push('천간합', label, 3, `${luck.stem}${pillar.stem}`);
    else if (hasPair(STEM_CLASHES, luck.stem, pillar.stem)) {
      const stemCashOut =
        cashOutAllowed &&
        luckStemGroup === '재성' &&
        TEN_GOD_GROUP[getTenGod(ctx.dayMaster, pillar.stem)] === '인성';
      push('천간충', label, stemCashOut ? 2 : -3, `${luck.stem}${pillar.stem}`, stemCashOut);
    }

    const pair = `${luck.branch}${pillar.branch}`;
    if (hasPair(BRANCH_CLASH, luck.branch, pillar.branch)) {
      const branchCashOut =
        cashOutAllowed &&
        luckBranchGroup === '재성' &&
        TEN_GOD_GROUP[getBranchTenGod(ctx.dayMaster, pillar.branch)] === '인성';
      push('충', label, branchCashOut ? 4 : -6, pair, branchCashOut);
    } else if (hasPair(BRANCH_HARMONY, luck.branch, pillar.branch)) {
      push('육합', label, 3, pair);
    } else if (
      hasPair(BRANCH_PUNISH, luck.branch, pillar.branch) ||
      (luck.branch === pillar.branch && BRANCH_SELF_PUNISH.includes(luck.branch))
    ) {
      push('형', label, -4, pair);
    } else {
      const triad = TRIADS.find(
        (t) => t.includes(luck.branch) && t.includes(pillar.branch) && luck.branch !== pillar.branch
      );
      if (triad && (triad[1] === luck.branch || triad[1] === pillar.branch)) {
        push('반합', label, 1.5, pair);
      }
    }
  }

  const natalBranches = new Set<EarthlyBranch>(ctx.pillars.map((p) => p.branch));
  for (const triad of TRIADS) {
    if (!triad.includes(luck.branch)) continue;
    const others = triad.filter((b) => b !== luck.branch);
    if (others.every((b) => natalBranches.has(b))) {
      push('삼합', '원국', 4, triad.join(''));
    }
  }

  return notes;
}

const INTERACTION_SUFFIX: Record<InteractionNote['kind'], string> = {
  천간합: '合', 육합: '合', 삼합: '合', 반합: '合', 천간충: '沖', 충: '沖', 형: '刑',
};

/** 같은 작용이 여러 기둥에 걸리면 하나의 안내문으로 묶는다. */
function mergeInteractions(raw: readonly RawInteraction[]): InteractionNote[] {
  const groups = new Map<string, RawInteraction[]>();
  for (const item of raw) {
    const key = `${item.kind}|${item.pair}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const notes: InteractionNote[] = [];
  for (const items of groups.values()) {
    const first = items[0];
    if (!first) continue;
    const score = items.reduce((sum, item) => sum + item.score, 0);
    const pillars = items.map((item) => item.pillar);
    const impacts = [...new Set(pillars.map((p) => PILLAR_IMPACT[p]))];
    const tone = first.score >= 0 ? 'good' : 'bad';
    const effect = first.cashOut
      ? '재성이 인성(문서)을 흔드는 충이지만 뒷받침이 있어 문서의 현금화·과감한 사업 확장으로 결실을 맺는 움직임'
      : tone === 'good'
        ? '결속과 협력의 계기'
        : '변동과 마찰에 유의';
    notes.push({
      kind: first.kind,
      pillar: pillars.join('·'),
      tone,
      score,
      detail: `${pillars.join('·')}(${impacts.join(' / ')}) ${first.pair}${INTERACTION_SUFFIX[first.kind]} — ${effect}`,
    });
  }
  return notes.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 6);
}

// ───────────────────────── 대운 득근 · 동적 신강/신약 ─────────────────────────

interface DaeunTrack {
  forward: boolean;
  monthIndex: number;
  startYear: number;
  startMonth: number;
  startDay: number;
}

/** 특정 시점에 머무는 대운과, 그 대운이 일간에게 주는 뿌리(득근) 정보 */
interface DaeunInfo {
  ganji: Ganji;
  luck: Luck;
  /** 1부터 시작하는 대운 순번 */
  index: number;
  stemGod: TenGod;
  branchGod: TenGod;
  stage: TwelveStage;
  /** 득근 점수: 천간이 비겁·인성이면 +1, 지지가 비겁·인성이면 +2, 지지가 장생·건록·제왕이면 +1 */
  supportScore: number;
  /** 대운 지지가 일간을 받쳐 주는지 (비겁·인성이거나 12운성 장생·건록·제왕) */
  backsBranch: boolean;
  /** 대운이 일간의 실질적인 뿌리가 되는지(득근). 득근 점수가 임계값 이상이면 true */
  isDaewunRooted: boolean;
}

/** 득근 점수가 이 값 이상이면 대운이 일간의 실질적인 뿌리가 된다고 본다. */
const DAEUN_SUPPORT_THRESHOLD = 2;
const ROOTED_STAGES: readonly TwelveStage[] = ['장생', '건록', '제왕'];

function loadDaeunTrack(chart: Chart): DaeunTrack | null {
  try {
    const gender = chart.ctx.gender;
    if (!gender) return null;
    const monthPillar = chart.ctx.pillars.find((p) => p.key === 'month');
    if (!monthPillar) return null;
    const monthIndex = ganjiIndex(monthPillar.stem, monthPillar.branch);
    if (monthIndex < 0) return null;

    const yun = chart.eightChar.getYun(gender === 'male' ? 1 : 0, 2);
    const start = yun.getStartSolar();
    return {
      forward: yun.isForward(),
      monthIndex,
      startYear: start.getYear(),
      startMonth: start.getMonth(),
      startDay: start.getDay(),
    };
  } catch {
    return null;
  }
}

/** 성별을 모르거나 첫 대운이 시작되기 전이면 null (원국만으로 판단한다). */
function daeunInfoAt(chart: Chart, date: YmdParts): DaeunInfo | null {
  const track = loadDaeunTrack(chart);
  if (!track) return null;

  const stampOf = (index: number) =>
    Date.UTC(track.startYear + 10 * (index - 1), track.startMonth - 1, track.startDay);
  const stamp = Date.UTC(date.year, date.month - 1, date.day);
  if (stamp < stampOf(1)) return null;

  let index = 1;
  while (index < 12 && stamp >= stampOf(index + 1)) index += 1;

  const pillarIndex = mod(track.monthIndex + (track.forward ? index : -index), 60);
  const luck: Luck = { stem: stemAt(pillarIndex), branch: branchAt(pillarIndex) };
  const { dayMaster } = chart.ctx;
  const stemGod = getTenGod(dayMaster, luck.stem);
  const branchGod = getBranchTenGod(dayMaster, luck.branch);
  const stage = getTwelveStage(dayMaster, luck.branch);

  const isSupportGroup = (god: TenGod) => {
    const group = TEN_GOD_GROUP[god];
    return group === '비겁' || group === '인성';
  };
  const branchSupport = isSupportGroup(branchGod);
  const branchRooted = branchSupport || ROOTED_STAGES.includes(stage);
  const supportScore = (isSupportGroup(stemGod) ? 1 : 0) + (branchSupport ? 2 : branchRooted ? 1 : 0);

  return {
    ganji: makeGanji(luck.stem, luck.branch),
    luck,
    index,
    stemGod,
    branchGod,
    stage,
    supportScore,
    backsBranch: branchRooted,
    isDaewunRooted: supportScore >= DAEUN_SUPPORT_THRESHOLD,
  };
}

/**
 * 원국이 신약이어도 현재 대운이 비겁·인성으로 일간의 뿌리가 되어 주면(득근) 실질적 중화로 보정한다.
 * 이때 재성·식상을 감당할 수 있으므로 재다신약 감점을 적용하지 않는다.
 */
function applyDaeunStrength(
  ctx: NatalContext,
  daeun: DaeunInfo | null
): { ctx: NatalContext; adjusted: boolean; note: string } {
  if (!daeun || ctx.strength !== '신약' || !daeun.isDaewunRooted) {
    return { ctx, adjusted: false, note: '' };
  }
  return {
    ctx: { ...ctx, strength: '중화', strengthRatio: Math.max(ctx.strengthRatio, 0.5) },
    adjusted: true,
    note:
      `원국은 신약이나 현재 대운 ${daeun.ganji.label}(${daeun.stemGod}/${daeun.branchGod}, ${daeun.stage})이 ` +
      '일간의 뿌리가 되어 실질적 중화 상태로 판정했습니다. 재성·식상을 감당할 수 있어 재다신약 감점은 적용하지 않습니다.',
  };
}

// ───────────────────────── 식신제살 · 식신생재 특수 길조 ─────────────────────────

interface SpecialLuck {
  kind: 'full' | 'jeSal';
  flag: FlagId;
  /** 특수 길조일 때 보장하는 최소 점수 */
  floor: number;
  sikSangGod: TenGod;
}

/**
 * 무식상(식상 ≤10%) + 관살 태왕(관성 ≥40%) 명식에 식상이 들어오면 식신제살,
 * 식상과 재성이 함께(천간·지지) 들어오면 식신제살 + 식신생재로 본다.
 */
function detectSpecialLuck(ctx: NatalContext, luck: Luck): SpecialLuck | null {
  if (ctx.groupShare.식상 > NO_SIKSANG_MAX_SHARE || ctx.groupShare.관성 < GWANSAL_DOMINANT_MIN_SHARE) {
    return null;
  }
  const stemGod = getTenGod(ctx.dayMaster, luck.stem);
  const branchGod = getBranchTenGod(ctx.dayMaster, luck.branch);
  const sikSangGod = [stemGod, branchGod].find((god) => TEN_GOD_GROUP[god] === '식상');
  if (!sikSangGod) return null;

  const hasJae = [stemGod, branchGod].some((god) => TEN_GOD_GROUP[god] === '재성');
  return hasJae
    ? { kind: 'full', flag: 'sikSinJeSalSaengJae', floor: SPECIAL_FLOOR_FULL, sikSangGod }
    : { kind: 'jeSal', flag: 'sikSinJeSal', floor: SPECIAL_FLOOR_JESAL, sikSangGod };
}

// ───────────────────────── 점수 모델 ─────────────────────────

const FAVOR: Record<StrengthLabel, Record<TenGodGroup, number>> = {
  신강: { 비겁: -1, 식상: 1, 재성: 1, 관성: 1, 인성: -0.7 },
  신약: { 비겁: 0.8, 식상: -0.7, 재성: -1, 관성: -0.8, 인성: 1 },
  중화: { 비겁: -0.2, 식상: 0.4, 재성: 0.4, 관성: 0.3, 인성: 0.2 },
};

type GodPoints = Partial<Record<TenGod, number>>;

function interestGodPoints(interest: InterestKey, gender: TimelineGender | null): GodPoints {
  switch (interest) {
    case 'wealth':
      return { 정재: 10, 편재: 10, 식신: 4, 상관: 2, 겁재: -10, 비견: -5, 편관: -2 };
    case 'business':
      return { 편재: 8, 식신: 8, 상관: 6, 정재: 4, 정관: 2, 편관: 2, 겁재: -6, 비견: -3, 편인: -4 };
    case 'love':
      if (gender === 'male') return { 정재: 10, 편재: 6, 식신: 2, 겁재: -8, 비견: -3 };
      if (gender === 'female') return { 정관: 10, 편관: 6, 정인: 1, 식신: 1, 상관: -6 };
      return { 정재: 5, 정관: 5, 편재: 3, 편관: 3, 겁재: -4, 상관: -4 };
    case 'children':
      if (gender === 'male') return { 정관: 10, 편관: 6, 식신: 1, 상관: -1 };
      if (gender === 'female') return { 식신: 10, 상관: 6, 편인: -4, 정인: -1 };
      return { 식신: 5, 정관: 5, 상관: 3, 편관: 3, 편인: -3 };
    case 'health':
      return { 정인: 4, 비견: 3, 편인: 1, 편관: -6, 상관: -3, 겁재: -2, 편재: -1 };
  }
}

/** 관심사별로 원국의 어느 기둥과의 작용을 더 크게 볼지 정하는 가중치 */
const PILLAR_EMPHASIS: Record<InterestKey, Record<PillarTarget, number>> = {
  wealth: { 연주: 0.8, 월주: 1.4, 일주: 1.0, 시주: 0.9, 원국: 1 },
  business: { 연주: 0.8, 월주: 1.5, 일주: 1.0, 시주: 0.9, 원국: 1 },
  love: { 연주: 0.7, 월주: 0.9, 일주: 1.8, 시주: 0.8, 원국: 1 },
  children: { 연주: 0.7, 월주: 0.8, 일주: 1.0, 시주: 1.8, 원국: 1 },
  health: { 연주: 1.0, 월주: 1.2, 일주: 1.3, 시주: 1.1, 원국: 1.1 },
};

const STAGE_POINTS: Record<TwelveStage, number> = {
  장생: 2, 목욕: -1, 관대: 2, 건록: 3, 제왕: 3, 쇠: 0, 병: -2, 사: -3, 묘: -1, 절: -2, 태: 0, 양: 1,
};

interface Evaluation {
  luck: Luck;
  stemGod: TenGod;
  branchGod: TenGod;
  stage: TwelveStage;
  interactions: InteractionNote[];
  scores: Record<InterestKey, number>;
  special: SpecialLuck | null;
}

interface EvaluateOptions {
  daeun: DaeunInfo | null;
  /** 연·월 단위 평가에서만 식신제살·생재 특수 길조를 적용한다. */
  allowSpecial: boolean;
}

function evaluateLuck(
  ctx: NatalContext,
  luck: Luck,
  options: EvaluateOptions = { daeun: null, allowSpecial: false }
): Evaluation {
  const stemGod = getTenGod(ctx.dayMaster, luck.stem);
  const branchGod = getBranchTenGod(ctx.dayMaster, luck.branch);
  const stage = getTwelveStage(ctx.dayMaster, luck.branch);
  const special = options.allowSpecial ? detectSpecialLuck(ctx, luck) : null;
  // 대운 지지가 받쳐 주거나 특수 길조면, 재성이 인성을 충하는 것을 손재수가 아니라 현금화로 읽는다.
  const rawInteractions = findInteractions(ctx, luck, special !== null || (options.daeun?.backsBranch ?? false));

  const favor = FAVOR[ctx.strength];
  const base = favor[TEN_GOD_GROUP[stemGod]] * 8 + favor[TEN_GOD_GROUP[branchGod]] * 6;

  const scores = {} as Record<InterestKey, number>;
  for (const interest of INTEREST_KEYS) {
    const points = interestGodPoints(interest, ctx.gender);
    const overlay = (points[stemGod] ?? 0) + 0.7 * (points[branchGod] ?? 0);
    const stagePoints = STAGE_POINTS[stage] * (interest === 'health' ? 2 : 1);
    const emphasis = PILLAR_EMPHASIS[interest];
    const interaction = clamp(
      rawInteractions.reduce((sum, item) => sum + item.score * emphasis[item.pillar], 0),
      -18,
      12
    );
    scores[interest] = clamp(Math.round(50 + base + overlay + stagePoints + interaction), 0, 100);
  }

  return { luck, stemGod, branchGod, stage, interactions: mergeInteractions(rawInteractions), scores, special };
}

function combineEvaluations(
  parts: ReadonlyArray<{ weight: number; evaluation: Evaluation }>
): Record<InterestKey, number> {
  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0) || 1;
  const result = {} as Record<InterestKey, number>;
  for (const interest of INTEREST_KEYS) {
    const sum = parts.reduce((acc, part) => acc + part.evaluation.scores[interest] * part.weight, 0);
    result[interest] = sum / totalWeight;
  }
  return result;
}

/** 과거 일생 싱크로율이 낮을수록 룰 점수의 신뢰도가 낮다고 보고 50점(중립)쪽으로 수렴시킨다. */
function calibrate(score: number, syncRatio: number): number {
  const factor = 0.6 + 0.4 * (syncRatio / 100);
  return clamp(Math.round(50 + (score - 50) * factor), 0, 100);
}

function confidenceOf(syncRatio: number): Confidence {
  return syncRatio >= 80 ? '높음' : syncRatio >= 50 ? '보통' : '낮음';
}

function gradeOf(score: number): Grade {
  if (score >= 80) return '대길';
  if (score >= 65) return '길';
  if (score >= 45) return '평';
  if (score >= 30) return '흉';
  return '대흉';
}

function summarizeScores(
  raw: Record<InterestKey, number>,
  interests: readonly InterestKey[],
  syncRatio: number
) {
  const interestScores = {} as Record<InterestKey, number>;
  let weightSum = 0;
  let weighted = 0;
  for (const interest of INTEREST_KEYS) {
    const calibrated = calibrate(raw[interest], syncRatio);
    interestScores[interest] = calibrated;
    const weight = interests.includes(interest) ? 1 : 0.35;
    weightSum += weight;
    weighted += calibrated * weight;
  }
  return { interestScores, overall: clamp(Math.round(weighted / weightSum), 0, 100) };
}

// ───────────────────────── 재물 플래그 (군겁쟁재 · 식신생재 등) ─────────────────────────

/** 특수 길조에서는 압박이 해소되고 식상이 정당한 역할을 하므로, 이와 충돌하는 경보 플래그를 걷어 낸다. */
const SPECIAL_SUPPRESSED_FLAGS: readonly FlagId[] = [
  'jaeDaSinYak', 'chilSal', 'sangGwanGyeonGwan', 'sikSinSaengJae', 'jaeSeongAnjeong',
];

function detectFlags(ctx: NatalContext, lucks: readonly Luck[], special: SpecialLuck | null = null): FlagId[] {
  const primary = lucks[lucks.length - 1];
  if (!primary) return [];

  const counts: Record<TenGodGroup, number> = { ...ctx.groupCounts };
  for (const luck of lucks) {
    counts[TEN_GOD_GROUP[getTenGod(ctx.dayMaster, luck.stem)]] += 1;
    counts[TEN_GOD_GROUP[getBranchTenGod(ctx.dayMaster, luck.branch)]] += 1;
  }

  const stemGod = getTenGod(ctx.dayMaster, primary.stem);
  const branchGod = getBranchTenGod(ctx.dayMaster, primary.branch);
  const primaryGroups = [TEN_GOD_GROUP[stemGod], TEN_GOD_GROUP[branchGod]];
  const stemGroup = TEN_GOD_GROUP[stemGod];

  const flags: FlagId[] = [];

  const gunGeop = primaryGroups.includes('비겁') && counts.비겁 >= 3 && counts.재성 >= 1 && counts.재성 < counts.비겁;
  if (gunGeop) flags.push('gunGeop');

  if (ctx.strength === '신약' && counts.재성 >= 3 && primaryGroups.includes('재성')) {
    flags.push('jaeDaSinYak');
  }

  const natalGods = ctx.pillars.flatMap((p) => [
    ...(p.key === 'day' ? [] : [getTenGod(ctx.dayMaster, p.stem)]),
    getBranchTenGod(ctx.dayMaster, p.branch),
  ]);
  const hasNatal = (god: TenGod) => natalGods.includes(god);

  if ((stemGod === '상관' && (hasNatal('정관') || branchGod === '정관')) || (stemGod === '정관' && hasNatal('상관'))) {
    flags.push('sangGwanGyeonGwan');
  }

  if (stemGod === '편인' && hasNatal('식신')) flags.push('hyoSinTalSik');

  if (stemGod === '편관' && ctx.strength === '신약') flags.push('chilSal');

  // 신약 사주는 재성을 감당하기 어려우므로 식상생재·재성 안정을 '결실'로 보지 않는다.
  const canBearWealth = ctx.strength !== '신약';
  const sikSang =
    (primaryGroups.includes('식상') && counts.재성 >= 1) || (stemGroup === '재성' && counts.식상 >= 2);
  if (sikSang && !gunGeop && canBearWealth) flags.push('sikSinSaengJae');

  if (stemGod === '정재' && !gunGeop && canBearWealth && !flags.includes('sikSinSaengJae')) {
    flags.push('jaeSeongAnjeong');
  }

  if (stemGod === '정인') flags.push('inSeongGwiin');

  if (special) {
    return [special.flag, ...flags.filter((flag) => !SPECIAL_SUPPRESSED_FLAGS.includes(flag))];
  }
  return flags;
}

function riskLevelOf(score: number, flags: readonly FlagId[]): RiskLevel {
  const level = (value: RiskLevel): number => (value === 'danger' ? 2 : value === 'caution' ? 1 : 0);
  let flagLevel: RiskLevel = 'safe';
  for (const flag of flags) {
    const severity = FLAGS[flag].severity;
    if (severity === 'danger') flagLevel = 'danger';
    else if (severity === 'caution' && flagLevel === 'safe') flagLevel = 'caution';
  }
  // 점수가 충분히 높으면 플래그 경보를 한 단계 낮춘다.
  if (score >= 65 && flagLevel === 'danger') flagLevel = 'caution';
  const scoreLevel: RiskLevel = score <= 35 ? 'danger' : score <= 50 ? 'caution' : 'safe';
  return level(flagLevel) >= level(scoreLevel) ? flagLevel : scoreLevel;
}

// ───────────────────────── 시점 평가 (연·월·일 공통 경로) ─────────────────────────

interface TargetReport {
  yearGanji: Ganji;
  monthGanji: Ganji | null;
  dayGanji: Ganji | null;
  focus: Evaluation;
  flags: FlagId[];
  scores: { interestScores: Record<InterestKey, number>; overall: number };
  riskLevel: RiskLevel;
  keyword: string;
  opportunities: string[];
  risks: string[];
  advice: string;
  daeun: DaeunInfo | null;
  /** 대운 득근을 반영한 실질 신강/신약 */
  effectiveStrength: StrengthLabel;
  strengthNote: string;
  special: SpecialLuck | null;
}

function yearGanjiOf(year: number): Ganji {
  return makeGanji(stemAt(year - 4), branchAt(year - 4));
}

/** 연두법: 연간으로 인월(寅月) 천간을 정하고 월지 순서대로 천간을 이어 붙인다. 절기월은 해당 월 15일 기준. */
function monthGanjiOf(yearGanji: Ganji, month: number): Ganji {
  const branchIndex = month % 12;
  const order = mod(branchIndex - 2, 12);
  const startStem = TIGER_MONTH_START_STEM[mod(STEMS.indexOf(yearGanji.stem), 5)] ?? 2;
  return makeGanji(stemAt(startStem + order), branchAt(branchIndex));
}

function pillarsOfDate(
  year: number,
  month: number,
  day: number
): { year: Ganji; month: Ganji; day: Ganji } | null {
  try {
    if (!isRealSolarDate(year, month, day)) return null;
    const eight = SolarApi.fromYmdHms(year, month, day, 12, 0, 0).getLunar().getEightChar();
    const y = readPillar(eight.getYearGan(), eight.getYearZhi());
    const m = readPillar(eight.getMonthGan(), eight.getMonthZhi());
    const d = readPillar(eight.getDayGan(), eight.getDayZhi());
    if (!y || !m || !d) return null;
    return {
      year: makeGanji(y.stem, y.branch),
      month: makeGanji(m.stem, m.branch),
      day: makeGanji(d.stem, d.branch),
    };
  } catch {
    return null;
  }
}

function jieqiBounds(year: number, month: number): { start: string; end: string } {
  try {
    const lunar = SolarApi.fromYmdHms(year, month, 15, 12, 0, 0).getLunar();
    const fmt = (s: LibSolar) => formatYmd(s.getYear(), s.getMonth(), s.getDay());
    return { start: fmt(lunar.getPrevJie(true).getSolar()), end: fmt(lunar.getNextJie(true).getSolar()) };
  } catch {
    return { start: '', end: '' };
  }
}

function buildReport(
  natalCtx: NatalContext,
  pillars: { year: Ganji; month: Ganji | null; day: Ganji | null },
  interests: readonly InterestKey[],
  syncRatio: number,
  daeun: DaeunInfo | null = null
): TargetReport {
  const strengthAdjust = applyDaeunStrength(natalCtx, daeun);
  const ctx = strengthAdjust.ctx;
  const evalOptions: EvaluateOptions = { daeun, allowSpecial: pillars.day === null };

  const yearEval = evaluateLuck(ctx, pillars.year, evalOptions);
  const monthEval = pillars.month ? evaluateLuck(ctx, pillars.month, evalOptions) : null;
  const dayEval = pillars.day ? evaluateLuck(ctx, pillars.day, evalOptions) : null;

  const parts: Array<{ weight: number; evaluation: Evaluation }> = [];
  let focus: Evaluation;
  if (dayEval && monthEval) {
    parts.push({ weight: 0.5, evaluation: dayEval }, { weight: 0.3, evaluation: monthEval }, { weight: 0.2, evaluation: yearEval });
    focus = dayEval;
  } else if (monthEval) {
    parts.push({ weight: 0.7, evaluation: monthEval }, { weight: 0.3, evaluation: yearEval });
    focus = monthEval;
  } else {
    parts.push({ weight: 1, evaluation: yearEval });
    focus = yearEval;
  }

  const lucks: Luck[] = [yearEval.luck];
  if (monthEval) lucks.push(monthEval.luck);
  if (dayEval) lucks.push(dayEval.luck);

  const special = focus.special;
  const flags = detectFlags(ctx, lucks, special);
  let scores = summarizeScores(combineEvaluations(parts), interests, syncRatio);
  if (special) {
    // 특수 길조는 룰 기반의 확정 판정이므로 싱크로율 보정 이후에도 최소 점수를 보장한다.
    const interestScores = { ...scores.interestScores };
    interestScores.wealth = Math.max(interestScores.wealth, special.floor);
    interestScores.business = Math.max(interestScores.business, special.floor);
    scores = { interestScores, overall: Math.max(scores.overall, special.floor) };
  }
  const riskLevel =
    special && !flags.includes('gunGeop') ? 'safe' : riskLevelOf(scores.overall, flags);

  const firstFlag = flags[0];
  let keyword = firstFlag ? FLAGS[firstFlag].name : `${focus.stemGod}운`;
  if (firstFlag === 'sikSinSaengJae') {
    const sikSangGod = [focus.stemGod, focus.branchGod].find((god) => TEN_GOD_GROUP[god] === '식상');
    keyword = `${sikSangGod ?? '식신'}생재`;
  }
  if (special && firstFlag === special.flag) {
    keyword =
      special.kind === 'full'
        ? `${special.sikSangGod}제살·${special.sikSangGod}생재`
        : `${special.sikSangGod}제살`;
  }

  const opportunities: string[] = [];
  const risks: string[] = [];
  for (const flag of flags) {
    const info = FLAGS[flag];
    (info.severity === 'good' ? opportunities : risks).push(info.text);
  }
  if (strengthAdjust.adjusted) opportunities.push(strengthAdjust.note);
  for (const interest of interests) {
    const score = scores.interestScores[interest];
    if (score >= 62) opportunities.push(`[${INTEREST_LABEL[interest]}] ${INTEREST_OPPORTUNITY[interest]}`);
    else if (score <= 45) risks.push(`[${INTEREST_LABEL[interest]}] ${INTEREST_RISK[interest]}`);
  }
  for (const note of focus.interactions) {
    (note.tone === 'good' ? opportunities : risks).push(note.detail);
  }
  if (opportunities.length === 0) opportunities.push(`${focus.stemGod}의 기운(${GOD_THEME[focus.stemGod]})을 차분히 활용하세요.`);
  if (risks.length === 0) risks.push('두드러진 위험 신호는 없지만 과신과 충동적인 결정은 피하세요.');

  const advice = firstFlag ? FLAGS[firstFlag].advice : GOD_ADVICE[focus.stemGod];

  return {
    yearGanji: pillars.year,
    monthGanji: pillars.month,
    dayGanji: pillars.day,
    focus,
    flags,
    scores,
    riskLevel,
    keyword,
    opportunities: opportunities.slice(0, 4),
    risks: risks.slice(0, 4),
    advice,
    daeun,
    effectiveStrength: ctx.strength,
    strengthNote: strengthAdjust.note,
    special,
  };
}

// ───────────────────────── [기능 1] 일생 대운 ─────────────────────────

function lifeStageOf(startAge: number): LifeStage {
  const mid = startAge + 4;
  if (mid < 20) return '초년';
  if (mid < 40) return '청년';
  if (mid < 60) return '중년';
  return '말년';
}

function buildDaeunStory(
  ganji: Ganji,
  startAge: number,
  endAge: number,
  lifeStage: LifeStage,
  stemGod: TenGod,
  branchGod: TenGod,
  stage: TwelveStage,
  interactions: readonly InteractionNote[]
): DaeunStory {
  const domain = LIFE_STAGE_DOMAIN[lifeStage];
  const stemGroup = TEN_GOD_GROUP[stemGod];
  const branchGroup = TEN_GOD_GROUP[branchGod];

  const sentences = [
    `${domain} 영역에서는 ${DAEUN_PHRASE[stemGod]}이 강했던 시기입니다.`,
    `지지(환경)는 ${GROUP_ENVIRONMENT[branchGroup]}였습니다.`,
    `일간의 기운은 ${stage} — ${STAGE_BRIEF[stage]}이었습니다.`,
  ];
  const clash = interactions.find((note) => note.kind === '충' || note.kind === '형');
  if (clash) sentences.push(`${clash.pillar}과 부딪혀 이사·이직·관계 변화 같은 환경 변동이 있었을 가능성이 큽니다.`);

  return {
    title: `${lifeStage} ${formatAgeRangeLabel(startAge, endAge)} · ${ganji.label} 대운`,
    summary: sentences.join(' '),
    checkPoints: [CHECKPOINTS[lifeStage][stemGroup]],
  };
}

export function calculateLifeDaeun(
  birthDate: string,
  birthTime: string,
  gender: TimelineGender,
  calendarType: TimelineCalendarType,
  referenceDate?: Date | string
): LifeDaeunResult | null {
  try {
    if (gender !== 'male' && gender !== 'female') return null;
    const chart = loadChart(birthDate, { birthTime, calendarType, gender });
    if (!chart) return null;

    const { ctx, eightChar, birthSolar } = chart;
    const monthPillar = ctx.pillars.find((p) => p.key === 'month');
    const yearPillar = ctx.pillars.find((p) => p.key === 'year');
    const dayPillar = ctx.pillars.find((p) => p.key === 'day');
    if (!monthPillar || !yearPillar || !dayPillar) return null;

    const monthIndex = ganjiIndex(monthPillar.stem, monthPillar.branch);
    if (monthIndex < 0) return null;

    const yun = eightChar.getYun(gender === 'male' ? 1 : 0, 2);
    const forward = yun.isForward();
    const startSolar = yun.getStartSolar();
    const startYear = startSolar.getYear();
    const startMonth = startSolar.getMonth();
    const startDay = startSolar.getDay();

    const ref = resolveReferenceDate(referenceDate);
    const refStamp = Date.UTC(ref.year, ref.month - 1, ref.day);
    const currentAge = calculateInternationalAge(birthSolar, ref);
    const stampOf = (index: number) => Date.UTC(startYear + 10 * (index - 1), startMonth - 1, startDay);

    const PERIOD_COUNT = 9;
    const periods: DaeunPeriod[] = [];
    for (let i = 1; i <= PERIOD_COUNT; i += 1) {
      const pillarIndex = mod(monthIndex + (forward ? i : -i), 60);
      const ganji = makeGanji(stemAt(pillarIndex), branchAt(pillarIndex));
      const luck: Luck = { stem: ganji.stem, branch: ganji.branch };

      const startStamp = stampOf(i);
      const nextStamp = stampOf(i + 1);
      const startYmd = ymdFromUtcStamp(startStamp);
      const lastDayYmd = ymdFromUtcStamp(nextStamp - 24 * 60 * 60 * 1000);

      // 라이브러리의 getStartAge는 세는나이이므로 쓰지 않고, 실제 대운 교체일 기준 만 나이로 직접 계산한다.
      const startAge = calculateInternationalAge(birthSolar, startYmd);
      // 교체일 간격이 정확히 10년이므로 구간 표기는 겹치지 않게 startAge + 9로 둔다.
      const endAge = startAge + 9;
      const periodStartYear = startYmd.year;

      const isPast = refStamp >= nextStamp;
      const isCurrent = refStamp >= startStamp && refStamp < nextStamp;
      const isFuture = refStamp < startStamp;

      const stemGod = getTenGod(ctx.dayMaster, luck.stem);
      const branchGod = getBranchTenGod(ctx.dayMaster, luck.branch);
      const stage12 = getTwelveStage(ctx.dayMaster, luck.branch);
      const interactions = mergeInteractions(findInteractions(ctx, luck));
      const lifeStage = lifeStageOf(startAge);

      periods.push({
        index: i,
        startAge,
        endAge,
        ageLabel: formatAgeRangeLabel(startAge, endAge),
        startYear: periodStartYear,
        endYear: lastDayYmd.year,
        startDate: formatYmd(startYmd.year, startYmd.month, startYmd.day),
        ganji,
        stemGod,
        branchGod,
        stage12,
        lifeStage,
        isPast,
        isCurrent,
        isFuture,
        theme: `${LIFE_STAGE_DOMAIN[lifeStage]} 영역에서 ${DAEUN_PHRASE[stemGod]}${isPast ? '이 강했던' : isCurrent ? '이 한창인' : '이 이어질'} 시기`,
        interactions,
        story: isPast
          ? buildDaeunStory(ganji, startAge, endAge, lifeStage, stemGod, branchGod, stage12, interactions)
          : null,
      });
    }

    const toGanji = (p: NatalPillar) => makeGanji(p.stem, p.branch);
    const timePillar = ctx.pillars.find((p) => p.key === 'time');
    return {
      birthDate,
      gender,
      dayMaster: ctx.dayMaster,
      natalPillars: {
        year: toGanji(yearPillar),
        month: toGanji(monthPillar),
        day: toGanji(dayPillar),
        time: timePillar ? toGanji(timePillar) : null,
      },
      strength: ctx.strength,
      direction: forward ? '순행' : '역행',
      ageSystem: 'international',
      firstDaeunAge: calculateInternationalAge(birthSolar, ymdFromUtcStamp(stampOf(1))),
      currentAge,
      currentAgeLabel: formatAgeLabel(currentAge),
      periods,
    };
  } catch {
    return null;
  }
}

// ───────────────────────── [기능 2] 신년 운세 ─────────────────────────

export function calculateYearFortune(
  birthDate: string,
  targetYear: number = DEFAULT_TARGET_YEAR,
  interests: readonly string[] = DEFAULT_INTERESTS,
  lifeSyncRatio: number = DEFAULT_LIFE_SYNC_RATIO,
  options: TimelineOptions = {}
): YearFortuneResult | null {
  try {
    if (!Number.isInteger(targetYear) || targetYear < 1900 || targetYear > 2100) return null;
    const chart = loadChart(birthDate, options);
    if (!chart) return null;

    const appliedInterests = normalizeInterests(interests);
    const syncRatio = normalizeSyncRatio(lifeSyncRatio);
    const ganji = yearGanjiOf(targetYear);
    // 해가 바뀌는 중간에 대운이 교체될 수 있으므로 연중(7월 1일)에 머무는 대운을 기준으로 삼는다.
    const daeun = daeunInfoAt(chart, { year: targetYear, month: 7, day: 1 });
    const report = buildReport(
      chart.ctx,
      { year: ganji, month: null, day: null },
      appliedInterests,
      syncRatio,
      daeun
    );
    const { focus } = report;

    const ageStart = calculateInternationalAge(chart.birthSolar, { year: targetYear, month: 1, day: 1 });
    const ageEnd = calculateInternationalAge(chart.birthSolar, { year: targetYear, month: 12, day: 31 });
    const ageLabel = formatAgeSpanLabel(ageStart, ageEnd);

    const strengthText = report.strengthNote
      ? `원국 ${chart.ctx.strength}(대운 ${daeun?.ganji.label ?? ''} 득근으로 실질 ${report.effectiveStrength})`
      : chart.ctx.strength;
    const summary =
      `${targetYear}년(${ageLabel}) ${ganji.label}년은 ${chart.ctx.dayMaster}(${STEM_ELEMENT[chart.ctx.dayMaster]}) 일간·${strengthText} 사주에게 ` +
      `천간 ${focus.stemGod}, 지지 ${focus.branchGod}의 해이며 12운성은 ${focus.stage}입니다. ${GOD_THEME[focus.stemGod]}입니다.`;

    return {
      year: targetYear,
      ageStart,
      ageEnd,
      ageLabel,
      ganji,
      dayMaster: chart.ctx.dayMaster,
      stemGod: focus.stemGod,
      branchGod: focus.branchGod,
      stage12: focus.stage,
      interactions: focus.interactions,
      score: report.scores.overall,
      grade: gradeOf(report.scores.overall),
      interestScores: report.scores.interestScores,
      appliedInterests,
      syncRatio,
      confidence: confidenceOf(syncRatio),
      keyword: report.keyword,
      summary,
      opportunities: report.opportunities,
      risks: report.risks,
      daeunGanji: daeun?.ganji ?? null,
      effectiveStrength: report.effectiveStrength,
      strengthNote: report.strengthNote,
      isDaewunRooted: daeun?.isDaewunRooted ?? false,
    };
  } catch {
    return null;
  }
}

// ───────────────────────── [기능 3] 올해 남은 월운 ─────────────────────────

/** 기준일이 해당 월이면 기준일, 아니면 15일 시점의 만 나이를 쓴다. */
function monthAgeDate(year: number, month: number, today: YmdParts): YmdParts {
  return today.year === year && today.month === month ? today : { year, month, day: 15 };
}

function buildMonthFortune(
  chart: Chart,
  year: number,
  month: number,
  interests: readonly InterestKey[],
  syncRatio: number,
  isCurrentMonth: boolean,
  today: YmdParts
): MonthFortune {
  // 1월은 입춘 전이므로 전년도 세운에 속한다.
  const yearGanji = yearGanjiOf(month === 1 ? year - 1 : year);
  const ganji = monthGanjiOf(yearGanji, month);
  const daeun = daeunInfoAt(chart, monthAgeDate(year, month, today));
  const report = buildReport(chart.ctx, { year: yearGanji, month: ganji, day: null }, interests, syncRatio, daeun);
  const { focus } = report;

  // 월운 재물 점수는 재물·사업 흐름을 함께 본다.
  const wealthScore = clamp(
    Math.round(report.scores.interestScores.wealth * 0.7 + report.scores.interestScores.business * 0.3),
    0,
    100
  );

  const alerts: string[] = [];
  for (const flag of report.flags) {
    const info = FLAGS[flag];
    if (info.severity !== 'good') alerts.push(`${info.name}: ${info.text}`);
  }
  for (const note of focus.interactions) {
    if (note.tone === 'bad' && alerts.length < 3) alerts.push(note.detail);
  }

  const bounds = jieqiBounds(year, month);
  const age = calculateInternationalAge(chart.birthSolar, monthAgeDate(year, month, today));
  return {
    year,
    month,
    label: `${month}월`,
    age,
    ageLabel: formatAgeLabel(age),
    yearGanji,
    ganji,
    jieqiStart: bounds.start,
    jieqiEnd: bounds.end,
    isCurrentMonth,
    stemGod: focus.stemGod,
    branchGod: focus.branchGod,
    stage12: focus.stage,
    wealthScore,
    overallScore: report.scores.overall,
    grade: gradeOf(report.scores.overall),
    riskLevel:
      report.special && !report.flags.includes('gunGeop') ? 'safe' : riskLevelOf(wealthScore, report.flags),
    keyword: report.keyword,
    alerts,
    interactions: focus.interactions,
    advice: report.advice,
    daeunGanji: daeun?.ganji ?? null,
    effectiveStrength: report.effectiveStrength,
    strengthNote: report.strengthNote,
    isDaewunRooted: daeun?.isDaewunRooted ?? false,
    isSpecialLuck: report.special !== null,
  };
}

export function calculateRemainingMonthsFortune(
  birthDate: string,
  currentDate: Date | string = new Date(),
  options: TimelineOptions = {}
): MonthFortune[] {
  try {
    const chart = loadChart(birthDate, options);
    if (!chart) return [];

    const now = resolveReferenceDate(currentDate);
    const interests = normalizeInterests(options.interests);
    const syncRatio = normalizeSyncRatio(options.lifeSyncRatio);

    const months: MonthFortune[] = [];
    for (let month = now.month; month <= 12; month += 1) {
      months.push(buildMonthFortune(chart, now.year, month, interests, syncRatio, month === now.month, now));
    }
    return months;
  } catch {
    return [];
  }
}

// ───────────────────────── [기능 4] 타임머신 슬라이더 ─────────────────────────

/**
 * value 규칙
 * - year : 연도 (예: 2027)
 * - month: YYYYMM (예: 202610). 1~12만 주면 기준 연도의 해당 월
 * - day  : YYYYMMDD (예: 20261003)
 */
export function queryTimeSliderFortune(
  birthDate: string,
  mode: TimeSliderMode,
  value: number,
  options: TimelineOptions = {}
): TimeSliderFortune | null {
  try {
    if (!Number.isInteger(value)) return null;
    const chart = loadChart(birthDate, options);
    if (!chart) return null;

    const interests = normalizeInterests(options.interests);
    const syncRatio = normalizeSyncRatio(options.lifeSyncRatio);
    const ref = resolveReferenceDate(options.referenceDate);

    let pillars: { year: Ganji; month: Ganji | null; day: Ganji | null };
    let label: string;
    let ageStart: number;
    let ageEnd: number;
    let daeunDate: YmdParts;

    if (mode === 'year') {
      if (value < 1900 || value > 2100) return null;
      pillars = { year: yearGanjiOf(value), month: null, day: null };
      label = `${value}년`;
      daeunDate = { year: value, month: 7, day: 1 };
      ageStart = calculateInternationalAge(chart.birthSolar, { year: value, month: 1, day: 1 });
      ageEnd = calculateInternationalAge(chart.birthSolar, { year: value, month: 12, day: 31 });
    } else if (mode === 'month') {
      const year = value >= 1900 * 100 ? Math.floor(value / 100) : ref.year;
      const month = value >= 1900 * 100 ? value % 100 : value;
      if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;
      const yearGanji = yearGanjiOf(month === 1 ? year - 1 : year);
      pillars = { year: yearGanji, month: monthGanjiOf(yearGanji, month), day: null };
      label = `${year}년 ${month}월`;
      daeunDate = monthAgeDate(year, month, ref);
      ageStart = calculateInternationalAge(chart.birthSolar, daeunDate);
      ageEnd = ageStart;
    } else if (mode === 'day') {
      const year = Math.floor(value / 10000);
      const month = Math.floor(value / 100) % 100;
      const day = value % 100;
      const date = pillarsOfDate(year, month, day);
      if (year < 1900 || year > 2100 || !date) return null;
      pillars = { year: date.year, month: date.month, day: date.day };
      label = formatYmd(year, month, day);
      daeunDate = { year, month, day };
      ageStart = calculateInternationalAge(chart.birthSolar, { year, month, day });
      ageEnd = ageStart;
    } else {
      return null;
    }

    const daeun = daeunInfoAt(chart, daeunDate);
    const report = buildReport(chart.ctx, pillars, interests, syncRatio, daeun);
    const { focus } = report;
    const firstFlag = report.flags[0];
    const headline = firstFlag
      ? `${report.keyword} — ${FLAGS[firstFlag].text}`
      : `${focus.stemGod}·${focus.branchGod}운 — ${GOD_THEME[focus.stemGod]}`;
    const focusGanji = mode === 'day' ? (pillars.day ?? pillars.year) : mode === 'month' ? (pillars.month ?? pillars.year) : pillars.year;

    return {
      mode,
      value,
      label,
      ageStart,
      ageEnd,
      ageLabel: formatAgeSpanLabel(ageStart, ageEnd),
      ganji: focusGanji,
      yearGanji: pillars.year,
      monthGanji: pillars.month,
      dayGanji: pillars.day,
      stemGod: focus.stemGod,
      branchGod: focus.branchGod,
      stage12: focus.stage,
      score: report.scores.overall,
      grade: gradeOf(report.scores.overall),
      riskLevel: report.riskLevel,
      interestScores: report.scores.interestScores,
      keyword: report.keyword,
      headline,
      opportunities: report.opportunities,
      risks: report.risks,
      advice: report.advice,
      interactions: focus.interactions,
      syncRatio,
      confidence: confidenceOf(syncRatio),
      daeunGanji: daeun?.ganji ?? null,
      effectiveStrength: report.effectiveStrength,
      strengthNote: report.strengthNote,
      isDaewunRooted: daeun?.isDaewunRooted ?? false,
    };
  } catch {
    return null;
  }
}

// ───────────────────────── [기능 5] 구조적 심층 맥락 (AI 프롬프트용) ─────────────────────────

export interface StructuralImbalance {
  /** 예: 식상(金) */
  group: string;
  /** 원국 전체에서 차지하는 비율(%) */
  percent: number;
}

export interface StructuralMonthPoint {
  month: number;
  ganji: string;
  keyword: string;
  score: number;
  riskLevel: RiskLevel;
  /** 식신제살·식신생재 특수 길조 월 */
  isTurningPoint: boolean;
}

export interface StructuralContext {
  /** 2~3줄의 명리 메타데이터 (줄바꿈으로 구분). AI 프롬프트에 그대로 주입한다. */
  summary: string;
  /** 올해 남은 11~12월 중 결핍 식상이 들어오는 식신제살·식신생재 전환점이 있는지 */
  hasTurningPoint: boolean;
  dayMaster: string;
  natalStrength: StrengthLabel;
  /** 비율 10% 이하의 결핍 십신군 */
  deficient: StructuralImbalance[];
  /** 비율 40% 이상의 과다 십신군 */
  excessive: StructuralImbalance[];
  daeun: { ganji: string; isDaewunRooted: boolean; effectiveStrength: StrengthLabel } | null;
  keyMonths: StructuralMonthPoint[];
}

const RISK_LABEL_KO: Record<RiskLevel, string> = { safe: '안전', caution: '주의', danger: '위험' };

/** 일간 기준으로 각 십신군이 어떤 오행에 해당하는지 */
function groupElement(dayMaster: HeavenlyStem, group: TenGodGroup): Element {
  const self = STEM_ELEMENT[dayMaster];
  const all: readonly Element[] = ['木', '火', '土', '金', '水'];
  switch (group) {
    case '비겁':
      return self;
    case '식상':
      return ELEMENT_GENERATES[self];
    case '재성':
      return ELEMENT_CONTROLS[self];
    case '관성':
      return all.find((e) => ELEMENT_CONTROLS[e] === self) ?? self;
    case '인성':
      return all.find((e) => ELEMENT_GENERATES[e] === self) ?? self;
  }
}

/**
 * 원국의 극단적 불균형, 현재 대운의 득근 여부, 올해 남은 핵심 월(특히 11~12월)의 전환점을
 * 2~3줄의 명리 메타데이터로 요약한다. 외부 호출 없이 로컬 룰 엔진으로만 계산한다.
 *
 * 대운 득근은 성별이 있어야 판정할 수 있으므로, 성별·태어난 시간·달력 종류는 `options`로 받는다.
 * 생년월일이 유효하지 않으면 null.
 */
export function getStructuralContext(
  birthDate: string,
  currentDate: Date | string = new Date(),
  options: TimelineOptions = {}
): StructuralContext | null {
  try {
    const chart = loadChart(birthDate, options);
    if (!chart) return null;

    const { ctx } = chart;
    const now = resolveReferenceDate(currentDate);
    const groups: TenGodGroup[] = ['비겁', '식상', '재성', '관성', '인성'];
    const tag = (group: TenGodGroup): StructuralImbalance => ({
      group: `${group}(${groupElement(ctx.dayMaster, group)})`,
      percent: Math.round(ctx.groupShare[group]),
    });
    const deficient = groups.filter((g) => ctx.groupShare[g] <= NO_SIKSANG_MAX_SHARE).map(tag);
    const excessive = groups.filter((g) => ctx.groupShare[g] >= GWANSAL_DOMINANT_MIN_SHARE).map(tag);
    const show = (items: StructuralImbalance[]) =>
      items.length > 0 ? items.map((i) => `${i.group} ${i.percent}%`).join(', ') : '없음';

    const lacksWeapon =
      ctx.groupShare.식상 <= NO_SIKSANG_MAX_SHARE && ctx.groupShare.관성 >= GWANSAL_DOMINANT_MIN_SHARE;
    const line1 =
      `${ctx.dayMaster}(${STEM_ELEMENT[ctx.dayMaster]}) 일간 ${ctx.strength}, 결핍 ${show(deficient)} / 과다 ${show(excessive)}` +
      (lacksWeapon ? ' — 관살의 압박을 풀어 줄 식상(무기)이 없는 구조' : '');

    const daeun = daeunInfoAt(chart, now);
    const adjust = applyDaeunStrength(ctx, daeun);
    let line2: string;
    if (!daeun) {
      line2 = '현재 대운: 성별 정보 부족 또는 첫 대운 이전이라 득근 여부를 판정하지 않음(원국 기준).';
    } else if (adjust.adjusted) {
      line2 =
        `현재 대운 ${daeun.ganji.label}(${daeun.stemGod}/${daeun.branchGod}, ${daeun.stage}): 득근 성립(isDaewunRooted) — ` +
        '원국 신약이나 대운이 일간의 뿌리가 되어 실질 중화, 재성·관성을 소화할 수 있어 재다신약 감점을 배제';
    } else if (daeun.isDaewunRooted) {
      line2 = `현재 대운 ${daeun.ganji.label}(${daeun.stemGod}/${daeun.branchGod}, ${daeun.stage}): 득근 성립, 일간의 뿌리가 단단함`;
    } else {
      line2 = `현재 대운 ${daeun.ganji.label}(${daeun.stemGod}/${daeun.branchGod}, ${daeun.stage}): 득근 미성립, 원국 ${ctx.strength} 기준 유지`;
    }

    const interests = normalizeInterests(options.interests);
    const syncRatio = normalizeSyncRatio(options.lifeSyncRatio);
    const months: MonthFortune[] = [];
    for (let month = now.month; month <= 12; month += 1) {
      months.push(buildMonthFortune(chart, now.year, month, interests, syncRatio, month === now.month, now));
    }

    const keyMonths: StructuralMonthPoint[] = months
      .filter((m) => m.isSpecialLuck === true || m.month >= 10)
      .map((m) => ({
        month: m.month,
        ganji: m.ganji.label,
        keyword: m.keyword,
        score: m.overallScore,
        riskLevel: m.riskLevel,
        isTurningPoint: m.isSpecialLuck === true,
      }));
    const turning = keyMonths.filter((m) => m.isTurningPoint);
    const hasTurningPoint = turning.some((m) => m.month >= 11);

    const describe = (m: StructuralMonthPoint) =>
      `${m.month}월 ${m.ganji}(${m.keyword}, ${m.score}점·${RISK_LABEL_KO[m.riskLevel]})`;
    let line3: string;
    if (turning.length > 0) {
      line3 =
        `올해 남은 핵심 월: ${keyMonths.map(describe).join(' → ')} — ` +
        `${turning.map((m) => `${m.month}월`).join('·')}에 결핍된 식상·재성이 들어와 식신제살(압박 해소)·식신생재(자금 회수·결실)로 전환`;
    } else if (keyMonths.length > 0) {
      line3 = `올해 남은 핵심 월: ${keyMonths.map(describe).join(' → ')} — 식신제살·식신생재 전환점은 감지되지 않음`;
    } else {
      const best = months.reduce<MonthFortune | null>(
        (top, m) => (top === null || m.overallScore > top.overallScore ? m : top),
        null
      );
      line3 = best
        ? `올해 남은 달 중 가장 유리한 달: ${best.month}월 ${best.ganji.label}(${best.keyword}, ${best.overallScore}점) — 식신제살·식신생재 전환점은 감지되지 않음`
        : '올해 남은 월운을 산출하지 못함';
    }

    return {
      summary: [line1, line2, line3].join('\n'),
      hasTurningPoint,
      dayMaster: ctx.dayMaster,
      natalStrength: ctx.strength,
      deficient,
      excessive,
      daeun: daeun
        ? { ganji: daeun.ganji.label, isDaewunRooted: daeun.isDaewunRooted, effectiveStrength: adjust.ctx.strength }
        : null,
      keyMonths,
    };
  } catch {
    return null;
  }
}

