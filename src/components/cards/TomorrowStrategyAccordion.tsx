import React, { memo, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { generateTomorrowStrategy, getTomorrowOmen } from '../../engine/tomorrowStrategy';
import type { SajuResult } from '../../engine/types';
import { playHaptic } from '../reels/haptics';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;

interface TomorrowStrategyAccordionProps {
  unlocked: boolean;
  saju: SajuResult | null;
  onOpenDaily?: () => void;
}

const QUICK_PLANS = [
  { label: '🎬 영화 데이트', text: '여친과 영화 데이트' },
  { label: '💼 투자 미팅', text: '투자 미팅 및 사업 협상' },
  { label: '✈️ 이동/출장', text: '지방 출장 및 외근' },
  { label: '📝 계약/담판', text: '거래처와 계약 담판' },
  { label: '🛌 휴식/힐링', text: '집에서 휴식 및 충전' },
];

export const TomorrowStrategyAccordion = memo(function TomorrowStrategyAccordion({
  unlocked,
  saju,
  onOpenDaily,
}: TomorrowStrategyAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const [planText, setPlanText] = useState('여친과 영화 데이트');

  const omen = useMemo(() => getTomorrowOmen(saju), [saju]);
  const strategyText = useMemo(
    () => generateTomorrowStrategy(planText, omen),
    [planText, omen]
  );

  const toggleExpand = () => {
    void playHaptic('tap');
    if (!unlocked) {
      onOpenDaily?.();
      return;
    }
    setExpanded((prev) => !prev);
  };

  const handleQuickSelect = (text: string) => {
    void playHaptic('tap');
    setPlanText(text);
  };

  if (!unlocked) {
    return (
      <Pressable
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel="내일의 천기 및 작전 설계 잠금 상태. 정산으로 해금"
        style={({ pressed }) => [styles.lockedCard, pressed && styles.pressed]}
      >
        <View style={styles.lockedHeader}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <View style={styles.lockedTitleBox}>
            <Text style={styles.lockedTitle}>내일의 천기 & 작전 설계</Text>
            <Text style={styles.lockedSub}>
              3초 오행 정산에서 배터리 100% 완충 시 즉시 해금됩니다
            </Text>
          </View>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>충전 필요 ⚡</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {/* 헤더 (탭 시 펼침/접힘 토글) */}
      <Pressable
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel="내일의 천기 및 작전 설계 아코디언 토글"
        style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.unlockedChip}>
            <Text style={styles.unlockedChipText}>✨ 100% 완충 해금 · 천기누설</Text>
          </View>
          <Text style={styles.cardTitle}>내일의 천기 & 작전 설계</Text>
          <Text style={styles.cardSub}>
            내일 {omen.ganji} · {omen.shinsal.name} ({omen.elementTitle})
          </Text>
        </View>
        <View style={styles.toggleBtn}>
          <Text style={styles.toggleBtnText}>{expanded ? '▲ 접기' : '▼ 작전 열기'}</Text>
        </View>
      </Pressable>

      {/* 펼쳐졌을 때 콘텐츠 */}
      {expanded && (
        <View style={styles.cardContent}>
          {/* 내일 신살 & 일진 배지 */}
          <View style={styles.omenBadgeRow}>
            <View style={styles.omenBadge}>
              <Text style={styles.omenBadgeLabel}>내일 일진</Text>
              <Text style={styles.omenBadgeValue}>{omen.ganji} ({omen.godName})</Text>
            </View>
            <View style={styles.omenBadge}>
              <Text style={styles.omenBadgeLabel}>핵심 신살</Text>
              <Text style={styles.omenBadgeValueHighlight}>{omen.shinsal.name}</Text>
            </View>
          </View>
          <Text style={styles.shinsalDesc}>{omen.shinsal.description}</Text>

          {/* 일정 질문 및 입력창 */}
          <Text style={styles.inputLabel}>내일 중요한 일정이나 계획이 있나요?</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={planText}
              onChangeText={setPlanText}
              placeholder="예: 여친과 영화 데이트, 투자 미팅"
              placeholderTextColor="#8a6d75"
              style={styles.textInput}
              maxLength={60}
            />
          </View>

          {/* 퀵 플랜 태그들 */}
          <View style={styles.quickChipsRow}>
            {QUICK_PLANS.map((q) => {
              const selected = planText === q.text;
              return (
                <Pressable
                  key={q.label}
                  onPress={() => handleQuickSelect(q.text)}
                  style={({ pressed }) => [
                    styles.quickChip,
                    selected && styles.quickChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.quickChipText, selected && styles.quickChipTextSelected]}>
                    {q.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 무당 지문 톤 맞춤 작전 해단 카드 */}
          <View style={styles.strategyBox}>
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyKicker}>⚡ 무당 신명의 맞춤 작전</Text>
            </View>
            <Text style={styles.strategyBody}>{strategyText}</Text>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  lockedCard: {
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(28, 4, 8, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.45)',
    padding: 14,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 16px rgba(180, 20, 40, 0.12)',
        } as unknown as ViewStyle)
      : null),
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedIcon: {
    fontSize: 22,
  },
  lockedTitleBox: {
    flex: 1,
  },
  lockedTitle: {
    color: '#E0CDD1',
    fontSize: 14,
    fontWeight: '800',
    ...KEEP_ALL,
  },
  lockedSub: {
    color: '#8a6d75',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
    ...KEEP_ALL,
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 30, 56, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.35)',
  },
  lockedBadgeText: {
    color: '#ff4b60',
    fontSize: 10,
    fontWeight: '800',
  },

  cardContainer: {
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 8, 14, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(185, 28, 28, 0.75)',
    padding: 16,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 24px rgba(255, 30, 60, 0.22), inset 0 0 12px rgba(255, 42, 75, 0.12)',
        } as unknown as ViewStyle)
      : null),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  unlockedChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
    marginBottom: 6,
  },
  unlockedChipText: {
    color: '#00F5D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: '#F4F7FB',
    fontSize: 17,
    fontWeight: '900',
    ...KEEP_ALL,
  },
  cardSub: {
    color: '#ff758f',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    ...KEEP_ALL,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 30, 56, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.5)',
  },
  toggleBtnText: {
    color: '#ff4b60',
    fontSize: 11,
    fontWeight: '800',
  },

  cardContent: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127, 29, 29, 0.45)',
    paddingTop: 12,
  },
  omenBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  omenBadge: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 2, 4, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.5)',
    alignItems: 'center',
  },
  omenBadgeLabel: {
    color: '#8a6d75',
    fontSize: 10,
    fontWeight: '700',
  },
  omenBadgeValue: {
    color: '#F4F7FB',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  omenBadgeValueHighlight: {
    color: '#ff2a4b',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  shinsalDesc: {
    color: '#c9a4aa',
    fontSize: 11,
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'center',
    ...KEEP_ALL,
  },

  inputLabel: {
    color: '#F4F7FB',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
    ...KEEP_ALL,
  },
  inputWrap: {
    borderRadius: 10,
    backgroundColor: 'rgba(15, 2, 4, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: 8,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 4,
  },

  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  quickChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(40, 10, 18, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.6)',
  },
  quickChipSelected: {
    backgroundColor: 'rgba(255, 30, 56, 0.25)',
    borderColor: '#ff2a4b',
  },
  quickChipText: {
    color: '#c9a4aa',
    fontSize: 11,
    fontWeight: '700',
  },
  quickChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  strategyBox: {
    borderRadius: 12,
    backgroundColor: 'rgba(15, 2, 4, 0.85)',
    borderWidth: 1,
    borderColor: '#ff2a4b',
    padding: 12,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 14px rgba(255, 42, 75, 0.2)',
        } as unknown as ViewStyle)
      : null),
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  strategyKicker: {
    color: '#ff4b60',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  strategyBody: {
    color: '#F4F7FB',
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '700',
    ...KEEP_ALL,
  },

  pressed: {
    opacity: 0.8,
  },
});
