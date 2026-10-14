/**
 * [CYBER-SAJU] 10년 주기 재물선 & 현금 흐름 변곡점 차트 모듈
 * (src/components/charts/WealthFlowChart.tsx)
 * 
 * - 정통 대운수(daewoonNum) 및 만 나이(International Age) 동적 연동
 * - 10대부터 80대까지 8대 대운의 '현금 유입도 및 비즈니스 승부 지수(0~100점)' 시각화
 * - 현재 만 나이 구간 네온 골드(#ffb700) 글로우 하이라이트 & [NOW / 現在] 배지
 * - 자금 유입기(기회) vs 수성기(방어) 시각화 및 타이밍 코칭:
 *   1) 재성/식상 대운 (확장·결실기)
 *   2) 인성/관성 대운 (시스템·문서 구축기)
 *   3) 비겁 대운 (리스크 방어·독립기)
 * - kr / jp 언어 완벽 분리, 정중한 경어체 및 [이름] 님 / [名前]様 호칭 규칙 준수
 */

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
import { playHaptic } from '../reels/haptics';

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

export type WealthDaewoonCategory = 'wealth_expansion' | 'system_document' | 'risk_defense';

export interface WealthDaewoonPoint {
  index: number;
  ageStart: number;
  ageEnd: number;
  ganji: string;
  stemGod: string;
  branchGod: string;
  score: number; // 0 ~ 100
  isCurrent: boolean;
  category: WealthDaewoonCategory;
  categoryTitle: {
    kr: string;
    jp: string;
  };
  coachingText: {
    kr: string;
    jp: string;
  };
}

export interface WealthFlowChartProps {
  userProfile?: {
    name?: string;
    birthDate?: string;
    birthTime?: string;
    gender?: 'male' | 'female';
    daewoonNum?: number;
  } | null;
  userName?: string | null;
  lang?: 'kr' | 'jp';
  onSelectPeriod?: (point: WealthDaewoonPoint) => void;
}

/**
 * 십신을 3대 재물 전략 카테고리로 분류
 */
function categorizeGods(stem: string, branch: string): WealthDaewoonCategory {
  const combined = `${stem} ${branch}`;
  // 1) 재성/식상: 확장·결실기
  if (/(정재|편재|식신|상관|財|食|傷)/.test(combined)) {
    return 'wealth_expansion';
  }
  // 2) 인성/관성: 시스템·문서 구축기
  if (/(정인|편인|인성|인수|정관|편관|관성|印|官)/.test(combined)) {
    return 'system_document';
  }
  // 3) 비겁: 리스크 방어·독립기
  return 'risk_defense';
}

/**
 * 사용자 프로필과 대운수를 기반으로 10대~80대 8대 대운 데이터 산출
 */
function generateWealthPoints(
  userProfile?: WealthFlowChartProps['userProfile'],
  userName?: string | null,
  isJa: boolean = false
): WealthDaewoonPoint[] {
  const baseNum = userProfile?.daewoonNum && userProfile.daewoonNum >= 1 && userProfile.daewoonNum <= 10
    ? userProfile.daewoonNum
    : 6; // 기본 정통 6대운

  // 만 나이 계산
  let currentAge = 51;
  if (userProfile?.birthDate) {
    const bYear = parseInt(String(userProfile.birthDate).slice(0, 4), 10);
    if (!isNaN(bYear) && bYear > 1900) {
      currentAge = new Date().getFullYear() - bYear;
    }
  }

  // 8대 대운 간지 및 십신 원형 테이블 (대운 흐름)
  const daewoonArchetypes = [
    { ganji: '戊寅', stem: '편관', branch: '비견', baseScore: 48 },
    { ganji: '己卯', stem: '정관', branch: '겁재', baseScore: 56 },
    { ganji: '庚辰', stem: '편인', branch: '식신', baseScore: 72 },
    { ganji: '辛巳', stem: '정인', branch: '상관', baseScore: 88 },
    { ganji: '壬午', stem: '비견', branch: '편재', baseScore: 68 },
    { ganji: '癸未', stem: '겁재', branch: '정재', baseScore: 62 },
    { ganji: '甲申', stem: '식신', branch: '편관', baseScore: 92 },
    { ganji: '乙酉', stem: '상관', branch: '정관', baseScore: 84 },
  ];

  const displayNameKr = (userName && userName.trim()) || '인연자';
  const displayNameJp = (userName && userName.trim()) || 'ご縁者';

  let hasCurrent = false;

  const points: WealthDaewoonPoint[] = daewoonArchetypes.map((item, idx) => {
    const ageStart = baseNum + idx * 10;
    const ageEnd = ageStart + 9;
    const isCurrent = currentAge >= ageStart && currentAge <= ageEnd;
    if (isCurrent) hasCurrent = true;

    const category = categorizeGods(item.stem, item.branch);

    let categoryTitle = {
      kr: '재성·식상 대운 (확장·결실기)',
      jp: '財星・食傷大運 (拡張・結実期)',
    };
    let coachingText = {
      kr: `${displayNameKr} 님, 지지 금고가 열리고 현금 회전이 극대화되는 승부처입니다. 핵심 파이프라인과 프랜차이즈·시스템 확장에 힘을 실으십시오.`,
      jp: `${displayNameJp}様、財庫が開きキャッシュフローが最大化される勝負期です。主力事業とシステムの拡大に注力してください。`,
    };

    if (category === 'system_document') {
      categoryTitle = {
        kr: '인성·관성 대운 (시스템·문서 구축기)',
        jp: '印星・官星大運 (システム・文書構築期)',
      };
      coachingText = {
        kr: `${displayNameKr} 님, 계약과 문서, 지적재산권이 단단한 방파제가 되어 자산을 지키는 시기입니다. 법인 기반과 자동화 시스템을 다지십시오.`,
        jp: `${displayNameJp}様、契約と文書、知的財産が堅固な防波堤となり資産を守る時期です。法人基盤と自動化システムを固めてください。`,
      };
    } else if (category === 'risk_defense') {
      categoryTitle = {
        kr: '비겁 대운 (리스크 방어·독립기)',
        jp: '比劫大運 (リスク防衛・独立期)',
      };
      coachingText = {
        kr: `${displayNameKr} 님, 자금 누수를 철저히 틀어막고 독자적인 주도권을 쥐어야 할 시기입니다. 무리한 보증이나 불투명한 동업은 피하십시오.`,
        jp: `${displayNameJp}様、資金流出を徹底的に防ぎ、独自の主導権を握るべき時期です。無理な投資や不透明な共同事業は控えてください。`,
      };
    }

    return {
      index: idx,
      ageStart,
      ageEnd,
      ganji: item.ganji,
      stemGod: item.stem,
      branchGod: item.branch,
      score: item.baseScore,
      isCurrent,
      category,
      categoryTitle,
      coachingText,
    };
  });

  // 만약 나이가 범위를 벗어나면 현재 나이와 가장 가까운 대운을 현재로 지정
  if (!hasCurrent && points.length > 0) {
    let closestIdx = 0;
    let minDiff = 999;
    points.forEach((p, i) => {
      const mid = (p.ageStart + p.ageEnd) / 2;
      const diff = Math.abs(mid - currentAge);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    points[closestIdx].isCurrent = true;
  }

  return points;
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

export const WealthFlowChart: React.FC<WealthFlowChartProps> = memo(function WealthFlowChart({
  userProfile,
  userName,
  lang = 'kr',
  onSelectPeriod,
}) {
  const isJa = lang === 'jp';

  // 10대~80대 8대 대운 데이터
  const points = useMemo(() => {
    return generateWealthPoints(userProfile, userName, isJa);
  }, [userProfile, userName, isJa]);

  // 기본 선택 인덱스: 현재 대운 (없으면 0)
  const defaultIdx = useMemo(() => {
    const currentIdx = points.findIndex((p) => p.isCurrent);
    return currentIdx !== -1 ? currentIdx : 0;
  }, [points]);

  const [selectedIdx, setSelectedIdx] = useState<number>(defaultIdx);
  const selectedPoint = points[selectedIdx] || points[0];

  const handleSelect = (idx: number) => {
    void playHaptic('tap');
    setSelectedIdx(idx);
    if (points[idx]) {
      onSelectPeriod?.(points[idx]);
    }
  };

  // Sparkline SVG 파라미터
  const svgWidth = 340;
  const svgHeight = 120;
  const padX = 22;
  const padY = 24;
  const stepX = (svgWidth - padX * 2) / Math.max(1, points.length - 1);

  const graphPts = useMemo(() => {
    return points.map((p, idx) => {
      const x = padX + idx * stepX;
      const y = svgHeight - padY - (p.score / 100) * (svgHeight - padY * 2);
      return {
        x,
        y,
        score: p.score,
        isCurrent: p.isCurrent,
        isSelected: idx === selectedIdx,
        ganji: p.ganji,
      };
    });
  }, [points, selectedIdx, stepX]);

  const curvePath = useMemo(() => createSmoothSvgPath(graphPts), [graphPts]);
  const areaPath = useMemo(() => {
    if (graphPts.length === 0) return '';
    const first = graphPts[0];
    const last = graphPts[graphPts.length - 1];
    return `${curvePath} L ${last.x.toFixed(1)} ${svgHeight - 4} L ${first.x.toFixed(1)} ${svgHeight - 4} Z`;
  }, [curvePath, graphPts]);

  return (
    <View style={styles.container}>
      {/* 1. 상단 타이틀 & 현재 대운 변곡점 요약 헤더 */}
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.headerIcon}>📈</Text>
          <Text style={styles.headerTitle}>
            {isJa ? '10年周期 富の変曲線 ＆ キャッシュフロー' : '10년 주기 재물선 & 현금 흐름 변곡점'}
          </Text>
        </View>
        <Text style={styles.headerSub}>
          {isJa
            ? '大運の十神と地支財庫から分析した年代別キャッシュフロー'
            : '대운 십신과 지지 금고로 분석한 10대~80대 자금 승부 지수'}
        </Text>
      </View>

      {/* 2. 10년 주기 인터랙티브 타임라인 슬라이더 카드 */}
      <View style={styles.sliderWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sliderContent}
        >
          {points.map((p, idx) => {
            const isSelected = idx === selectedIdx;
            const isCurrent = p.isCurrent;

            return (
              <Pressable
                key={`wealth-bar-${p.ganji}-${idx}`}
                onPress={() => handleSelect(idx)}
                style={({ pressed }) => [
                  styles.timelinePill,
                  isCurrent && styles.timelinePillCurrent,
                  isSelected && styles.timelinePillSelected,
                  pressed && styles.pressed,
                ]}
              >
                {/* [NOW / 現在] 네온 골드 배지 */}
                {isCurrent && (
                  <View style={styles.nowBadge}>
                    <Text style={styles.nowBadgeText}>
                      {isJa ? '現在' : 'NOW'}
                    </Text>
                  </View>
                )}

                {/* 나이 구간 */}
                <Text style={[styles.ageLabel, (isCurrent || isSelected) && styles.ageLabelActive]}>
                  {isJa ? `満${p.ageStart}~${p.ageEnd}歳` : `만 ${p.ageStart}~${p.ageEnd}세`}
                </Text>

                {/* 간지 */}
                <Text style={[styles.ganjiLabel, (isCurrent || isSelected) && styles.ganjiLabelActive]}>
                  {p.ganji}
                </Text>

                {/* 십신 */}
                <Text style={styles.godLabel} numberOfLines={1}>
                  {p.stemGod}·{p.branchGod}
                </Text>

                {/* 미니 점수 게이지 바 */}
                <View style={styles.miniBarContainer}>
                  <View
                    style={[
                      styles.miniBarFill,
                      {
                        height: `${Math.max(15, p.score)}%`,
                        backgroundColor: isCurrent ? '#FFB700' : isSelected ? '#FBBF24' : '#64748B',
                      },
                    ]}
                  />
                </View>

                {/* 점수 */}
                <Text style={[styles.scoreLabel, isCurrent && styles.scoreLabelGold]}>
                  {p.score}{isJa ? '点' : '점'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. 네온 SVG Sparkline 변곡선 그래프 */}
      <View style={[styles.chartGlassCard, LUXURY_GLASS]}>
        <View style={styles.chartHeaderRow}>
          <View style={styles.legendGroup}>
            <View style={[styles.legendDot, { backgroundColor: '#FFB700' }]} />
            <Text style={styles.legendLabel}>
              {isJa
                ? '資金流入期 (好機) ⬆ / 守成・資金防衛期 ⬇'
                : '자금 유입기(기회) ⬆ / 수성 및 누수 방어기 ⬇'}
            </Text>
          </View>
          <View style={styles.selectedPointTag}>
            <Text style={styles.selectedPointGanji}>{selectedPoint.ganji}</Text>
            <Text style={styles.selectedPointScore}>{selectedPoint.score}%</Text>
          </View>
        </View>

        <View style={styles.svgWrapper}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: svgHeight, overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="wealthFlowAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB700" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#FFB700" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#FFB700" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="wealthFlowLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#FFB700" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
            </defs>

            {/* 그리드 가이드라인 (30%, 70%) */}
            <line
              x1={padX}
              y1={svgHeight - padY - 0.7 * (svgHeight - padY * 2)}
              x2={svgWidth - padX}
              y2={svgHeight - padY - 0.7 * (svgHeight - padY * 2)}
              stroke="rgba(255, 183, 0, 0.18)"
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

            {/* 곡선 채우기 영역 */}
            {areaPath ? <path d={areaPath} fill="url(#wealthFlowAreaGrad)" /> : null}

            {/* 메인 네온 곡선 */}
            {curvePath ? (
              <path
                d={curvePath}
                fill="none"
                stroke="url(#wealthFlowLineGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            ) : null}

            {/* 인터랙티브 노드 포인트 */}
            {graphPts.map((pt, i) => {
              const isPtSelected = i === selectedIdx;
              const isPtCurrent = pt.isCurrent;

              return (
                <g key={`flow-pt-${i}`} style={{ cursor: 'pointer' }} onClick={() => handleSelect(i)}>
                  {/* 선택 또는 현재 노드 펄스 글로우 링 */}
                  {(isPtSelected || isPtCurrent) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isPtSelected ? 12 : 9}
                      fill={isPtCurrent ? 'rgba(255, 183, 0, 0.28)' : 'rgba(251, 191, 36, 0.2)'}
                    />
                  )}

                  {/* 노드 포인트 원 */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isPtSelected ? 5.8 : isPtCurrent ? 4.8 : 3.4}
                    fill={isPtSelected ? '#FFFFFF' : isPtCurrent ? '#FFB700' : '#64748B'}
                    stroke={isPtSelected ? '#FFB700' : isPtCurrent ? '#B45309' : '#0F172A'}
                    strokeWidth={isPtSelected ? '2.5' : '1.5'}
                  />

                  {/* 노드 상단 점수 */}
                  {isPtSelected && (
                    <text
                      x={pt.x}
                      y={Math.max(12, pt.y - 13)}
                      textAnchor="middle"
                      fill="#FFB700"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {pt.score}
                    </text>
                  )}

                  {/* 하단 간지 라벨 */}
                  <text
                    x={pt.x}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    fill={isPtSelected ? '#FFB700' : isPtCurrent ? '#FBBF24' : '#64748B'}
                    fontSize="9.5"
                    fontWeight={isPtSelected || isPtCurrent ? 'bold' : 'normal'}
                  >
                    {pt.ganji}
                  </text>
                </g>
              );
            })}
          </svg>
        </View>
      </View>

      {/* 4. 자금 유입기 vs 수성기 타이밍 코칭 브리핑 박스 */}
      <View style={[styles.coachingCard, LUXURY_GLASS]}>
        <View style={styles.coachingHeader}>
          <View style={styles.coachingTag}>
            <Text style={styles.coachingTagText}>
              {isJa ? selectedPoint.categoryTitle.jp : selectedPoint.categoryTitle.kr}
            </Text>
          </View>
          <View style={styles.coachingPeriodBadge}>
            <Text style={styles.coachingPeriodText}>
              {isJa
                ? `満${selectedPoint.ageStart}~${selectedPoint.ageEnd}歳 · ${selectedPoint.ganji}`
                : `만 ${selectedPoint.ageStart}~${selectedPoint.ageEnd}세 · ${selectedPoint.ganji}`}
            </Text>
          </View>
        </View>

        <View style={styles.coachingBody}>
          <Text style={[styles.coachingText, KEEP_ALL]}>
            {isJa ? selectedPoint.coachingText.jp : selectedPoint.coachingText.kr}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  headerBlock: {
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
    ...KEEP_ALL,
  },

  /* 10년 주기 가로 스크롤 타임라인 슬라이더 */
  sliderWrap: {
    marginVertical: 2,
  },
  sliderContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  timelinePill: {
    width: 90,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 12, 14, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelinePillCurrent: {
    borderColor: '#FFB700',
    borderWidth: 2,
    backgroundColor: 'rgba(69, 26, 3, 0.65)',
    ...(IS_WEB
      ? ({ boxShadow: '0 0 16px rgba(255, 183, 0, 0.45)' } as unknown as ViewStyle)
      : null),
  },
  timelinePillSelected: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(88, 28, 13, 0.75)',
  },
  nowBadge: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
    backgroundColor: '#FFB700',
    ...(IS_WEB
      ? ({ boxShadow: '0 0 8px rgba(255, 183, 0, 0.6)' } as unknown as ViewStyle)
      : null),
  },
  nowBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  ageLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  ageLabelActive: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  ganjiLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ganjiLabelActive: {
    color: '#FFB700',
  },
  godLabel: {
    color: '#CBD5E1',
    fontSize: 9.5,
    marginTop: 2,
  },
  miniBarContainer: {
    width: 24,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  miniBarFill: {
    width: '100%',
    borderRadius: 3,
  },
  scoreLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 4,
  },
  scoreLabelGold: {
    color: '#FFB700',
    fontWeight: '900',
  },

  /* 네온 Sparkline 차트 카드 */
  chartGlassCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(20, 10, 12, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 0, 0.22)',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '600',
  },
  selectedPointTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 183, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 0, 0.4)',
  },
  selectedPointGanji: {
    color: '#FFB700',
    fontSize: 11,
    fontWeight: '900',
  },
  selectedPointScore: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  svgWrapper: {
    width: '100%',
    marginTop: 4,
  },

  /* 타이밍 코칭 브리핑 카드 */
  coachingCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(28, 12, 14, 0.85)',
    borderLeftWidth: 3.5,
    borderLeftColor: '#FFB700',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  coachingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  coachingTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 183, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 0, 0.3)',
  },
  coachingTagText: {
    color: '#FFB700',
    fontSize: 11,
    fontWeight: '800',
  },
  coachingPeriodBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  coachingPeriodText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  coachingBody: {
    marginTop: 2,
  },
  coachingText: {
    color: '#F1F5F9',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
