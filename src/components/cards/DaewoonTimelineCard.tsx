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
import { formatSajuTerm } from '../../utils/sajuTerms';
import { calculateDaewoonTimeline, DaewoonStep } from '../../utils/daewoonGraph';

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

function createSmoothSvgPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
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

  // 대운 8개 타임라인 목록 산출
  const timeline: DaewoonStep[] = useMemo(() => {
    return calculateDaewoonTimeline(userProfile, 51, effectiveLang);
  }, [userProfile, effectiveLang]);

  // 기본 선택 인덱스: 현재 대운 (없으면 0)
  const defaultIdx = useMemo(() => {
    const currentIdx = timeline.findIndex((item) => item.isCurrent);
    return currentIdx !== -1 ? currentIdx : 0;
  }, [timeline]);

  const [selectedIdx, setSelectedIdx] = useState<number>(defaultIdx);
  const selectedStep: DaewoonStep = timeline[selectedIdx] || timeline[0];

  const handleSelectStep = (idx: number) => {
    void playHaptic('tap');
    setSelectedIdx(idx);
  };

  // Sparkline 그래프 좌표 계산
  const svgWidth = 320;
  const svgHeight = 110;
  const padX = 22;
  const padY = 22;
  const stepX = (svgWidth - padX * 2) / Math.max(1, timeline.length - 1);

  const graphPts = useMemo(() => {
    return timeline.map((step, idx) => {
      const x = padX + idx * stepX;
      const y = (svgHeight - padY) - (step.wealthScore / 100) * (svgHeight - padY * 2);
      return {
        x,
        y,
        score: step.wealthScore,
        isCurrent: step.isCurrent,
        isSelected: idx === selectedIdx,
        ganji: step.ganji,
      };
    });
  }, [timeline, selectedIdx, stepX]);

  const curvePath = useMemo(() => createSmoothSvgPath(graphPts), [graphPts]);
  const areaPath = useMemo(() => {
    if (graphPts.length === 0) return '';
    const first = graphPts[0];
    const last = graphPts[graphPts.length - 1];
    return `${curvePath} L ${last.x.toFixed(1)} ${svgHeight - 4} L ${first.x.toFixed(1)} ${svgHeight - 4} Z`;
  }, [curvePath, graphPts]);

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

        {/* 3. 10년 주기 가로 스크롤 타임라인 슬라이더 */}
        <View style={styles.sliderContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sliderContent}
          >
            {timeline.map((step, idx) => {
              const isSelected = idx === selectedIdx;
              const isCurrent = step.isCurrent;

              return (
                <Pressable
                  key={`${step.ganji}-${idx}`}
                  onPress={() => handleSelectStep(idx)}
                  style={({ pressed }) => [
                    styles.timelineCard,
                    isCurrent && styles.timelineCardCurrent,
                    isSelected && styles.timelineCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  {/* 현재 대운 뱃지 */}
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>
                        {effectiveLang === 'jp' ? '現在の大運' : '현재 대운'}
                      </Text>
                    </View>
                  )}

                  {/* 나이 표기 */}
                  <Text style={[styles.ageText, (isCurrent || isSelected) && styles.ageTextActive]}>
                    {effectiveLang === 'jp'
                      ? `満${step.ageStart}歳 ~ ${step.ageEnd}歳`
                      : `만 ${step.ageStart}세 ~ ${step.ageEnd}세`}
                  </Text>

                  {/* 간지 (干支) */}
                  <Text style={[styles.ganjiText, (isCurrent || isSelected) && styles.ganjiTextActive]}>
                    {step.ganji}
                  </Text>

                  {/* 십신/통변성 */}
                  <View style={styles.godRow}>
                    <Text style={styles.godText}>
                      {formatSajuTerm(step.stemGod, effectiveLang)} · {formatSajuTerm(step.branchGod, effectiveLang)}
                    </Text>
                  </View>

                  {/* 재물 지수 미니 뱃지 */}
                  <View style={[styles.wealthMiniBadge, isCurrent && styles.wealthMiniBadgeCurrent]}>
                    <Text style={styles.wealthMiniScore}>
                      💰 {step.wealthScore}{effectiveLang === 'jp' ? '点' : '점'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. 재물선 & 현금 흐름 변곡점 그래프 (Neon SVG Sparkline) */}
        <View style={[styles.graphCard, LUXURY_GLASS]}>
          <View style={styles.graphHeaderRow}>
            <View style={styles.graphTitleGroup}>
              <Text style={styles.graphIcon}>📈</Text>
              <Text style={styles.graphTitle}>
                {effectiveLang === 'jp' ? '八大大運の富・エネルギー変曲曲線' : '8대 대운 재물 에너지 변곡선'}
              </Text>
            </View>
            <View style={styles.selectedScoreBox}>
              <Text style={styles.selectedScoreLabel}>
                {selectedStep.ganji}
              </Text>
              <Text style={styles.selectedScoreNumber}>
                {selectedStep.wealthScore}%
              </Text>
            </View>
          </View>

          {/* SVG Sparkline Curve */}
          <View style={styles.svgWrapper}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: svgHeight, overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="wealthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="wealthLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>

              {/* 기준 그리드 가이드선 (30%, 70%) */}
              <line
                x1={padX}
                y1={svgHeight - padY - 0.7 * (svgHeight - padY * 2)}
                x2={svgWidth - padX}
                y2={svgHeight - padY - 0.7 * (svgHeight - padY * 2)}
                stroke="rgba(255, 184, 0, 0.12)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={padX}
                y1={svgHeight - padY - 0.3 * (svgHeight - padY * 2)}
                x2={svgWidth - padX}
                y2={svgHeight - padY - 0.3 * (svgHeight - padY * 2)}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* 곡선 아래 영역 그라데이션 채우기 */}
              {areaPath ? (
                <path d={areaPath} fill="url(#wealthAreaGrad)" />
              ) : null}

              {/* 네온 메인 곡선 */}
              {curvePath ? (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="url(#wealthLineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ) : null}

              {/* 각 포인트 노드 */}
              {graphPts.map((pt, i) => {
                const isPtSelected = i === selectedIdx;
                const isPtCurrent = pt.isCurrent;

                return (
                  <g key={`pt-${i}`} style={{ cursor: 'pointer' }} onClick={() => handleSelectStep(i)}>
                    {/* 선택 또는 현재 노드 펄스 효과 */}
                    {isPtSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="11"
                        fill="rgba(245, 158, 11, 0.25)"
                      />
                    )}
                    {/* 노드 포인트 */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isPtSelected ? 5.5 : isPtCurrent ? 4.5 : 3.2}
                      fill={isPtSelected ? '#FFF' : isPtCurrent ? '#FBBF24' : '#64748B'}
                      stroke={isPtSelected ? '#F59E0B' : '#0F172A'}
                      strokeWidth={isPtSelected ? '2.5' : '1.5'}
                    />
                    {/* 선택된 노드 점수 표시 */}
                    {isPtSelected && (
                      <text
                        x={pt.x}
                        y={Math.max(12, pt.y - 12)}
                        textAnchor="middle"
                        fill="#FBBF24"
                        fontSize="11"
                        fontWeight="bold"
                        letterSpacing="0.2"
                      >
                        {pt.score}
                      </text>
                    )}
                    {/* 하단 간지 라벨 */}
                    <text
                      x={pt.x}
                      y={svgHeight}
                      textAnchor="middle"
                      fill={isPtSelected ? '#FBBF24' : '#64748B'}
                      fontSize="9"
                      fontWeight={isPtSelected ? 'bold' : 'normal'}
                    >
                      {pt.ganji}
                    </text>
                  </g>
                );
              })}
            </svg>
          </View>

          {/* 그래프 하단 Y축 / 범례 안내 */}
          <View style={styles.graphLegendRow}>
            <Text style={styles.legendText}>
              {effectiveLang === 'jp'
                ? '資金流入期 (好機) ⬆ / 守成・資金防衛期 ⬇'
                : '자금 유입기(기회) ⬆ / 수성 및 누수 방어기 ⬇'}
            </Text>
          </View>
        </View>

        {/* 5. 선택/현재 대운 심층 전술 브리핑 박스 */}
        <View style={[styles.briefingCard, LUXURY_GLASS]}>
          <View style={styles.briefingHeader}>
            <Text style={styles.briefingTitle}>
              {effectiveLang === 'jp'
                ? `⚡ ${selectedStep.isCurrent ? '現在' : selectedStep.ganji}の大運における勝負処と実りの時期`
                : `⚡ ${selectedStep.isCurrent ? '현재' : selectedStep.ganji} 대운의 결정적 승부처 & 현금 결실 시기`}
            </Text>
          </View>

          {/* 선택 대운 정보 태그 */}
          <View style={styles.stepInfoRow}>
            <View style={styles.stepInfoTag}>
              <Text style={styles.stepInfoTagText}>
                {effectiveLang === 'jp'
                  ? `満${selectedStep.ageStart}歳 ~ ${selectedStep.ageEnd}歳`
                  : `만 ${selectedStep.ageStart}세 ~ ${selectedStep.ageEnd}세`}
              </Text>
            </View>
            <View style={[styles.stepInfoTag, styles.stepInfoTagGold]}>
              <Text style={[styles.stepInfoTagText, styles.stepInfoTagTextGold]}>
                {selectedStep.ganji} ({formatSajuTerm(selectedStep.stemGod, effectiveLang)} · {formatSajuTerm(selectedStep.branchGod, effectiveLang)})
              </Text>
            </View>
            <View style={styles.stepInfoTag}>
              <Text style={styles.stepInfoTagText}>
                {effectiveLang === 'jp' ? '富の指数' : '재물 지수'} {selectedStep.wealthScore}%
              </Text>
            </View>
          </View>

          {/* 조언 본문 */}
          <View style={styles.adviceBox}>
            <Text style={styles.adviceText}>
              {effectiveLang === 'jp' ? selectedStep.advice.jp : selectedStep.advice.kr}
            </Text>
          </View>

          {/* 10년 대운 전체 해단 보기 버튼 */}
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
        </View>
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
