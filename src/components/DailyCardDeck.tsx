import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { EmotionElement, EnergyLevel, EventCategory } from '../database/db';

export interface DailyCardData {
  emotionElement: EmotionElement;
  tarotCard?: string;
  eventCategory: EventCategory;
  energyLevel: EnergyLevel;
  shortMemo?: string;
}

interface DailyCardDeckProps {
  /** Promise를 반환하면 완료(성공) 후에만 넋두리 입력창을 비운다. 예외를 던지면 입력값을 유지한다. */
  onSave: (data: DailyCardData) => void | Promise<void>;
  /** 사건 영역 칩을 누를 때마다 호출된다 (이미 선택된 칩을 다시 눌러도 호출). */
  onEventCategorySelect?: (category: EventCategory) => void;
}

interface EmotionCard {
  key: EmotionElement;
  hanja: string;
  label: string;
  emoji: string;
  keyword: string;
}

const EMOTION_CARDS: readonly EmotionCard[] = [
  { key: '목', hanja: '木', label: '목', emoji: '🌲', keyword: '의욕 · 시작 · 조급함' },
  { key: '화', hanja: '火', label: '화', emoji: '🔥', keyword: '열정 · 분노 · 번아웃' },
  { key: '토', hanja: '土', label: '토', emoji: '🏔️', keyword: '답답 · 정체 · 무기력' },
  { key: '금', hanja: '金', label: '금', emoji: '⚔️', keyword: '결단 · 이별 · 날 선 마찰' },
  { key: '수', hanja: '水', label: '수', emoji: '🌊', keyword: '고독 · 불안 · 깊은 슬픔' },
];

interface TarotCard {
  numeral: string;
  name: string;
  keyword: string;
  element: EmotionElement;
}

const ELEMENT_META: Record<EmotionElement, { hanja: string; energy: string }> = {
  목: { hanja: '木', energy: '목(木) 기운 · 성장' },
  화: { hanja: '火', energy: '화(火) 기운 · 열정' },
  토: { hanja: '土', energy: '토(土) 기운 · 안정' },
  금: { hanja: '金', energy: '금(金) 기운 · 결단' },
  수: { hanja: '水', energy: '수(水) 기운 · 직관' },
};

const TAROT_CARDS: readonly TarotCard[] = [
  { numeral: '0', name: '바보', keyword: '새로운 시작, 자유로운 도약', element: '목' },
  { numeral: 'I', name: '마법사', keyword: '의지를 현실로 발현', element: '화' },
  { numeral: 'II', name: '여사제', keyword: '고요한 직관, 숨은 통찰', element: '수' },
  { numeral: 'III', name: '여황제', keyword: '풍요와 성장, 돌봄', element: '목' },
  { numeral: 'IV', name: '황제', keyword: '질서와 안정, 책임', element: '토' },
  { numeral: 'V', name: '교황', keyword: '전통과 가르침, 신뢰', element: '토' },
  { numeral: 'VI', name: '연인', keyword: '끌림과 선택, 교감', element: '화' },
  { numeral: 'VII', name: '전차', keyword: '돌파와 전진, 승부', element: '금' },
  { numeral: 'VIII', name: '힘', keyword: '부드러운 용기, 인내', element: '목' },
  { numeral: 'IX', name: '은둔자', keyword: '내면 성찰, 홀로 깊어짐', element: '수' },
  { numeral: 'X', name: '운명의 수레바퀴', keyword: '흐름의 전환, 기회', element: '목' },
  { numeral: 'XI', name: '정의', keyword: '균형과 판단, 공정', element: '금' },
  { numeral: 'XII', name: '매달린 사람', keyword: '멈춤과 관점 전환', element: '수' },
  { numeral: 'XIII', name: '죽음', keyword: '끝맺음과 정리, 재탄생', element: '금' },
  { numeral: 'XIV', name: '절제', keyword: '조화와 중용, 회복', element: '토' },
  { numeral: 'XV', name: '악마', keyword: '집착과 속박, 정체', element: '토' },
  { numeral: 'XVI', name: '탑', keyword: '급변과 폭발, 돌파구', element: '화' },
  { numeral: 'XVII', name: '별', keyword: '희망과 치유, 맑은 위로', element: '수' },
  { numeral: 'XVIII', name: '달', keyword: '불안과 환상, 흐릿한 경계', element: '수' },
  { numeral: 'XIX', name: '태양', keyword: '활력과 성공, 선명함', element: '화' },
  { numeral: 'XX', name: '심판', keyword: '각성과 결단, 부름', element: '금' },
  { numeral: 'XXI', name: '세계', keyword: '완성과 통합, 마무리', element: '토' },
];

function drawRandomTarot(previous: TarotCard | null): TarotCard | null {
  if (TAROT_CARDS.length === 0) return null;
  let next = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)] ?? null;
  if (previous && next === previous && TAROT_CARDS.length > 1) {
    const index = TAROT_CARDS.indexOf(previous);
    next = TAROT_CARDS[(index + 1 + Math.floor(Math.random() * (TAROT_CARDS.length - 1))) % TAROT_CARDS.length] ?? next;
  }
  return next;
}

interface EventChip {
  key: EventCategory;
  emoji: string;
  label: string;
  sub: string;
}

const EVENT_CARDS: readonly EventChip[] = [
  { key: '돈/대박', emoji: '💰', label: '돈/대박', sub: '자금회수 · 손재수 · 대박 타이밍' },
  { key: '치정/바람', emoji: '💔', label: '치정/바람', sub: '상대 속마음 · 딴눈/바람기 · 애증' },
  { key: '생존/직장', emoji: '⚔️', label: '생존/직장', sub: '사업 혈투 · 거래처/배신수 · 이직' },
  { key: '건강/액땜', emoji: '🩹', label: '건강/액땜', sub: '급살 · 번아웃 · 사고수 조심' },
];

const ENERGY_CHIPS: readonly EnergyLevel[] = [25, 50, 75, 100];

const MEMO_MAX_LENGTH = 50;

const COLORS = {
  bg: '#0B1220',
  panel: '#131B2E',
  border: '#1F293D',
  cyan: '#00F0FF',
  purple: '#BD93F9',
  red: '#FF5555',
  textMuted: '#8B9BB4',
  textDim: '#55657E',
};

export const DailyCardDeck: React.FC<DailyCardDeckProps> = ({ onSave, onEventCategorySelect }) => {
  const [emotionElement, setEmotionElement] = useState<EmotionElement | null>(null);
  const [drawnCard, setDrawnCard] = useState<TarotCard | null>(null);
  const [eventCategory, setEventCategory] = useState<EventCategory | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null);
  const [shortMemo, setShortMemo] = useState('');

  const flip = useRef(new Animated.Value(0)).current;
  const isDrawingRef = useRef(false);

  useEffect(() => {
    return () => {
      flip.stopAnimation();
    };
  }, [flip]);

  const handleDraw = useCallback(() => {
    if (isDrawingRef.current) return;
    isDrawingRef.current = true;

    const flipToFront = () => {
      setDrawnCard((prev) => drawRandomTarot(prev));
      Animated.timing(flip, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        isDrawingRef.current = false;
      });
    };

    if (drawnCard) {
      Animated.timing(flip, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(flipToFront);
    } else {
      flipToFront();
    }
  }, [drawnCard, flip]);

  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const doneCount = [emotionElement, drawnCard, eventCategory, energyLevel].filter(
    (value) => value !== null
  ).length;
  const isComplete = doneCount === 4;

  const resonanceNote =
    emotionElement && drawnCard
      ? drawnCard.element === emotionElement
        ? `✦ 의식과 무의식이 같은 ${ELEMENT_META[emotionElement].hanja} 기운으로 공명 중`
        : `의식 ${ELEMENT_META[emotionElement].hanja} ↔ 무의식 ${ELEMENT_META[drawnCard.element].hanja} · 서로 다른 기운이 교차 중`
      : null;

  const handleSave = useCallback(async () => {
    if (
      emotionElement === null ||
      drawnCard === null ||
      eventCategory === null ||
      energyLevel === null
    ) {
      return;
    }
    const trimmedMemo = shortMemo.trim();
    try {
      await onSave({
        emotionElement,
        tarotCard: drawnCard.name,
        eventCategory,
        energyLevel,
        shortMemo: trimmedMemo.length > 0 ? trimmedMemo : undefined,
      });
      setShortMemo('');
    } catch {
      // 저장 실패 시 상위에서 오류를 안내하므로 입력한 넋두리를 그대로 남긴다.
    }
  }, [emotionElement, drawnCard, eventCategory, energyLevel, shortMemo, onSave]);

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>1단계 · 오늘의 의식 · 감정 오행 카드</Text>
      <View style={styles.row}>
        {EMOTION_CARDS.map((card) => {
          const selected = emotionElement === card.key;
          return (
            <Pressable
              key={card.key}
              onPress={() => setEmotionElement(card.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.emotionCard,
                selected && styles.emotionCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emotionEmoji}>{card.emoji}</Text>
              <Text style={[styles.hanja, selected && styles.hanjaSelected]}>{card.hanja}</Text>
              <Text style={[styles.emotionLabel, selected && styles.emotionLabelSelected]}>
                {card.label}
              </Text>
              <Text style={styles.keyword}>{card.keyword}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.stepTitle}>2단계 · 오늘의 무의식 · 운명 타로 카드</Text>
      <View style={styles.tarotStage}>
        <View style={styles.tarotCardBox}>
          <Animated.View
            style={[
              styles.tarotFace,
              styles.tarotBack,
              { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
            ]}
          >
            <Text style={styles.tarotBackGlyph}>◈</Text>
            <Text style={styles.tarotBackText}>운명</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.tarotFace,
              styles.tarotFront,
              { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
            ]}
          >
            {drawnCard && (
              <>
                <Text style={styles.tarotNumeral}>{drawnCard.numeral}</Text>
                <Text style={styles.tarotElementGlyph}>{ELEMENT_META[drawnCard.element].hanja}</Text>
                <Text style={styles.tarotName}>{drawnCard.name}</Text>
                <Text style={styles.tarotKeyword}>{drawnCard.keyword}</Text>
                <Text style={styles.tarotEnergy}>{ELEMENT_META[drawnCard.element].energy}</Text>
              </>
            )}
          </Animated.View>
        </View>
      </View>

      <Pressable
        onPress={handleDraw}
        accessibilityRole="button"
        style={({ pressed }) => [styles.drawButton, pressed && styles.pressed]}
      >
        <Text style={styles.drawButtonText}>{drawnCard ? '🎴 다시 뽑기' : '🎴 운명 타로 1장 뽑기'}</Text>
      </Pressable>
      {resonanceNote && <Text style={styles.resonanceNote}>{resonanceNote}</Text>}

      <Text style={styles.stepTitle}>3단계 · 사건 영역</Text>
      <View style={styles.eventGrid}>
        {EVENT_CARDS.map((chip) => {
          const selected = eventCategory === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => {
                setEventCategory(chip.key);
                onEventCategorySelect?.(chip.key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.eventCard,
                selected && styles.eventCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.eventEmoji}>{chip.emoji}</Text>
              <Text style={[styles.eventText, selected && styles.eventTextSelected]}>{chip.label}</Text>
              <Text style={styles.eventSub}>{chip.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.stepTitle}>4단계 · 기운 잔량</Text>
      <View style={styles.row}>
        {ENERGY_CHIPS.map((level) => {
          const selected = energyLevel === level;
          const lowEnergy = level === 25;
          return (
            <Pressable
              key={level}
              onPress={() => setEnergyLevel(level)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.energyChip,
                selected && (lowEnergy ? styles.energyChipLow : styles.energyChipSelected),
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.energyText,
                  selected && (lowEnergy ? styles.energyTextLow : styles.energyTextSelected),
                ]}
              >
                {level}%
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.stepTitle}>5단계 · 오늘의 넋두리 한 줄</Text>
      <TextInput
        style={styles.memoInput}
        value={shortMemo}
        onChangeText={setShortMemo}
        maxLength={MEMO_MAX_LENGTH}
        placeholder="오늘 가슴에 맺힌 말이나 넋두리 한 줄... (선택)"
        placeholderTextColor="#475569"
        returnKeyType="done"
        autoCorrect={false}
      />
      <Text style={styles.memoCounter}>
        {shortMemo.length}/{MEMO_MAX_LENGTH}
      </Text>

      <Pressable
        onPress={handleSave}
        disabled={!isComplete}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isComplete }}
        style={({ pressed }) => [
          styles.saveButton,
          isComplete ? styles.saveButtonActive : styles.saveButtonDisabled,
          isComplete && pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.saveButtonText, !isComplete && styles.saveButtonTextDisabled]}>
          {isComplete ? '⚡ 4초 교차 공명 기록 완료' : `4가지를 모두 선택해 주세요 (${doneCount}/4)`}
        </Text>
      </Pressable>
    </View>
  );
};

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
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },

  resonanceNote: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 14,
  },

  tarotStage: {
    alignItems: 'center',
    marginBottom: 12,
  },
  tarotCardBox: {
    width: 190,
    height: 250,
  },
  tarotFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backfaceVisibility: 'hidden',
  },
  tarotBack: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  tarotBackGlyph: {
    color: COLORS.cyan,
    fontSize: 54,
    textShadowColor: 'rgba(0, 240, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tarotBackText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 8,
  },
  tarotFront: {
    backgroundColor: '#161030',
    borderColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },
  tarotNumeral: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  tarotElementGlyph: {
    color: COLORS.cyan,
    fontSize: 56,
    fontWeight: '900',
    marginVertical: 6,
    textShadowColor: 'rgba(0, 240, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tarotName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  tarotKeyword: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
  },
  tarotEnergy: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
  },
  drawButton: {
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.purple,
    backgroundColor: 'rgba(189, 147, 249, 0.16)',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  drawButtonText: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  hanja: {
    color: COLORS.textMuted,
    fontSize: 26,
    fontWeight: '900',
  },
  hanjaSelected: {
    color: COLORS.cyan,
    textShadowColor: 'rgba(0, 240, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  emotionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  emotionLabelSelected: {
    color: COLORS.cyan,
  },
  emotionEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  keyword: {
    color: COLORS.textDim,
    fontSize: 9,
    lineHeight: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  eventGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  eventCard: {
    width: '48.5%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: COLORS.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventCardSelected: {
    borderColor: COLORS.purple,
    backgroundColor: 'rgba(189, 147, 249, 0.16)',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  eventEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  eventText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  eventSub: {
    color: COLORS.textDim,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  eventTextSelected: {
    color: COLORS.purple,
  },

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
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  energyChipLow: {
    borderColor: COLORS.red,
    backgroundColor: 'rgba(255, 85, 85, 0.14)',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  energyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  energyTextSelected: {
    color: COLORS.cyan,
  },
  energyTextLow: {
    color: COLORS.red,
  },

  memoInput: {
    height: 42,
    backgroundColor: '#0D1424',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3F66',
    color: '#E6EDF3',
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 13,
  },
  memoCounter: {
    color: COLORS.textDim,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 12,
  },

  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  saveButtonActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 10,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
  },
  saveButtonText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  saveButtonTextDisabled: {
    color: COLORS.textDim,
    fontWeight: '700',
  },
});
