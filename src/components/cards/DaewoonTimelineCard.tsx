import React, { memo, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playHaptic } from '../reels/haptics';
import { useLocale } from '../../locales';
import { WealthFlowChart } from '../charts/WealthFlowChart';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;

const LUXURY_GLASS = (
  IS_WEB
    ? {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      }
    : null
) as unknown as ViewStyle | null;

export interface DaewoonTimelineCardProps {
  active?: boolean;
  height?: number;
  userProfile?: any;
  saju?: any;
  onOpenTimeline?: () => void;
  lang?: 'kr' | 'jp';
}

export const DaewoonTimelineCard: React.FC<DaewoonTimelineCardProps> = memo(function DaewoonTimelineCard({
  active = true,
  height,
  userProfile,
  onOpenTimeline,
  lang,
}) {
  const insets = useSafeAreaInsets();
  const { isJa } = useLocale();
  const effectiveLang: 'kr' | 'jp' = lang || (isJa ? 'jp' : 'kr');

  return (
    <View style={[styles.page, { height }]} pointerEvents={active ? 'auto' : 'none'}>
      {/* 1. 배경 그라데이션 */}
      <LinearGradient
        colors={['#1c0c08', '#0e0503', '#060201']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          {
            paddingTop: Math.max(insets.top, 44) + 48,
            paddingBottom: Math.max(insets.bottom, 16) + 68,
          },
        ]}
      >
        {/* 2. 헤더 블록: 상단 헤더 뱃지와 중복 없이 메인 타이틀 즉시 시작 */}
        <View style={styles.titleWrap}>
          <Text style={styles.mainTitle}>
            {effectiveLang === 'jp' ? '10年ごとに変わる人生の波' : '10년 주기 운명의 거대한 파도'}
          </Text>
          <Text style={styles.subTitle}>
            {effectiveLang === 'jp'
              ? '現在乗っている大運とこれから訪れる富の変曲点'
              : '현재 지나고 있는 대운과 다가올 현금 흐름의 변곡점'}
          </Text>
        </View>

        {/* 3. 10년 주기 재물선 & 현금 흐름 변곡점 차트 모듈 */}
        <WealthFlowChart
          userProfile={userProfile}
          userName={userProfile?.name}
          lang={effectiveLang}
        />

        {/* 4. 10년 대운 전체 해단 보기 버튼 */}
        <Pressable
          onPress={() => {
            void playHaptic('tap');
            onOpenTimeline?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={effectiveLang === 'jp' ? '10年大運の詳細解断を見る' : '10년 대운 전체 해단 보기'}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={['#D97706', '#F59E0B', '#B45309']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.ctaButtonText}>
            {effectiveLang === 'jp' ? '[ 10年大運の全体解断を見る ↗ ]' : '[ 10년 대운 전체 해단 보기 ↗ ]'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0a0405',
  },
  scrollBody: {
    paddingHorizontal: 16,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  titleWrap: {
    marginBottom: 14,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
    letterSpacing: -0.4,
    ...KEEP_ALL,
  },
  subTitle: {
    color: '#BFA8A8',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
    ...KEEP_ALL,
  },

  /* 가로 스크롤 타임라인 */
  sliderContainer: {
    marginBottom: 16,
  },
  sliderContent: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  timelineCard: {
    width: 105,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 10, 12, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineCardCurrent: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: 'rgba(69, 26, 3, 0.55)',
    ...(IS_WEB
      ? ({ boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)' } as unknown as ViewStyle)
      : null),
  },
  timelineCardSelected: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(88, 28, 13, 0.65)',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
    backgroundColor: '#F59E0B',
  },
  currentBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  ageText: {
    color: '#8A99AD',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 2,
  },
  ageTextActive: {
    color: '#FDE68A',
  },
  ganjiText: {
    color: '#F4F7FB',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  ganjiTextActive: {
    color: '#FBBF24',
  },
  godRow: {
    marginBottom: 6,
  },
  godText: {
    color: '#C9D3E0',
    fontSize: 10,
    fontWeight: '600',
  },
  wealthMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  wealthMiniBadgeCurrent: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  wealthMiniScore: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },

  /* 재물 그래프 카드 */
  graphCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    backgroundColor: 'rgba(20, 10, 12, 0.82)',
    padding: 14,
    marginBottom: 16,
  },
  graphHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  graphTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  graphIcon: {
    fontSize: 14,
  },
  graphTitle: {
    color: '#FFF1E0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  selectedScoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  selectedScoreLabel: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
  },
  selectedScoreNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  svgWrapper: {
    width: '100%',
    paddingVertical: 4,
  },
  graphLegendRow: {
    marginTop: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 6,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* 심층 전술 브리핑 박스 */
  briefingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    backgroundColor: 'rgba(18, 9, 11, 0.82)',
    padding: 14,
    marginBottom: 20,
  },
  briefingHeader: {
    marginBottom: 10,
  },
  briefingTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    ...KEEP_ALL,
  },
  stepInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  stepInfoTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepInfoTagGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  stepInfoTagText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  stepInfoTagTextGold: {
    color: '#FDE68A',
    fontWeight: '800',
  },
  adviceBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  adviceText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    ...KEEP_ALL,
  },
  ctaButton: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ctaButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
