import React, { memo, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import {
  CoreCategory,
  generateCoreStrategy,
  getTomorrowOmen,
} from '../../engine/tomorrowStrategy';
import type { SajuResult } from '../../engine/types';
import type { PartnerProfile } from '../../database/db';
import { playHaptic } from '../reels/haptics';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;

interface TomorrowStrategyAccordionProps {
  unlocked: boolean;
  saju: SajuResult | null;
  partner?: PartnerProfile | null;
  partnerSaju?: SajuResult | null;
  baseDate?: Date;
  onOpenDaily?: () => void;
  onOpenPartner?: () => void;
}

import { useLocale } from '../../locales';

const CORE_CATEGORIES: Array<{ key: CoreCategory; label: string; labelJa: string; icon: string }> = [
  { key: 'wealth', label: '재물', labelJa: '金運', icon: '💰' },
  { key: 'love', label: '사랑', labelJa: '恋愛', icon: '❤️' },
  { key: 'career', label: '직업', labelJa: '仕事', icon: '💼' },
  { key: 'health', label: '건강', labelJa: '健康', icon: '🌿' },
  { key: 'business', label: '비즈니스', labelJa: 'ビジネス', icon: '🏢' },
];

export const TomorrowStrategyAccordion = memo(function TomorrowStrategyAccordion({
  unlocked,
  saju,
  partner,
  partnerSaju,
  baseDate = new Date(),
  onOpenDaily,
  onOpenPartner,
}: TomorrowStrategyAccordionProps) {
  const [expanded, setExpanded] = useState(unlocked);
  const [category, setCategory] = useState<CoreCategory>(() => {
    try {
      const saved = (globalThis as any)?.localStorage?.getItem('cybersaju.tomorrow_category');
      if (saved && ['wealth', 'love', 'career', 'health', 'business'].includes(saved)) {
        return saved as CoreCategory;
      }
    } catch {}
    return 'wealth';
  });
  const [planText, setPlanText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [hasCalculated, setHasCalculated] = useState(false);
  const { isJa } = useLocale();

  // 정산 완료(unlocked) 시 자동으로 아코디언이 스르륵 펼쳐지도록 연동
  React.useEffect(() => {
    if (unlocked) {
      setExpanded(true);
    }
  }, [unlocked]);

  // 기준일의 익일(내일) 오행 및 신살
  const tomorrowDate = useMemo(() => {
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 12, 0);
  }, [baseDate]);

  const omen = useMemo(() => getTomorrowOmen(saju, tomorrowDate), [saju, tomorrowDate]);

  const strategy = useMemo(() => {
    const raw = generateCoreStrategy(
      category,
      planText,
      omen,
      saju,
      partnerSaju ?? null,
      partner?.alias || partner?.relation
    );
    return {
      ...raw,
      headline: raw.headline.replace(/\([^)]*\)/g, '').trim(),
      strategyText: raw.strategyText.replace(/\([^)]*\)/g, '').trim(),
    };
  }, [category, planText, omen, saju, partnerSaju, partner]);

  const toggleExpand = () => {
    void playHaptic('tap');
    if (!unlocked) {
      onOpenDaily?.();
      return;
    }
    setExpanded((prev) => !prev);
  };

  const handleSelectCategory = (cat: CoreCategory) => {
    void playHaptic('tap');
    setCategory(cat);
    try {
      (globalThis as any)?.localStorage?.setItem('cybersaju.tomorrow_category', cat);
    } catch {}
  };

  const handleCalculate = () => {
    if (isLoading) return;
    void playHaptic('tap');
    setIsLoading(true);
    setLoadingPhase(0);

    setTimeout(() => {
      setLoadingPhase(1);
    }, 900);

    setTimeout(() => {
      setIsLoading(false);
      setHasCalculated(true);
      void playHaptic('snap');
    }, 1800);
  };

  if (!unlocked) {
    return (
      <Pressable
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={isJa ? '明日の天機 ＆ 作戦設計 ロック状態' : '내일의 천기 및 작전 설계 잠금 상태. 정산으로 해금'}
        style={({ pressed }) => [styles.lockedCard, pressed && styles.pressed]}
      >
        <View style={styles.lockedHeader}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <View style={styles.lockedTitleBox}>
            <Text style={styles.lockedTitle}>{isJa ? '明日の天機 ＆ 作戦設計' : '내일의 천기 & 작전 설계'}</Text>
            <Text style={styles.lockedSub}>
              {isJa ? '1日3秒五行決算でバッテリー100%充電時に即時解禁' : '3초 오행 정산에서 배터리 100% 완충 시 즉시 해금됩니다'}
            </Text>
          </View>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>{isJa ? '充電が必要 ⚡' : '충전 필요 ⚡'}</Text>
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
            <Text style={styles.unlockedChipText}>
              {isJa ? '✨ 100%充電完了 · 天機漏洩' : '✨ 100% 완충 해금 · 천기누설'}
            </Text>
          </View>
          <Text style={styles.cardTitle}>{isJa ? '明日の天機 ＆ 作戦設計' : '내일의 천기 & 작전 설계'}</Text>
          <Text style={styles.cardSub}>
            {isJa ? '明日' : '내일'} {omen.ganji} ({omen.stemGod}·{omen.branchGod}) · {omen.shinsal.primary}
          </Text>
        </View>
        <View style={styles.toggleBtn}>
          <Text style={styles.toggleBtnText}>
            {expanded ? (isJa ? '▲ 閉じる' : '▲ 접기') : (isJa ? '▼ 作戦を開く' : '▼ 작전 열기')}
          </Text>
        </View>
      </Pressable>

      {/* 펼쳐졌을 때 콘텐츠 */}
      {expanded && (
        <View style={styles.cardContent}>
          {/* 내일 신살 & 일진 배지 */}
          <View style={styles.omenBadgeRow}>
            <View style={styles.omenBadge}>
              <Text style={styles.omenBadgeLabel}>{isJa ? '明日の日辰' : '내일 일진'}</Text>
              <Text style={styles.omenBadgeValue}>{omen.ganji} ({omen.stemGod})</Text>
            </View>
            <View style={styles.omenBadge}>
              <Text style={styles.omenBadgeLabel}>{isJa ? '核心の気·神殺' : '핵심 기운·신살'}</Text>
              <Text style={styles.omenBadgeValueHighlight}>{omen.shinsal.primary}</Text>
            </View>
          </View>
          <Text style={styles.shinsalDesc}>{omen.shinsal.description}</Text>

          {/* 5대 본질 코어 카테고리 선택 칩 */}
          <Text style={styles.inputLabel}>
            {isJa ? '5大コア作戦分野を選択してください' : '5대 코어 작전 분야를 선택하세요'}
          </Text>
          <View style={styles.coreChipsRow}>
            {CORE_CATEGORIES.map((c) => {
              const selected = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => handleSelectCategory(c.key)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.coreChip,
                    selected && styles.coreChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.coreChipText, selected && styles.coreChipTextSelected]}>
                    {c.icon} {isJa ? c.labelJa : c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 사랑 카테고리인데 상대방 사주가 등록되어 있지 않은 경우 안내 배너 */}
          {category === 'love' && !partnerSaju && (
            <View style={styles.partnerNoticeBox}>
              <Text style={styles.partnerNoticeText}>
                ⚠️ 상대방 사주 명식이 아직 없습니다. 두 사람의 합(合)·충(沖)과 도화를 정밀하게 보려면 상대방 명식을 등록하세요.
              </Text>
              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  onOpenPartner?.();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.partnerNoticeBtn, pressed && styles.pressed]}
              >
                <Text style={styles.partnerNoticeBtnText}>+ 상대방 사주 등록하기 ✏️</Text>
              </Pressable>
            </View>
          )}

          {/* 상대방 사주가 이미 등록되어 있을 때 연동 안내 칩 */}
          {category === 'love' && Boolean(partnerSaju) && (
            <View style={styles.partnerLinkedBox}>
              <Text style={styles.partnerLinkedText}>
                🔗 {partner?.alias || partner?.relation || '상대방'}({partnerSaju?.dayMaster} 일간)과의 합충 정밀 대조 중
              </Text>
            </View>
          )}

          {/* 구체적 계획 및 고민 입력창 */}
          <Text style={styles.inputLabel}>구체적인 계획이나 고민 (선택)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={planText}
              onChangeText={setPlanText}
              placeholder="내일 계획 중인 구체적인 일이나 고민을 자유롭게 적어주세요 (예: 단가 협상, 소개팅, 계약 체결)"
              placeholderTextColor="#8a6d75"
              style={styles.textInput}
              maxLength={80}
            />
          </View>

          {/* ⚡ 옥통자 맞춤 작전 해단받기 버튼 */}
          <Pressable
            onPress={handleCalculate}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="옥통자 맞춤 작전 해단받기"
            style={({ pressed }) => [
              styles.calcActionBtn,
              isLoading && styles.calcActionBtnBusy,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.calcActionBtnText}>
              {isLoading
                ? '🔮 옥통자가 천기를 관조하는 중...'
                : hasCalculated
                ? '↺ 다른 고민으로 다시 점지받기'
                : '⚡ 옥통자 맞춤 작전 해단받기 ↗'}
            </Text>
          </Pressable>

          {/* 신명 연산 로딩 상태 */}
          {isLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#ff2a4b" />
              <Text style={styles.loadingPulseText}>
                {loadingPhase === 0
                  ? '🔮 옥통자가 천기를 관조하는 중...'
                  : `⚡ 내일의 일진(${omen.ganji})과 ${saju?.dayMaster ?? '戊'}土 일간의 십신·신살 기운을 맞물리는 중...`}
              </Text>
            </View>
          )}

          {/* 연산 완료 후 정통 명리 작전 해단 카드 */}
          {hasCalculated && !isLoading && (
            <View style={styles.strategyBox}>
              <View style={styles.strategyHeader}>
                <Text style={styles.strategyKicker}>{strategy.headline}</Text>
              </View>
              <Text style={styles.strategyBody}>{strategy.strategyText}</Text>
            </View>
          )}

          {!hasCalculated && !isLoading && (
            <Text style={styles.preCalcHint}>
              분야와 고민을 확인하신 후 위 [작전 해단받기]를 누르시면 옥통자의 천기 연산이 시작됩니다.
            </Text>
          )}
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
    marginBottom: 14,
    textAlign: 'center',
    ...KEEP_ALL,
  },

  inputLabel: {
    color: '#F4F7FB',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    ...KEEP_ALL,
  },

  coreChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  coreChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(40, 10, 18, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.6)',
  },
  coreChipSelected: {
    backgroundColor: 'rgba(255, 30, 56, 0.28)',
    borderColor: '#ff2a4b',
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 10px rgba(255, 42, 75, 0.4)',
        } as unknown as ViewStyle)
      : null),
  },
  coreChipText: {
    color: '#c9a4aa',
    fontSize: 12,
    fontWeight: '700',
  },
  coreChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  partnerNoticeBox: {
    borderRadius: 10,
    backgroundColor: 'rgba(80, 20, 28, 0.65)',
    borderWidth: 1,
    borderColor: '#ff4b60',
    padding: 10,
    marginBottom: 12,
  },
  partnerNoticeText: {
    color: '#ffccd5',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    ...KEEP_ALL,
  },
  partnerNoticeBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ff1f3d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  partnerNoticeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  partnerLinkedBox: {
    borderRadius: 8,
    backgroundColor: 'rgba(20, 80, 60, 0.4)',
    borderWidth: 1,
    borderColor: '#00F5D4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  partnerLinkedText: {
    color: '#00F5D4',
    fontSize: 11,
    fontWeight: '800',
    ...KEEP_ALL,
  },

  inputWrap: {
    borderRadius: 10,
    backgroundColor: 'rgba(15, 2, 4, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: 14,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 4,
  },

  strategyBox: {
    borderRadius: 12,
    backgroundColor: 'rgba(15, 2, 4, 0.9)',
    borderWidth: 1,
    borderColor: '#ff2a4b',
    padding: 14,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 16px rgba(255, 42, 75, 0.25)',
        } as unknown as ViewStyle)
      : null),
  },
  strategyHeader: {
    marginBottom: 8,
  },
  strategyKicker: {
    color: '#ff4b60',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    ...KEEP_ALL,
  },
  strategyBody: {
    color: '#F4F7FB',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '700',
    ...KEEP_ALL,
  },

  calcActionBtn: {
    backgroundColor: '#ff1f3d',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 18px rgba(255, 31, 61, 0.45)',
        } as unknown as ViewStyle)
      : null),
  },
  calcActionBtnBusy: {
    backgroundColor: 'rgba(180, 20, 40, 0.65)',
  },
  calcActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 4, 8, 0.95)',
    borderWidth: 1.5,
    borderColor: '#ff2a4b',
    padding: 14,
    marginBottom: 14,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 20px rgba(255, 42, 75, 0.35)',
        } as unknown as ViewStyle)
      : null),
  },
  loadingPulseText: {
    color: '#ff758f',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    lineHeight: 18,
    ...KEEP_ALL,
  },
  preCalcHint: {
    color: '#a8868e',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
    ...KEEP_ALL,
  },
  pressed: {
    opacity: 0.8,
  },
});
