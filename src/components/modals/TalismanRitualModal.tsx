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

const SLOT_TITLES = [
  {
    step: 1,
    kr: '1. 현재 막힌 혈 (현재의 병목)',
    jp: '1. 現在の滞り (現在のボトルネック)',
    kickerKr: '현재 막힌 혈',
    kickerJp: '現在の滞り',
    color: '#FF2A4B',
  },
  {
    step: 2,
    kr: '2. 도사리는 살(煞) (잠복 리스크·인물)',
    jp: '2. 潜むリスク・人物 (潜伏する煞)',
    kickerKr: '도사리는 살(煞)',
    kickerJp: '潜むリスク・人物',
    color: '#BD93F9',
  },
  {
    step: 3,
    kr: '3. 기운 수혈 비책 (오행 주입)',
    jp: '3. 五行注入の秘策 (気の水血)',
    kickerKr: '기운 수혈 비책',
    kickerJp: '五行注入の秘策',
    color: '#00F5D4',
  },
];

export const TalismanRitualModal = memo(function TalismanRitualModal({
  visible,
  onClose,
  onComplete,
}: TalismanRitualModalProps) {
  const { isJa } = useLocale();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setSelectedIds([]);
    }
  }, [visible]);

  const handlePickCard = (cardId: string) => {
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
    void playHaptic('tap');
    setSelectedIds([]);
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

            {/* 상단 가이드 */}
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* 5장의 부적 카드 덱 */}
              <View style={styles.cardDeckGrid}>
                {TALISMAN_CARDS.map((card, idx) => {
                  const pickIndex = selectedIds.indexOf(card.id);
                  const isPicked = pickIndex !== -1;

                  return (
                    <Pressable
                      key={card.id}
                      onPress={() => handlePickCard(card.id)}
                      disabled={isPicked}
                      style={({ pressed }) => [
                        styles.deckCard,
                        isPicked && styles.deckCardPicked,
                        pressed && styles.deckCardPressed,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isPicked
                            ? ['#2a0c14', '#150508']
                            : ['#1d111e', '#0e0811']
                        }
                        style={styles.cardInner}
                      >
                        {isPicked ? (
                          <View style={styles.pickedBadge}>
                            <Text style={styles.pickedBadgeText}>
                              {pickIndex + 1}
                            </Text>
                          </View>
                        ) : null}

                        <Text
                          style={[
                            styles.talismanHanja,
                            { color: isPicked ? card.color : '#8a6d75' },
                          ]}
                        >
                          {card.hanja}
                        </Text>
                        <Text
                          style={[
                            styles.talismanName,
                            { color: isPicked ? '#ffffff' : '#a8949b' },
                          ]}
                          numberOfLines={1}
                        >
                          {isJa ? card.name.jp : card.name.kr}
                        </Text>

                        {!isPicked && (
                          <Text style={styles.runeHint}>
                            {isJa ? '秘策の札' : '비책 부적'}
                          </Text>
                        )}
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>

              {/* 3단계 수혈 슬롯 결과 */}
              <View style={styles.slotsContainer}>
                {SLOT_TITLES.map((slot, index) => {
                  const cardId = selectedIds[index];
                  const card = TALISMAN_CARDS.find((c) => c.id === cardId);

                  return (
                    <View
                      key={slot.step}
                      style={[
                        styles.slotCard,
                        card && {
                          borderColor: slot.color,
                          backgroundColor: 'rgba(28, 6, 12, 0.75)',
                        },
                      ]}
                    >
                      <View style={styles.slotHeader}>
                        <View
                          style={[
                            styles.slotStepBadge,
                            { borderColor: slot.color },
                          ]}
                        >
                          <Text
                            style={[
                              styles.slotStepText,
                              { color: slot.color },
                            ]}
                          >
                            {isJa ? slot.kickerJp : slot.kickerKr}
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
                            <Text style={styles.slotRevealedElement}>
                              [{card.hanja}]
                            </Text>
                          </View>
                          <Text style={styles.slotRevealedDesc}>
                            {isJa ? card.desc.jp : card.desc.kr}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.slotEmpty}>
                          <Text style={styles.slotEmptyText}>
                            {isJa
                              ? `上から${index + 1}枚目の札をタップして開示`
                              : `위에서 ${index + 1}번째 비책 카드를 탭하여 봉인 해제`}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* 3장 선택 완료 시 황금빛 이펙트 배너 */}
              {isFinished && (
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
                {isFinished ? (
                  <Pressable
                    onPress={() => {
                      void playHaptic('snap');
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.confirmBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.confirmBtnText}>
                      {isJa
                        ? '秘策を吸収して閉じる (完了)'
                        : '비책 흡수 완료 (기운 담고 닫기)'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleReset}
                    style={({ pressed }) => [
                      styles.resetBtn,
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '92%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 42, 75, 0.4)',
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
  guideBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
    marginBottom: 6,
  },
  deckCard: {
    width: '30%',
    minWidth: 90,
    aspectRatio: 0.85,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.3)',
    overflow: 'hidden',
  },
  deckCardPicked: {
    borderColor: '#00F5D4',
    opacity: 0.9,
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
  },
  pickedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00F5D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickedBadgeText: {
    color: '#060102',
    fontSize: 12,
    fontWeight: '900',
  },
  talismanHanja: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  talismanName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  runeHint: {
    marginTop: 2,
    fontSize: 9,
    color: '#6e565c',
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
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  slotStepText: {
    fontSize: 11,
    fontWeight: '800',
  },
  slotStepNum: {
    color: '#6e565c',
    fontSize: 10,
    fontWeight: '700',
  },
  slotRevealed: {
    marginTop: 4,
  },
  slotCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  slotRevealedName: {
    fontSize: 14,
    fontWeight: '800',
  },
  slotRevealedElement: {
    color: '#ffb703',
    fontSize: 12,
    fontWeight: '700',
  },
  slotRevealedDesc: {
    color: '#e0d2d6',
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
    borderColor: '#ffb703',
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
    color: '#ffb703',
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
