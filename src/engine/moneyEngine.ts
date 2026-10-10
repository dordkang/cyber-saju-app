import { calculateSaju } from './calculator';
import { getTenGod } from './timelineEngine';
import type { TenGod } from './timelineEngine';
import type { FiveElement, SajuResult } from './types';
import { ELEMENT_SHORT_KR } from './reelsContent';

export type MoneyStatus = '풀가동' | '안정' | '예열' | '방어';
export type MoneyMode =
  | '흑자 수성 모드'
  | '공격적 계약 모드'
  | '지갑 봉인 모드'
  | '생산 집중 모드'
  | '전략적 검토 모드'
  | '자립 방어 모드';

export interface MoneyEngineResult {
  /** 💰 유입 엔진 (벌리는 기운) 0~100 */
  inflowPower: number;
  inflowLabel: string;
  /** 🛡️ 누수 경보 (새는 구멍) 0~100 */
  outflowRisk: number;
  outflowLabel: string;
  /** 수치 밸런스에 따른 동적 모드 뱃지 */
  modeBadge: MoneyMode;
  /** 오늘의 명식 기운 뱃지 (예: 오늘의 금전 기운: 정인(正印) × 적화(赤火)) */
  energyBadge: string;
  godName: string;
  godHanja: string;
  elementName: string;
  /** 핵심 통찰 */
  headline: string;
  insight: string;
  /** 실전 행동 지침 */
  actionDo: string;
  actionDont: string;

  /** 하위 호환용 필드 */
  power: number;
  defense: number;
  status: MoneyStatus;
  engineLine: string;
  defenseLine: string;
  god: TenGod | null;
}

interface MoneyPreset {
  inflowPower: number;
  inflowLabel: string;
  outflowRisk: number;
  outflowLabel: string;
  modeBadge: MoneyMode;
  godHanja: string;
  headline: string;
  baseInsight: string;
  actionDo: string;
  actionDont: string;
  status: MoneyStatus;
}

const MONEY_PRESETS: Record<TenGod, MoneyPreset> = {
  정재: {
    godHanja: '正財',
    inflowPower: 88,
    inflowLabel: '계약 성사력 88% · 정기 매출 우세',
    outflowRisk: 24,
    outflowLabel: '지출 누수 24% · 알뜰 방어 우수',
    modeBadge: '흑자 수성 모드',
    status: '풀가동',
    headline: '정재(正財)의 안정성: 성실한 땀방울이 온전한 결실로 채워지는 날',
    baseInsight:
      '정재(正財)의 기운이 들어와 정직하게 일한 대가와 정기적인 매출이 고스란히 곳간으로 쌓이는 날이다. 무리하게 한 방을 노리기보다 이미 성사된 거래처의 미수금을 칼같이 회수하고 고정 마진율을 지키는 데 집중하라. 오늘 들어온 돈은 오래도록 네 터전을 든든하게 지켜줄 소중한 종잣돈이 된다.',
    actionDo: '기존 거래처 잔금 정산, 고정 마진율 점검, 정기 적금·안전자산 예치',
    actionDont: '고수익 미끼 상품 투자, 불필요한 체면치레 지출, 검증 안 된 외상 거래',
  },
  편재: {
    godHanja: '偏財',
    inflowPower: 84,
    inflowLabel: '매출 회전력 84% · 기회 포착 우세',
    outflowRisk: 58,
    outflowLabel: '돌발 손실 58% · 단기 변동성 주의보',
    modeBadge: '공격적 계약 모드',
    status: '풀가동',
    headline: '편재(偏財)의 역동성: 큰 판을 흔들고 주도권을 쥐어야 하는 날',
    baseInsight:
      '편재(偏財)의 기운이 요동치며 판세가 크게 움직이는 날이다. 가만히 앉아 기다리기보다 먼저 연락하고 협상 테이블을 주도할 때 예상치 못한 큰 이익을 쥘 수 있다. 단, 눈앞의 이익에 눈이 멀면 예상치 못한 복병을 만나니 계약서의 독소 조항과 위약금 기준을 매의 눈으로 감시하라.',
    actionDo: '적극적인 신규 제안·미팅, 단가 상향 협상, 신규 유통 채널 확보',
    actionDont: '과도한 레버리지 몰빵, 충동적 주식·코인 추격 매수, 즉흥적 호언장담',
  },
  식신: {
    godHanja: '食神',
    inflowPower: 78,
    inflowLabel: '생산 창출력 78% · 전문성 결실 우세',
    outflowRisk: 36,
    outflowLabel: '기분파 소비 36% · 미세 누수 경보',
    modeBadge: '생산 집중 모드',
    status: '안정',
    headline: '식신(食神)의 생산력: 손끝의 재주와 기획이 황금으로 바뀌는 날',
    baseInsight:
      '식신(食神)은 네 재주와 전문성이 곧장 황금으로 치환되는 복록의 기운이다. 만들고 기획한 작업물을 자신 있게 세상에 공개하라. 고객의 지갑을 여는 것은 네 진정성 있는 결과물이다. 다만 성취감에 취해 주변 사람들에게 기분파로 한턱 쏘거나 밥값을 몰아내다가는 실속이 샐 수 있다.',
    actionDo: '핵심 작업물 공개·홍보, 상품 단가 현실화, 기술·콘텐츠 판매',
    actionDont: '기분파 식사 대접 및 골든벨, 무계획 장비 충동 구매, 무료 재능 기부',
  },
  상관: {
    godHanja: '傷官',
    inflowPower: 72,
    inflowLabel: '틈새 돌파력 72% · 파격 아이디어 우세',
    outflowRisk: 64,
    outflowLabel: '위약금 리스크 64% · 언행 주의보',
    modeBadge: '전략적 검토 모드',
    status: '예열',
    headline: '상관(傷官)의 틈새 공략: 직관은 뛰어나나 말실수가 돈을 깎는 날',
    baseInsight:
      '상관(傷官)의 번뜩이는 통찰로 기존의 낡은 관행을 깨고 틈새 수익을 창출할 수 있는 날이다. 허나 날 선 화법이나 직설적인 요구가 거래처의 심기를 건드려 다 된 밥에 재를 뿌릴 수 있다. 협상장에서는 미소를 띠고 말을 아끼며, 계약 조항은 현미경으로 검토하라.',
    actionDo: '틈새 시장 기획안 작성, 기존 비용 절감안 수립, 서류 세부 조항 점검',
    actionDont: '협상 중 감정적 반박, 비밀 유지 의무 위반 발설, 즉흥적 도장 날인',
  },
  정관: {
    godHanja: '正官',
    inflowPower: 74,
    inflowLabel: '신용 가치 74% · 공신력 기반 계약 우세',
    outflowRisk: 28,
    outflowLabel: '손실 리스크 28% · 규정 준수 철통 방어',
    modeBadge: '흑자 수성 모드',
    status: '안정',
    headline: '정관(正官)의 신용: 반듯한 명분과 규정이 최고의 이익을 낳는 날',
    baseInsight:
      '정관(正官)의 엄정한 질서가 네 신용을 황금 갑옷으로 만들어주는 날이다. 공공 기관, 기업, 원청과의 계약이나 심사에서 네 성실함과 투명한 기록이 가장 강력한 무기가 된다. 편법이나 지름길을 탐하지 말고 정석대로 절차를 밟을 때 가장 안전하고 확실한 수익이 보장된다.',
    actionDo: '공식 제안서 제출, 세금·영수증 철저 정산, 원칙 중심의 계약 협의',
    actionDont: '이면 계약 합의, 편법 세금 감면 유혹, 구두 약속만 믿는 방심',
  },
  편관: {
    godHanja: '偏官',
    inflowPower: 48,
    inflowLabel: '돌파 압박 48% · 보수적 수성 급선무',
    outflowRisk: 76,
    outflowLabel: '돌발 청구 76% · 갑작스런 지출 경보',
    modeBadge: '지갑 봉인 모드',
    status: '방어',
    headline: '편관(偏官)의 압박: 갑작스러운 청구서와 지출 요구를 버텨내야 하는 날',
    baseInsight:
      '칠살(七殺)로도 불리는 편관의 거센 압박이 들어오는 날이다. 거래처의 무리한 단가 인하나 갑작스러운 수리비, 세금 등 예상치 못한 청구서가 날아들 수 있다. 지금은 판을 벌릴 때가 아니라 네 진지를 사수하고 현금을 꽉 쥐고 버텨내야 다음 판의 주도권을 쥘 수 있다.',
    actionDo: '긴급 비상금 확보, 불필요한 외주 계약 일시 정지, 채무 상환 일정 점검',
    actionDont: '신규 대출 실행, 타인을 위한 연대 보증, 압박에 못 이긴 헐값 계약',
  },
  비견: {
    godHanja: '比肩',
    inflowPower: 58,
    inflowLabel: '독립 생산력 58% · 개인 역량 성과',
    outflowRisk: 52,
    outflowLabel: '체면 소비 52% · 동료 분할 지출 주의',
    modeBadge: '자립 방어 모드',
    status: '예열',
    headline: '비견(比肩)의 자립: 홀로서기로 번 돈을 남의 눈치로 날리지 말 것',
    baseInsight:
      '비견(比肩)의 꼿꼿한 기운이 들어와 남에게 기대지 않고 스스로 일군 성과가 보람을 주는 날이다. 다만 동료나 경쟁자와 엮이며 자존심 싸움으로 비화하거나, 뒤처지지 않으려 무리하게 지갑을 열어 돈을 낭비할 수 있다. 남과 비교하지 말고 네 속도대로 곳간을 채워라.',
    actionDo: '단독 진행 프로젝트 집중, 개인 통장 잔고 분리, 내 몫의 권리 명확화',
    actionDont: '동업 지분 맹신, 남 따라 사는 과시성 소비, 무리한 공동 분담금 지출',
  },
  겁재: {
    godHanja: '劫財',
    inflowPower: 32,
    inflowLabel: '수익 기회 32% · 내 곳간 사수 초비상',
    outflowRisk: 88,
    outflowLabel: '손재수(損財數) 88% · 최고조 경보 발령',
    modeBadge: '지갑 봉인 모드',
    status: '방어',
    headline: '겁재(劫財)의 경고: 남의 입놀림과 투자 꾐에 지갑이 통째로 털리는 날',
    baseInsight:
      '겁재(劫財)는 재물을 겁탈하려는 도둑의 기운이니 오늘만큼은 지갑에 굵은 자물쇠를 채워야 한다. 달콤한 투자 제안, 지인의 눈물 섞인 부탁, 동업 제안은 전부 네 곳간을 털어가려는 손재수의 덫이다. 오늘은 1원도 남에게 빌려주지 말고 어떤 계약서에도 도장을 찍지 마라.',
    actionDo: '카드 한도 일시 하향, 계좌 이체 전 3회 숙고, 동업 자금 제안 거절',
    actionDont: '지인 금전 대여, 주식·코인 신규 매수, 섣부른 공동 투자 송금',
  },
  정인: {
    godHanja: '正印',
    inflowPower: 68,
    inflowLabel: '문서 가치 68% · 지적 자산 가치 상승',
    outflowRisk: 34,
    outflowLabel: '지출 통제 34% · 낭비 차단 우수',
    modeBadge: '흑자 수성 모드',
    status: '안정',
    headline: '정인(正印)의 지혜: 문서와 지식 자산이 장기적인 부를 부르는 날',
    baseInsight:
      '정인(正印)의 맑은 문서운이 들어와 자격증, 라이선스, 기획서 등 지적 자산이 장기적인 부의 마중물이 되는 날이다. 단기적인 푼돈에 일희일비하지 말고 네 가치를 증명할 공식 문서와 계약을 매듭지어라. 귀인의 조언을 경청하되 배움에 과도하게 충동 결제하는 것은 삼가라.',
    actionDo: '특허·저작권·계약서 검토, 전문가 자문 청취, 장기 포트폴리오 리밸런싱',
    actionDont: '충동적인 고액 강의 결제, 증빙 없는 구두 합의, 지나치게 수동적인 안주',
  },
  편인: {
    godHanja: '偏印',
    inflowPower: 52,
    inflowLabel: '특수 전문성 52% · 틈새 기술 발휘',
    outflowRisk: 60,
    outflowLabel: '잡념 지출 60% · 헛돈 낭비 주의보',
    modeBadge: '전략적 검토 모드',
    status: '예열',
    headline: '편인(偏印)의 통찰: 남들이 못 보는 금맥을 보되 뜬구름을 잡지 말 것',
    baseInsight:
      '편인(偏印)의 날카로운 직관이 남들이 보지 못하는 틈새 시장을 포착하게 해준다. 허나 의구심과 잡념이 꼬리를 물어 결정을 번복하다가 타이밍을 놓치거나 비현실적인 환상에 헛돈을 쓸 수 있다. 냉철한 수치로 검증된 곳에만 집중하고 고립된 독단을 경계하라.',
    actionDo: '숨은 비효율 지출 정리, 쓰지 않는 정기 결제 해지, 특수 기술 역량 강화',
    actionDont: '비상장·기획 부동산 솔깃, 불확실한 투기성 베팅, 현실 도피성 충동 소비',
  },
};

const FALLBACK_PRESET: MoneyPreset = {
  godHanja: '天運',
  inflowPower: 60,
  inflowLabel: '재물 순환력 60% · 기회 탐색',
  outflowRisk: 45,
  outflowLabel: '기본 방어선 45% · 안정 관리',
  modeBadge: '자립 방어 모드',
  status: '예열',
  headline: '천기(天氣)의 균형: 무리한 확장보다 기초 체력을 다지는 날',
  baseInsight:
    '오늘 들어온 기운은 큰 무리 없이 균형을 유지하고 있다. 큰 지출이나 계약은 하루 더 묵혀서 냉정하게 검토하고, 평소 해오던 재무 흐름을 차분하게 점검하라.',
  actionDo: '기존 계좌 잔고 점검, 불필요한 고정 지출 정리, 냉철한 예산 책정',
  actionDont: '기분파 즉흥 결제, 검증되지 않은 투자 정보 신뢰, 과도한 외상',
};

const ELEMENT_KOREAN: Record<FiveElement, string> = {
  Wood: '청목(靑木)',
  Fire: '적화(赤火)',
  Earth: '황토(黃土)',
  Metal: '백금(白金)',
  Water: '흑수(黑水)',
};

/**
 * 내 사주와 오늘 일진으로 정밀 금융 비책을 산출한다.
 */
export function analyzeTodayMoney(saju: SajuResult | null, date: Date = new Date()): MoneyEngineResult {
  let god: TenGod | null = null;
  let element: FiveElement = 'Fire';

  try {
    const todayPillar = calculateSaju(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      12,
      0,
      true
    ).pillars.day;

    element = todayPillar.elements[0] ?? 'Fire';
    if (saju) {
      god = getTenGod(saju.dayMaster, todayPillar.stem);
    }
  } catch {
    god = null;
    element = 'Fire';
  }

  const preset = god ? MONEY_PRESETS[god] : FALLBACK_PRESET;
  const godName = god ?? '천운';
  const godHanja = preset.godHanja;
  const elementName = ELEMENT_KOREAN[element] ?? '적화(赤火)';
  const energyBadge = `오늘의 금전 기운: ${godName}(${godHanja}) × ${elementName}`;

  // 오행 특성에 따른 실전 팁 보강
  let elementTip = '';
  if (element === 'Fire') {
    elementTip = ' 오늘은 불기운(火)이 거세어 마음이 조급해지고 체면에 휩쓸려 충동 지출이 일기 쉬우니 결제창을 닫고 하룻밤 재워라.';
  } else if (element === 'Water') {
    elementTip = ' 오늘은 물기운(水)이 유연하여 기회는 많으나 틈새로 잔돈이 새기 쉬우니 계좌 잔고를 꼼꼼히 챙겨라.';
  } else if (element === 'Metal') {
    elementTip = ' 오늘은 쇠기운(金)이 서슬 퍼러 계약서의 단가와 숫자가 칼같이 오가니 네 마진을 1원도 깎아주지 마라.';
  } else if (element === 'Wood') {
    elementTip = ' 오늘은 나무기운(木)이 뻗어나가 신규 확장의 의욕이 앞서나, 무리한 선투자는 삼가고 확실한 씨앗에만 물을 주어라.';
  } else if (element === 'Earth') {
    elementTip = ' 오늘은 흙기운(土)이 묵직하여 곳간을 지키기에는 좋으나 자금이 묶일 수 있으니 현금 흐름의 유동성을 확보하라.';
  }

  const insight = `${preset.baseInsight}${elementTip}`;

  return {
    inflowPower: preset.inflowPower,
    inflowLabel: preset.inflowLabel,
    outflowRisk: preset.outflowRisk,
    outflowLabel: preset.outflowLabel,
    modeBadge: preset.modeBadge,
    energyBadge,
    godName,
    godHanja,
    elementName,
    headline: preset.headline,
    insight,
    actionDo: preset.actionDo,
    actionDont: preset.actionDont,

    // 레거시 호환
    power: preset.inflowPower,
    defense: 100 - preset.outflowRisk,
    status: preset.status,
    engineLine: preset.inflowLabel,
    defenseLine: preset.outflowLabel,
    god,
  };
}
