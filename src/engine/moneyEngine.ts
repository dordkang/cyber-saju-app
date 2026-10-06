import { calculateSaju } from './calculator';
import { getTenGod } from './timelineEngine';
import type { TenGod } from './timelineEngine';
import type { SajuResult } from './types';

export type MoneyStatus = '풀가동' | '안정' | '예열' | '방어';

export interface MoneyEngineResult {
  /** 돈 버는 엔진 출력 0~100 */
  power: number;
  /** 지갑 털림 방어선 0~100 (낮을수록 새기 쉬움) */
  defense: number;
  status: MoneyStatus;
  headline: string;
  engineLine: string;
  defenseLine: string;
  god: TenGod | null;
}

interface MoneyRule {
  power: number;
  defense: number;
  status: MoneyStatus;
  headline: string;
  engineLine: string;
  defenseLine: string;
}

const MONEY_RULES: Record<TenGod, MoneyRule> = {
  정재: {
    power: 90, defense: 80, status: '풀가동',
    headline: '꾸준히 쌓이는 돈이 들어와요',
    engineLine: '정해진 일을 끝까지 밀어붙이면 그대로 수입이 돼요.',
    defenseLine: '충동구매만 막으면 번 돈이 고스란히 남아요.',
  },
  편재: {
    power: 85, defense: 55, status: '풀가동',
    headline: '기회성 수입이 움직이는 날이에요',
    engineLine: '먼저 연락하고 먼저 제안하는 쪽이 이겨요.',
    defenseLine: '큰돈이 걸린 결정은 하루만 묵혔다가 하세요.',
  },
  식신: {
    power: 75, defense: 60, status: '안정',
    headline: '내 재주가 곧 돈이 되는 날이에요',
    engineLine: '만들고, 보여주고, 팔아 보세요. 표현한 만큼 벌려요.',
    defenseLine: '기분 좋다고 한턱 쏘면 그 돈이 새요.',
  },
  상관: {
    power: 65, defense: 50, status: '예열',
    headline: '아이디어는 터지는데 말실수가 돈을 깎아요',
    engineLine: '새 아이디어는 메모부터. 실행은 내일 해도 늦지 않아요.',
    defenseLine: '계약서와 정산 문자는 한 번 더 읽고 보내세요.',
  },
  정관: {
    power: 70, defense: 75, status: '안정',
    headline: '신뢰가 돈으로 돌아오는 날이에요',
    engineLine: '약속과 마감을 지키면 평가가 곧 수입이 돼요.',
    defenseLine: '내용 읽지 않고 서명하는 일만 막으면 안전해요.',
  },
  편관: {
    power: 50, defense: 40, status: '방어',
    headline: '압박과 지출 요구가 몰리는 날이에요',
    engineLine: '새로 벌리기보다 지금 하는 일을 지키는 날이에요.',
    defenseLine: '빌려 달라는 부탁과 갑작스러운 결제는 오늘 보류하세요.',
  },
  비견: {
    power: 55, defense: 55, status: '예열',
    headline: '내 페이스로 모으는 날이에요',
    engineLine: '혼자 집중해서 끝내는 일에서 성과가 나와요.',
    defenseLine: '남이 산다고 따라 사는 소비만 조심하세요.',
  },
  겁재: {
    power: 35, defense: 25, status: '방어',
    headline: '지갑이 털리기 쉬운 날이에요',
    engineLine: '동업이나 경쟁에 끌려가기 쉬우니 내 몫부터 챙기세요.',
    defenseLine: '공동 결제, 보증, 송금은 전부 내일로 미루세요.',
  },
  정인: {
    power: 60, defense: 70, status: '안정',
    headline: '배움에 쓴 돈이 나중에 돌아와요',
    engineLine: '문서, 자격, 공부에 시간을 쓰면 다음 수입이 열려요.',
    defenseLine: '강의와 구독 결제는 정말 쓰는 것만 남기세요.',
  },
  편인: {
    power: 45, defense: 55, status: '예열',
    headline: '생각은 많고 실행이 느린 날이에요',
    engineLine: '큰 결정보다 정리와 점검에 어울리는 날이에요.',
    defenseLine: '쓰지 않는 정기결제를 오늘 정리해 보세요.',
  },
};

const FALLBACK_RULE: MoneyRule = {
  power: 50, defense: 50, status: '예열',
  headline: '오늘은 몸풀기 하는 날이에요',
  engineLine: '무리하지 않고 할 일을 하나씩 처리하면 충분해요.',
  defenseLine: '지출 전에 한 번만 더 생각하세요.',
};

/** 내 일간과 오늘 일진 천간의 십신으로 오늘의 돈 흐름을 읽는다. 실패해도 기본 문구를 돌려준다. */
export function analyzeTodayMoney(saju: SajuResult | null, date: Date = new Date()): MoneyEngineResult {
  let god: TenGod | null = null;
  try {
    if (saju) {
      const today = calculateSaju(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, true).pillars.day;
      god = getTenGod(saju.dayMaster, today.stem);
    }
  } catch {
    god = null;
  }
  const rule = god ? MONEY_RULES[god] : FALLBACK_RULE;
  return { ...rule, god };
}
