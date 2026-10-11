import React, { memo, useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocale } from '../../locales';
import { playHaptic } from '../reels/haptics';
import { TALISMAN_CARDS, TalismanCardItem } from '../../data/shamanChamberData';
import { isDailyActionDone, setDailyActionDone } from '../../utils/dailyLock';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;

const GOLD_GLOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 24px rgba(255, 183, 3, 0.45)',
      }
    : null
) as unknown as ViewStyle | null;

interface TalismanRitualModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const STEP_BADGES = [
  {
    step: 1,
    kr: 'STEP 01: 현재 막힌 혈',
    jp: 'STEP 01: 現在の滞り',
    color: '#FF0055',
  },
  {
    step: 2,
    kr: 'STEP 02: 도사리는 살',
    jp: 'STEP 02: 潜むリスク',
    color: '#BD93F9',
  },
  {
    step: 3,
    kr: 'STEP 03: 기운 수혈 비책',
    jp: 'STEP 03: 注入秘策',
    color: '#00FFCC',
  },
];

export const TalismanRitualModal = memo(function TalismanRitualModal({
  visible,
  onClose,
  onComplete,
}: TalismanRitualModalProps) {
  const { isJa } = useLocale();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [alreadyDone, setAlreadyDone] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setSelectedIds([]);
      setAlreadyDone(isDailyActionDone('talisman_ritual'));
    }
  }, [visible]);

  const handlePickCard = (cardId: string) => {
    if (alreadyDone) return;
    if (selectedIds.includes(cardId)) return;
    if (selectedIds.length >= 3) return;

    void playHaptic('tap');
    const next = [...selectedIds, cardId];
    setSelectedIds(next);

    if (next.length === 3) {
      void playHaptic('snap');
      onComplete?.();
    }
  };

  const handleReset = () => {
    if (alreadyDone) return;
    void playHaptic('tap');
    setSelectedIds([]);
  };

  const handleFinish = () => {
    void playHaptic('snap');
    setDailyActionDone('talisman_ritual');
    setAlreadyDone(true);
    onComplete?.();
    onClose();
  };

  const isFinished = selectedIds.length === 3;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="배경 닫기"
        />

        <View style={styles.sheet}>
          <LinearGradient
            colors={['#1c040a', '#100306', '#060102']}
            locations={[0, 0.5, 1]}
            style={styles.sheetGradient}
          >
            {/* 상단 헤더 */}
            <View style={styles.headerRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {isJa ? '⚡ 3カード気の注入儀式' : '⚡ 3카드 기운 수혈 리추얼'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  onClose();
                }}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityLabel={isJa ? '閉じる' : '닫기'}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>
              {isJa ? '五行神託 · 気の注入リチュアル' : '선천 오행 · 기운 수혈 리추얼'}
            </Text>

            {/* 1일 1회 희소성 잠금 배너 */}
            {alreadyDone ? (
              <View style={[styles.lockedBanner, GOLD_GLOW]}>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>
                    {isJa ? '本日の注入完了' : '오늘 수혈 완료'}
                  </Text>
                </View>
                <Text style={styles.lockedTitle}>
                  {isJa
                    ? '本日の気の注入は既に完了しました'
                    : '오늘의 기운 수혈을 이미 마쳤습니다'}
                </Text>
                <Text style={styles.lockedSub}>
                  {isJa
                    ? '気は午前0時（子時）に再び満ちあふれます。授かった秘策を胸に刻み、明日を切り開いてください。'
                    : '기운은 자정에 다시 차오릅니다. 이미 뼈에 새겨진 비책을 가슴에 품고 담대히 나아가세요.'}
                </Text>
              </View>
            ) : (
              <View style={styles.guideBox}>
                <Text style={styles.guideText}>
                  {isJa
                    ? '目を閉じ深呼吸をして、直感が引き寄せる秘策の札を3枚選べ。'
                    : '눈을 감고 호흡을 고른 뒤, 손끝을 강하게 당기는 비책 카드 3장을 골라라.'}
                </Text>
                <Text style={styles.progressText}>
                  {isJa
                    ? `選択進行: ${selectedIds.length} / 3枚`
                    : `선택 진행: ${selectedIds.length} / 3장`}
                </Text>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* 5장의 부적 카드 덱 */}
              <View style={styles.cardDeckGrid}>
                {TALISMAN_CARDS.map((card) => {
                  const pickIndex = selectedIds.indexOf(card.id);
                  const isPicked = pickIndex !== -1;
                  const cardColor = card.color;

                  return (
                    <Pressable
                      key={card.id}
                      onPress={() => handlePickCard(card.id)}
                      disabled={isPicked || alreadyDone}
                      style={({ pressed }) => [
                        styles.deckCard,
                        { borderColor: isPicked ? cardColor : 'rgba(255, 42, 75, 0.3)' },
                        isPicked && [
                          styles.deckCardPicked,
                          IS_WEB ? ({ boxShadow: `0 0 16px ${cardColor}66` } as unknown as ViewStyle) : null,
                        ],
                        alreadyDone && styles.deckCardDisabled,
                        pressed && styles.deckCardPressed,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isPicked
                            ? ['#2a0c16', '#140409']
                            : ['#190b14', '#0d0408']
                        }
                        style={styles.cardInner}
                      >
                        {isPicked ? (
                          <View style={[styles.pickedBadge, { backgroundColor: cardColor }]}>
                            <Text style={styles.pickedBadgeText}>
                              {pickIndex + 1}
                            </Text>
                          </View>
                        ) : null}

                        <Text
                          style={[
                            styles.talismanHanja,
                            { color: isPicked ? cardColor : '#8a6d75' },
                          ]}
                        >
                          {card.hanja || card.element}
                        </Text>
                        <Text
                          style={[
                            styles.talismanName,
                            { color: isPicked ? '#ffffff' : '#c9adb6' },
                          ]}
                          numberOfLines={1}
                        >
                          {isJa ? card.name.jp : card.name.kr}
                        </Text>
                        <View style={[styles.archetypeBadge, { borderColor: `${cardColor}66` }]}>
                          <Text style={[styles.archetypeText, { color: cardColor }]}>
                            {isJa ? card.archetype.jp : card.archetype.kr}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>

              {/* 3단계 수혈 슬롯 결과 */}
              <View style={styles.slotsContainer}>
                {STEP_BADGES.map((slot, index) => {
                  const cardId = selectedIds[index];
                  const card = TALISMAN_CARDS.find((c) => c.id === cardId);

                  return (
                    <View
                      key={slot.step}
                      style={[
                        styles.slotCard,
                        card && {
                          borderColor: slot.color,
                          backgroundColor: 'rgba(28, 6, 12, 0.85)',
                          ...(IS_WEB ? ({ boxShadow: `0 0 12px ${slot.color}33` } as unknown as ViewStyle) : null),
                        },
                      ]}
                    >
                      <View style={styles.slotHeader}>
                        <View
                          style={[
                            styles.slotStepBadge,
                            { borderColor: slot.color, backgroundColor: `${slot.color}1a` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.slotStepText,
                              { color: slot.color },
                            ]}
                          >
                            {isJa ? slot.jp : slot.kr}
                          </Text>
                        </View>
                        <Text style={styles.slotStepNum}>STEP 0{slot.step}</Text>
                      </View>

                      {card ? (
                        <View style={styles.slotRevealed}>
                          <View style={styles.slotCardTitleRow}>
                            <Text
                              style={[
                                styles.slotRevealedName,
                                { color: card.color },
                              ]}
                            >
                              {isJa ? card.name.jp : card.name.kr}
                            </Text>
                            <Text style={styles.slotRevealedArchetype}>
                              [{isJa ? card.archetype.jp : card.archetype.kr}]
                            </Text>
                          </View>
                          <Text style={styles.slotRevealedDesc}>
                            {isJa ? card.meaning.jp : card.meaning.kr}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.slotEmpty}>
                          <Text style={styles.slotEmptyText}>
                            {alreadyDone
                              ? (isJa ? '本日の注入が完了しています' : '오늘의 기운 수혈이 완료되었습니다')
                              : (isJa
                                  ? `上から${index + 1}枚目の札をタップして開示`
                                  : `위에서 ${index + 1}번째 비책 카드를 탭하여 봉인 해제`)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* 3장 선택 완료 시 황금빛 이펙트 배너 */}
              {isFinished && !alreadyDone && (
                <View style={[styles.finishedBanner, GOLD_GLOW]}>
                  <Text style={styles.finishedIcon}>⚡</Text>
                  <Text style={styles.finishedTitle}>
                    {isJa
                      ? '⚡ 気の100%注入完了 (五行回路 起動)'
                      : '⚡ 기운 100% 수혈 완료 (오행 회로 가동)'}
                  </Text>
                  <Text style={styles.finishedSub}>
                    {isJa
                      ? '滞っていた経穴が開き、3大秘策が魂に刻み込まれました。'
                      : '막혀 있던 경혈이 뚫리고 3대 비책의 기운이 뼈에 새겨졌습니다.'}
                  </Text>
                </View>
              )}

              {/* 하단 버튼 액션 */}
              <View style={styles.bottomActions}>
                {alreadyDone ? (
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                      styles.confirmBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.confirmBtnText}>
                      {isJa ? '閉じる (本日の受領完了)' : '닫기 (오늘 수혈 완료됨)'}
                    </Text>
                  </Pressable>
                ) : isFinished ? (
                  <Pressable
                    onPress={handleFinish}
                    style={({ pressed }) => [
                      styles.confirmBtn,
                      GOLD_GLOW,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.confirmBtnText}>
                      {isJa
                        ? '秘策を吸収して完了 (気の注入)'
                        : '비책 흡수 완료 (기운 100% 수혈)'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleReset}
                    disabled={selectedIds.length === 0}
                    style={({ pressed }) => [
                      styles.resetBtn,
                      selectedIds.length === 0 && { opacity: 0.5 },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.resetBtnText}>
                      {isJa ? '↺ 選択を最初からやり直す' : '↺ 다시 선택하기'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '94%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 42, 75, 0.45)',
  },
  sheetGradient: {
    padding: 20,
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 42, 75, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.5)',
  },
  badgeText: {
    color: '#FF2A4B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#8b97a8',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    ...KEEP_ALL,
  },
  lockedBanner: {
    backgroundColor: 'rgba(255, 183, 3, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#ffb700',
    alignItems: 'center',
    gap: 4,
  },
  lockedBadge: {
    backgroundColor: '#ffb700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  lockedBadgeText: {
    color: '#0a0104',
    fontSize: 11,
    fontWeight: '900',
  },
  lockedTitle: {
    color: '#ffb700',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    ...KEEP_ALL,
  },
  lockedSub: {
    color: '#fbe0a1',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    ...KEEP_ALL,
  },
  guideBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guideText: {
    color: '#f0d0d8',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    ...KEEP_ALL,
  },
  progressText: {
    marginTop: 4,
    color: '#ffb703',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollBody: {
    paddingBottom: 16,
    gap: 14,
  },
  cardDeckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 4,
  },
  deckCard: {
    width: '30%',
    minWidth: 92,
    aspectRatio: 0.82,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  deckCardPicked: {
    opacity: 0.95,
  },
  deckCardDisabled: {
    opacity: 0.45,
  },
  deckCardPressed: {
    transform: [{ scale: 0.96 }],
  },
  cardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    position: 'relative',
    gap: 2,
  },
  pickedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickedBadgeText: {
    color: '#060102',
    fontSize: 11,
    fontWeight: '900',
  },
  talismanHanja: {
    fontSize: 20,
    fontWeight: '900',
  },
  talismanName: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  archetypeBadge: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  archetypeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  slotsContainer: {
    gap: 10,
  },
  slotCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 5, 8, 0.6)',
    padding: 12,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotStepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  slotStepText: {
    fontSize: 11,
    fontWeight: '900',
  },
  slotStepNum: {
    color: '#8a6d75',
    fontSize: 10,
    fontWeight: '700',
  },
  slotRevealed: {
    marginTop: 2,
  },
  slotCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  slotRevealedName: {
    fontSize: 14,
    fontWeight: '900',
  },
  slotRevealedArchetype: {
    color: '#ffb700',
    fontSize: 12,
    fontWeight: '800',
  },
  slotRevealedDesc: {
    color: '#f0e0e4',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    ...KEEP_ALL,
  },
  slotEmpty: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  slotEmptyText: {
    color: '#6e565c',
    fontSize: 12,
    fontWeight: '600',
  },
  finishedBanner: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    borderWidth: 1.5,
    borderColor: '#ffb700',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  finishedIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  finishedTitle: {
    color: '#ffb700',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  finishedSub: {
    marginTop: 4,
    color: '#fff3d1',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    ...KEEP_ALL,
  },
  bottomActions: {
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: '#ff2a4b',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  resetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#8b97a8',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
