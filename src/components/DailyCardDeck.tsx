import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { EmotionElement, EnergyLevel, EventCategory } from '../database/db';

export interface DailyCardData {
  emotionElement: EmotionElement;
  tarotCard?: string;
  eventCategory: EventCategory;
  energyLevel: EnergyLevel;
  shortMemo?: string;
}

interface DailyCardDeckProps {
  /** 마감 버튼을 누르면 호출된다. 예외를 던지면 처방 화면을 유지한다. */
  onSave: (data: DailyCardData) => void | Promise<void>;
  /** 사건 카드를 누를 때마다 호출된다 (이미 선택된 카드를 다시 눌러도 호출). */
  onEventCategorySelect?: (category: EventCategory) => void;
  /** 사용자 원국의 결핍 오행 (예: Metal / 金) */
  lackingElement?: string | null;
}

// ───────────────────────── Web Audio 신디사이저 (외부 음원 파일 0개) ─────────────────────────

interface ParamLike {
  setValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
}

interface OscillatorLike {
  type: string;
  frequency: ParamLike;
  connect(destination: unknown): unknown;
  disconnect(): void;
  start(time?: number): void;
  stop(time?: number): void;
  onended: (() => void) | null;
}

interface GainLike {
  gain: ParamLike;
  connect(destination: unknown): unknown;
  disconnect(): void;
}

interface AudioContextLike {
  currentTime: number;
  state: string;
  destination: unknown;
  resume(): Promise<void>;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
}

type AudioContextCtor = new () => AudioContextLike;

let sharedAudio: AudioContextLike | null = null;

/** 사용자 제스처(탭) 안에서 호출해야 브라우저 자동재생 정책을 통과한다. 네이티브나 미지원 환경에서는 null. */
function unlockAudio(): AudioContextLike | null {
  try {
    if (!sharedAudio) {
      const scope = globalThis as unknown as {
        AudioContext?: AudioContextCtor;
        webkitAudioContext?: AudioContextCtor;
      };
      const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
      if (!Ctor) return null;
      sharedAudio = new Ctor();
    }
    if (sharedAudio.state === 'suspended') sharedAudio.resume().catch(() => undefined);
    return sharedAudio;
  } catch {
    return null;
  }
}

function releaseOnEnd(osc: OscillatorLike, nodes: ReadonlyArray<{ disconnect(): void }>): void {
  osc.onended = () => {
    for (const node of nodes) {
      try {
        node.disconnect();
      } catch {
        // 이미 해제된 노드는 무시한다.
      }
    }
  };
}

/** 가벼운 틱: 800Hz, 0.05초 */
function playTick(): void {
  const ctx = unlockAudio();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    releaseOnEnd(osc, [osc, gain]);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {
    // 오디오 실패가 인터랙션을 막아서는 안 된다.
  }
}

/** 네온 에너지 충전음 "지잉-": 120Hz → 440Hz 상승, 0.6초 동안 페이드아웃 */
function playCharge(): void {
  const ctx = unlockAudio();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const duration = 0.6;
    const layers: ReadonlyArray<{ type: string; peak: number }> = [
      { type: 'sawtooth', peak: 0.1 },
      { type: 'sine', peak: 0.2 },
    ];
    for (const layer of layers) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = layer.type;
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + duration);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(layer.peak, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      releaseOnEnd(osc, [osc, gain]);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    }
  } catch {
    // 오디오 실패가 인터랙션을 막아서는 안 된다.
  }
}

// ───────────────────────── 카드 데이터 ─────────────────────────

interface EmotionCard {
  key: EmotionElement;
  hanja: string;
  emoji: string;
  keyword: string;
}

const EMOTION_CARDS: readonly EmotionCard[] = [
  { key: '목', hanja: '木', emoji: '🌲', keyword: '의욕 · 조급함' },
  { key: '화', hanja: '火', emoji: '🔥', keyword: '열정 · 번아웃' },
  { key: '토', hanja: '土', emoji: '🏔️', keyword: '답답 · 정체' },
  { key: '금', hanja: '金', emoji: '⚔️', keyword: '결단 · 마찰' },
  { key: '수', hanja: '水', emoji: '🌊', keyword: '불안 · 고독' },
];

type EventId = 'money' | 'work' | 'relation' | 'health' | 'choice';

interface EventCard {
  id: EventId;
  label: string;
  emoji: string;
  /** DB와 AI 게이트웨이가 이미 쓰는 사건 영역 키. 기존 기록·지침과 호환되도록 유지한다. */
  category: EventCategory;
}

const EVENT_CARDS: readonly EventCard[] = [
  { id: 'money', label: '돈', emoji: '💰', category: '돈/대박' },
  { id: 'work', label: '직장', emoji: '⚔️', category: '생존/직장' },
  { id: 'relation', label: '관계', emoji: '💔', category: '치정/바람' },
  { id: 'health', label: '건강', emoji: '🩹', category: '건강/액땜' },
  { id: 'choice', label: '선택', emoji: '🧭', category: '선택' },
];

const ENERGY_CHIPS: readonly EnergyLevel[] = [25, 50, 75, 100];

// ───────────────────────── 오프라인 도사 처방 (戊土 일간 전용 결정론 테이블) ─────────────────────────

export interface OfflinePrescription {
  /** 1줄: 오늘의 기운 진단 */
  diagnosis: string;
  /** 2줄: 행동 처방 */
  action: string;
}

const EVENT_SCENE: Record<EventId, string> = {
  money: '돈 계산에 머리를 굴리느라',
  work: '일과 윗사람 눈치에 시달리느라',
  relation: '사람 상대하느라',
  health: '몸을 갈아 넣느라',
  choice: '이것저것 저울질하느라',
};

/** 戊土(태산) 기준 오행 관계: 목=관살(압박), 화=인성(과열), 토=비겁(정체), 금=식상(설기), 수=재성(범람) */
const EMOTION_DIAGNOSIS: Record<EmotionElement, (scene: string) => string> = {
  목: (scene) => `오늘 ${scene} 사방의 乙木 관살이 짓눌러 태산(戊土)의 어깨가 천 근이로구나.`,
  화: (scene) => `오늘 ${scene} 火 기운에 태산(戊土)이 바짝 말랐구나!`,
  토: (scene) => `오늘 ${scene} 戊土 태산이 꿈쩍도 못 하고 굳어 버렸구나!`,
  금: (scene) => `오늘 ${scene} 金 기운으로 기운을 너무 베어 내 태산(戊土)의 속이 텅 비었구나!`,
  수: (scene) => `오늘 ${scene} 水 기운이 범람해 태산(戊土)이 진흙탕에 허덕이는구나!`,
};

const EMOTION_ACTION: Record<EmotionElement, Record<EventId, string>> = {
  목: {
    money: '큰 결제와 서명은 내일로 미뤄라. 칼 같은 결단(金)을 멈추고 따뜻한 밥 한 끼 먹은 뒤 일찍 불을 꺼라.',
    work: '윗사람 말에 토 달지 말고 할 일만 메모로 남겨라. 칼 같은 결단(金)을 멈추고 일찍 불을 끄고 온전히 쉬어라.',
    relation: '답장은 내일 아침으로 미뤄라. 칼 같은 결단(金)을 멈추고 일찍 불을 끄고 온전히 쉬어라.',
    health: '어깨와 목을 따뜻한 물수건으로 풀고 오늘은 운동 대신 스트레칭만 해라. 일찍 불을 끄고 온전히 쉬어라.',
    choice: '지금 정할 것과 내일 정할 것을 종이에 갈라 적어라. 칼 같은 결단(金)은 멈추고 일찍 쉬어라, 아침의 네가 더 정확하다.',
  },
  화: {
    money: '쇼핑 앱과 지갑 앱부터 꺼라. 자기 전 찬물 세수하고 숫자 계산은 내일 아침 水 기운에 맡겨라!',
    work: '메신저 알림을 끄고 자기 전 찬물 세수로 열을 식혀라. 휴대폰을 끄고 水 기운을 채워라!',
    relation: '오늘 오간 말을 곱씹지 마라. 자기 전 찬물 세수하고 휴대폰 끄고 水 기운을 채워라!',
    health: '찬물 한 잔을 천천히 마시고 카페인과 매운 음식은 끊어라. 자기 전 찬물 샤워로 水 기운을 채워라!',
    choice: '뜨거운 머리로 정한 결정은 효력 정지다. 찬물 세수하고 하룻밤 재운 뒤 아침에 다시 물어라!',
  },
  토: {
    money: '묵혀 둔 지출 내역을 오늘 한 번 쓸어 담아 정리해라. 30분만 걸으며 木 기운으로 막힌 흙을 갈아엎어라.',
    work: '쌓아 둔 일 중 제일 하기 싫은 한 건만 먼저 쳐내라. 木 기운으로 태산에 길 하나만 뚫어라.',
    relation: '먼저 안부 한 줄 보내라. 태산은 제 발로 안 걷는다, 木 기운 한 줄이 고인 관계를 뚫는다.',
    health: '앉은 자리에서 일어나 30분 걸어라. 木 기운 가득한 숲길이면 더 좋다, 굳은 흙은 움직여야 풀린다.',
    choice: '고민만 쌓지 말고 가장 작은 쪽을 오늘 하나 골라 실행해라. 木의 한 걸음이 태산을 움직인다.',
  },
  금: {
    money: '오늘은 지르지 말고 새는 돈 구멍부터 막아라. 입을 닫고 따뜻한 밥(土) 한 그릇으로 속을 채워라.',
    work: '회의와 메신저에서 말을 반으로 줄여라. 날 선 한마디는 베는 순간 네 기운도 깎인다, 속은 따뜻한 밥(土)으로 채워라.',
    relation: '오늘은 따지지 말고 들어 줘라. 날 선 말은 상대보다 네 태산을 먼저 깎는다, 따뜻한 밥(土)으로 마무리해라.',
    health: '목과 호흡기가 칼바람에 마른다. 말수를 줄이고 따뜻한 국물(土)로 속을 채워 새어 나간 기운을 메워라.',
    choice: '결단의 칼부터 빼들지 마라, 베고 나면 되돌릴 수 없다. 오늘은 입을 닫고 따뜻한 밥(土) 먹고 내일 정해라.',
  },
  수: {
    money: '불안해서 계좌를 열 번 열어 봐야 돈은 안 는다. 오늘 지출 한도를 종이에 적어 둑(土)부터 쌓아라.',
    work: '걱정을 머릿속에 두지 말고 내일 할 일 세 개로 적어 둑(土)을 쌓아라. 몸은 따뜻하게(火) 데워라.',
    relation: '상대 속마음 추측은 물에 빠진 헛수고다. 확인되지 않은 말은 믿지 말고 따뜻한 차(火) 한 잔으로 마음을 말려라.',
    health: '차가운 음식과 야식은 끊고 배를 따뜻하게 해라. 물에 잠긴 태산은 火土로 말려야 선다.',
    choice: '불안한 선택일수록 장단점을 종이에 적어 눈으로 확인해라. 둑(土)을 쌓은 뒤에 물길을 정해라.',
  },
};

const DYNAMIC_DIAGNOSIS: Record<EmotionElement, Record<EventId, string>> = {
  금: {
    health: '오늘 몸을 갈아 넣느라 쇠(金) 기운의 칼날로 기운을 너무 베었습니다.',
    money: '오늘 돈 계산과 손익을 따지느라 날카로운 쇠(金) 기운으로 속을 너무 깎아 먹었습니다.',
    work: '오늘 일터에서 윗사람과 부딪치며 서슬 퍼런 쇠(金) 기운의 칼날을 너무 세웠습니다.',
    relation: '오늘 사람 사이에서 날 선 한마디와 마찰(金)로 태산의 기운에 생채기가 났습니다.',
    choice: '오늘 이것저것 칼같이 베어내느라 쇠(金) 기운으로 머리가 지칠 정도로 날을 세웠습니다.',
  },
  목: {
    health: '오늘 무리하게 몰아치느라 조급한 목(木) 기운으로 온몸의 신경이 곤두섰습니다.',
    money: '오늘 조급한 목(木) 기운으로 재물에 혼란이 일었습니다.',
    work: '오늘 일터에서 치밀어 오르는 목(木) 기운의 분노를 삼키느라 가슴이 답답했습니다.',
    relation: '오늘 관계에서 조급하게 앞서나가는 목(木) 기운 탓에 감정의 골이 깊어졌습니다.',
    choice: '오늘 섣부른 결정을 내리려 조급한 목(木) 기운으로 마음이 요동쳤습니다.',
  },
  화: {
    health: '오늘 쉼 없이 달리느라 치솟는 화(火) 기운의 열기에 심혈관과 머리가 바짝 달아올랐습니다.',
    money: '오늘 욱하는 충동과 화(火) 기운의 열기로 지갑에 붉은불이 켜졌습니다.',
    work: '오늘 업무 속도전에 치여 치솟는 화(火) 기운으로 머리에 과부하가 걸렸습니다.',
    relation: '오늘 감정의 온도가 끓어넘쳐 화(火) 기운으로 관계에 파열음이 일었습니다.',
    choice: '오늘 흥분한 상태에서 결정을 내리려 화(火) 기운의 불꽃이 이성을 가렸습니다.',
  },
  토: {
    health: '오늘 움직이지 못하고 버티느라 굳어버린 흙(土) 기운으로 온몸이 뻐근하게 굳었습니다.',
    money: '오늘 꽉 막힌 돈줄과 지출 정체로 흙(土) 기운의 무게에 짓눌렸습니다.',
    work: '오늘 답답한 업무 진척과 고구마 같은 상황에 흙(土) 기운으로 속이 콱 막혔습니다.',
    relation: '오늘 말도 못 꺼내고 혼자 속으로 삭이느라 흙(土) 기운에 가슴이 굳어졌습니다.',
    choice: '오늘 어느 쪽도 고르지 못해 우유부단한 흙(土) 기운으로 제자리를 맴돌았습니다.',
  },
  수: {
    health: '오늘 차가운 기운과 피로에 젖어 물(水) 기운의 냉기로 면역과 기력이 가라앉았습니다.',
    money: '오늘 앞날의 돈 걱정과 불안에 물(水) 기운의 파도가 마음을 집어삼켰습니다.',
    work: '오늘 직장에서의 미래 불안으로 물(水) 기운의 차가운 안개 속에 갇혔습니다.',
    relation: '오늘 상대의 차가운 반응에 위축되어 물(水) 기운으로 마음이 꽁꽁 얼어붙었습니다.',
    choice: '오늘 흔들리는 불안감에 휩쓸려 물(水) 기운으로 갈피를 잡지 못했습니다.',
  },
};

const LACKING_ACTION: Record<string, string> = {
  Metal: '당신 사주에 원래 없는 금(金) 기운을 보충하여 상처 입은 몸을 회복하고 있습니다.',
  Wood: '당신 사주에 결핍된 목(木) 기운의 생명력을 불어넣어 막힌 숨통을 틔우고 있습니다.',
  Water: '당신 사주에 메마른 수(水) 기운의 유연함과 지혜를 채워 과열된 열기를 식히고 있습니다.',
  Fire: '당신 사주에 부족한 화(火) 기운의 따스한 온기를 지펴 차가워진 기운을 북돋우고 있습니다.',
  Earth: '흔들리는 마음을 흙(土)의 방파제로 굳건히 다지고 있습니다.',
  금: '당신 사주에 원래 없는 금(金) 기운을 보충하여 상처 입은 몸을 회복하고 있습니다.',
  목: '당신 사주에 결핍된 목(木) 기운의 생명력을 불어넣어 막힌 숨통을 틔우고 있습니다.',
  수: '당신 사주에 메마른 수(水) 기운의 유연함과 지혜를 채워 과열된 열기를 식히고 있습니다.',
  화: '당신 사주에 부족한 화(火) 기운의 따스한 온기를 지펴 차가워진 기운을 북돋우고 있습니다.',
  토: '흔들리는 마음을 흙(土)의 방파제로 굳건히 다지고 있습니다.',
};

const DEFAULT_ACTION: Record<EmotionElement, Record<EventId, string>> = {
  금: {
    health: '당신 사주에 원래 없는 금(金) 기운을 보충하여 상처 입은 몸을 회복하고 있습니다.',
    money: '날 선 결단(金)을 멈추고 흙(土)의 여유로 마음 곳간을 단단히 채우고 있습니다.',
    work: '베어낸 칼날을 거두고 따뜻한 밥(土)과 휴식으로 내면의 힘을 기르고 있습니다.',
    relation: '날카로운 시선을 거두고 온화한 흙(土)의 품으로 평온을 되찾고 있습니다.',
    choice: '조급한 결정을 멈추고 하룻밤 재워 맑은 직관을 깨우고 있습니다.',
  },
  목: {
    health: '굳은 근육을 풀고 흙(土)의 대지 위에 편안히 누워 기력을 회복하고 있습니다.',
    money: '흔들리는 마음을 흙(土)의 방파제로 굳건히 다지고 있습니다.',
    work: '치솟는 분노를 다스리고 태산(戊土)의 묵직함으로 중심을 잡고 있습니다.',
    relation: '조급함을 내려놓고 여유로운 호흡으로 마음의 거리를 조율하고 있습니다.',
    choice: '한 걸음 물러서서 태산(戊土)의 시야로 전체 판세를 내려다보고 있습니다.',
  },
  화: {
    health: '찬물 한 잔으로 타오르는 열을 식히고 수(水) 기운으로 온몸을 정화하고 있습니다.',
    money: '달아오른 충동을 물(水) 기운의 차분함으로 가라앉히고 있습니다.',
    work: '과열된 머리를 식히고 차분한 수(水)의 지혜로 내일을 설계하고 있습니다.',
    relation: '뜨거워진 감정을 식히고 잔잔한 호수 같은 평온을 채우고 있습니다.',
    choice: '열기가 가라앉은 새벽의 맑은 이성으로 최선의 길을 비추고 있습니다.',
  },
  토: {
    health: '가벼운 스트레칭과 목(木) 기운의 생기로 굳어있던 혈자리를 풀고 있습니다.',
    money: '막힌 돈길에 목(木) 기운의 물꼬를 터서 새로운 흐름을 만들고 있습니다.',
    work: '굳어있던 태산에 목(木)의 싹을 틔워 시원하게 돌파구를 열고 있습니다.',
    relation: '먼저 건네는 따뜻한 한마디로 굳어있던 관계의 얼음을 녹이고 있습니다.',
    choice: '가장 작은 한 걸음부터 내딛어 굳어있던 운명의 수레바퀴를 굴리고 있습니다.',
  },
  수: {
    health: '배를 따뜻하게 데우고 화(火)와 토(土)의 온기로 냉기를 몰아내고 있습니다.',
    money: '밀려드는 불안의 파도에 흙(土)의 튼튼한 제방을 쌓아 안정을 찾고 있습니다.',
    work: '차가운 안개를 걷어내고 태산(戊土)의 굳건한 신념으로 길을 밝히고 있습니다.',
    relation: '따뜻한 차 한 잔으로 얼어붙은 마음을 녹이고 온기를 되찾고 있습니다.',
    choice: '불안을 종이에 적어 둑(土)을 쌓고 맑은 물길만을 흘려보내고 있습니다.',
  },
};

/**
 * 1단계 감정 + 2단계 사건 + 원국 결핍 오행 삼위일체 결합 맞춤 처방.
 */
export function getOfflinePrescription(
  emotion: EmotionElement,
  event: EventId,
  lacking?: string | null
): OfflinePrescription {
  const diagnosis =
    DYNAMIC_DIAGNOSIS[emotion]?.[event] ?? EMOTION_DIAGNOSIS[emotion](EVENT_SCENE[event]);
  let action = '';
  if (lacking && LACKING_ACTION[lacking]) {
    action = LACKING_ACTION[lacking];
  } else {
    action = DEFAULT_ACTION[emotion]?.[event] ?? EMOTION_ACTION[emotion][event];
  }
  return {
    diagnosis,
    action,
  };
}

// ───────────────────────── 컴포넌트 ─────────────────────────

const COLORS = {
  bg: '#0B1220',
  panel: '#131B2E',
  border: '#1F293D',
  borderStrong: '#2A3F66',
  cyan: '#00F0FF',
  gold: '#FFD700',
  purple: '#BD93F9',
  red: '#FF5555',
  text: '#E6EDF3',
  textMuted: '#8B9BB4',
  textDim: '#55657E',
};

const CHARGE_MS = 500;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export const DailyCardDeck: React.FC<DailyCardDeckProps> = ({
  onSave,
  onEventCategorySelect,
  lackingElement,
}) => {
  const [emotion, setEmotion] = useState<EmotionElement | null>(null);
  const [eventId, setEventId] = useState<EventId | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [shortMemo, setShortMemo] = useState('');
  const [percent, setPercent] = useState(0);
  const [saving, setSaving] = useState(false);

  const fill = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const charged = energy !== null;
  const ready = emotion !== null && eventId !== null;

  useEffect(() => {
    const id = fill.addListener(({ value }) => setPercent(Math.round(value * 100)));
    return () => {
      fill.removeListener(id);
      fill.stopAnimation();
    };
  }, [fill]);

  useEffect(() => {
    if (!charged) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0.25, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [charged, pulse]);

  const handleEmotion = useCallback(
    (key: EmotionElement) => {
      if (charged) return;
      playTick();
      setEmotion(key);
    },
    [charged]
  );

  const handleEvent = useCallback(
    (card: EventCard) => {
      if (charged) return;
      playTick();
      setEventId(card.id);
      onEventCategorySelect?.(card.category);
    },
    [charged, onEventCategorySelect]
  );

  const handleEnergy = useCallback(
    (level: EnergyLevel) => {
      if (charged || !ready) return;
      playCharge();
      setEnergy(level);
      fill.stopAnimation();
      fill.setValue(level / 100);
      Animated.timing(fill, {
        toValue: 1,
        duration: CHARGE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [charged, ready, fill]
  );

  const resetAll = useCallback(() => {
    fill.stopAnimation();
    fill.setValue(0);
    setEmotion(null);
    setEventId(null);
    setEnergy(null);
    setShortMemo('');
  }, [fill]);

  const handleRestart = useCallback(() => {
    playTick();
    resetAll();
  }, [resetAll]);

  const handleFinish = useCallback(async () => {
    if (saving || emotion === null || eventId === null || energy === null) return;
    const card = EVENT_CARDS.find((c) => c.id === eventId);
    if (!card) return;
    playTick();
    setSaving(true);
    try {
      await onSave({
        emotionElement: emotion,
        eventCategory: card.category,
        energyLevel: energy,
        shortMemo: shortMemo.trim() || undefined,
      });
      resetAll();
    } catch {
      // 저장 실패는 상위에서 안내한다. 처방 화면을 유지해 다시 시도할 수 있게 둔다.
    } finally {
      setSaving(false);
    }
  }, [saving, emotion, eventId, energy, shortMemo, onSave, resetAll]);

  const prescription =
    charged && emotion !== null && eventId !== null
      ? getOfflinePrescription(emotion, eventId, lackingElement)
      : null;

  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const fillColor = fill.interpolate({ inputRange: [0, 1], outputRange: [COLORS.cyan, COLORS.gold] });
  const cyanWeight = fill.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const cyanGlowOpacity = Animated.multiply(pulse, cyanWeight);
  const goldGlowOpacity = Animated.multiply(pulse, fill);

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>1단계 · 지금 내 감정의 오행</Text>
      <View style={styles.row}>
        {EMOTION_CARDS.map((card) => {
          const selected = emotion === card.key;
          return (
            <Pressable
              key={card.key}
              onPress={() => handleEmotion(card.key)}
              disabled={charged}
              accessibilityRole="button"
              accessibilityLabel={`${card.key}(${card.hanja}) ${card.keyword}`}
              accessibilityState={{ selected, disabled: charged }}
              style={({ pressed }) => [
                styles.emotionCard,
                selected && styles.emotionCardSelected,
                charged && !selected && styles.dimmed,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emotionEmoji}>{card.emoji}</Text>
              <Text style={[styles.hanja, selected && styles.hanjaSelected]}>{card.hanja}</Text>
              <Text style={[styles.emotionLabel, selected && styles.emotionLabelSelected]}>{card.key}</Text>
              <Text style={styles.keyword}>{card.keyword}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.stepTitle}>2단계 · 오늘 나를 흔든 사건</Text>
      <View style={styles.row}>
        {EVENT_CARDS.map((card) => {
          const selected = eventId === card.id;
          return (
            <Pressable
              key={card.id}
              onPress={() => handleEvent(card)}
              disabled={charged}
              accessibilityRole="button"
              accessibilityLabel={card.label}
              accessibilityState={{ selected, disabled: charged }}
              style={({ pressed }) => [
                styles.eventCard,
                selected && styles.eventCardSelected,
                charged && !selected && styles.dimmed,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.eventEmoji}>{card.emoji}</Text>
              <Text style={[styles.eventText, selected && styles.eventTextSelected]}>{card.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.stepTitle}>3단계 · 에너지 잔량을 탭하면 즉시 충전</Text>
      <View style={styles.row}>
        {ENERGY_CHIPS.map((level) => {
          const selected = energy === level;
          const locked = !ready || charged;
          return (
            <Pressable
              key={level}
              onPress={() => handleEnergy(level)}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel={`에너지 잔량 ${level}퍼센트`}
              accessibilityState={{ selected, disabled: locked }}
              style={({ pressed }) => [
                styles.energyChip,
                selected && styles.energyChipSelected,
                !ready && styles.dimmed,
                charged && !selected && styles.dimmed,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.energyText, selected && styles.energyTextSelected]}>{level}%</Text>
            </Pressable>
          );
        })}
      </View>
      {!ready && <Text style={styles.hint}>1단계와 2단계를 먼저 골라 주세요.</Text>}

      <View style={styles.batteryRow}>
        <View style={styles.batteryBody}>
          <Animated.View pointerEvents="none" style={[styles.glow, styles.glowCyan, { opacity: cyanGlowOpacity }]} />
          <Animated.View pointerEvents="none" style={[styles.glow, styles.glowGold, { opacity: goldGlowOpacity }]} />
          <Animated.View
            style={[styles.batteryShell, { borderColor: charged ? fillColor : COLORS.borderStrong }]}
            accessibilityRole="progressbar"
            accessibilityLabel="에너지 배터리"
            accessibilityValue={{ min: 0, max: 100, now: percent }}
          >
            <Animated.View style={[styles.batteryFill, { width: fillWidth, backgroundColor: fillColor }]} />
            <View pointerEvents="none" style={[styles.tick, { left: '25%' }]} />
            <View pointerEvents="none" style={[styles.tick, { left: '50%' }]} />
            <View pointerEvents="none" style={[styles.tick, { left: '75%' }]} />
            <Text pointerEvents="none" style={[styles.batteryPercent, !charged && styles.batteryPercentIdle]}>
              {charged ? `${percent}%` : '대기 중'}
            </Text>
          </Animated.View>
        </View>
        <Animated.View style={[styles.batteryNub, { backgroundColor: charged ? fillColor : COLORS.borderStrong }]} />
      </View>
      <Text style={styles.batteryCaption}>
        {charged ? `잔량 ${energy}% → 100% 충전 완료` : '잔량을 탭하면 배터리가 차오릅니다'}
      </Text>

      <Text style={styles.stepTitle}>오늘 하루 한 줄 기록 (선택)</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={shortMemo}
          onChangeText={setShortMemo}
          placeholder="오늘 어떤 일이 있었나요? (예: 오랜 거래처와 담판을 지었다)"
          placeholderTextColor="#8a6d75"
          style={styles.memoInput}
          maxLength={100}
        />
      </View>

      {prescription && (
        <View style={styles.prescription}>
          <Text style={styles.prescriptionTitle}>🧙 도사의 2줄 처방</Text>
          <Text style={styles.prescriptionLine1}>{prescription.diagnosis}</Text>
          <Text style={styles.prescriptionLine2}>{prescription.action}</Text>

          <Pressable
            onPress={handleFinish}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            style={({ pressed }) => [styles.finishButton, saving && styles.finishButtonBusy, pressed && styles.pressed]}
          >
            <Text style={styles.finishButtonText}>{saving ? '기록 중…' : '⚡ 내일 기운으로 리셋 완료'}</Text>
          </Pressable>
          <Pressable
            onPress={handleRestart}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [styles.restartButton, pressed && styles.pressed]}
          >
            <Text style={styles.restartButtonText}>↺ 다시 고르기</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const NEON_CYAN_GLOW = '0px 0px 18px 4px rgba(0, 240, 255, 0.85)';
const NEON_GOLD_GLOW = '0px 0px 18px 4px rgba(255, 215, 0, 0.85)';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  hint: {
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: -6,
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  dimmed: {
    opacity: 0.4,
  },

  emotionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    backgroundColor: COLORS.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emotionCardSelected: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    boxShadow: '0px 0px 10px 1px rgba(0, 240, 255, 0.55)',
  },
  emotionEmoji: { fontSize: 18, marginBottom: 2 },
  hanja: { color: COLORS.textMuted, fontSize: 26, fontWeight: '900' },
  hanjaSelected: {
    color: COLORS.cyan,
    textShadowColor: 'rgba(0, 240, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  emotionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  emotionLabelSelected: { color: COLORS.cyan },
  keyword: { color: COLORS.textDim, fontSize: 9, lineHeight: 12, marginTop: 4, textAlign: 'center' },

  eventCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    backgroundColor: COLORS.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventCardSelected: {
    borderColor: COLORS.purple,
    backgroundColor: 'rgba(189, 147, 249, 0.16)',
    boxShadow: '0px 0px 10px 1px rgba(189, 147, 249, 0.6)',
  },
  eventEmoji: { fontSize: 22, marginBottom: 4 },
  eventText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '800' },
  eventTextSelected: { color: COLORS.purple },

  energyChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  energyChipSelected: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    boxShadow: '0px 0px 10px 1px rgba(255, 215, 0, 0.55)',
  },
  energyText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '800' },
  energyTextSelected: { color: COLORS.gold },

  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  batteryBody: {
    flex: 1,
    height: 56,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  glowCyan: { boxShadow: NEON_CYAN_GLOW },
  glowGold: { boxShadow: NEON_GOLD_GLOW },
  batteryShell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#0D1424',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  batteryFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.45)',
  },
  batteryPercent: {
    textAlign: 'center',
    color: '#05070D',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  batteryPercentIdle: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  batteryNub: {
    width: 7,
    height: 22,
    marginLeft: 2,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  batteryCaption: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  inputContainer: {
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 2, 4, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  memoInput: {
    color: '#F4F7FB',
    fontSize: 13,
    paddingVertical: 4,
    minHeight: 34,
  },

  prescription: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
  },
  prescriptionTitle: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  prescriptionLine1: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '800',
  },
  prescriptionLine2: {
    color: COLORS.cyan,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: 10,
  },
  finishButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.cyan,
    boxShadow: '0px 0px 14px 2px rgba(0, 240, 255, 0.75)',
  },
  finishButtonBusy: { opacity: 0.6 },
  finishButtonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  restartButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  restartButtonText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
