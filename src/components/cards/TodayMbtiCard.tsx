import React, { memo, useMemo } from 'react';
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
import type { ReelsMbtiPeek } from '../../types/reels';
import type { SajuResult } from '../../engine/types';
import { calculateSajuMbti } from '../../engine/mbtiEngine';

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

const CYAN_NEON_GLOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 16px rgba(0, 245, 212, 0.4)',
      }
    : null
) as unknown as ViewStyle | null;

const CRIMSON_NEON_GLOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 16px rgba(255, 42, 75, 0.4)',
      }
    : null
) as unknown as ViewStyle | null;

const CTA_NEON_SHADOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 24px rgba(0, 245, 212, 0.35)',
        transition: 'all 0.25s ease',
      }
    : null
) as unknown as ViewStyle | null;

export interface TodayMbtiCardProps {
  data?: ReelsMbtiPeek | null;
  active: boolean;
  height: number;
  saju?: SajuResult | null;
  onOpenMbti?: () => void;
}

// 16개 MBTI별 선천 기질(사주 코어) 설명
const INNATE_DESCRIPTIONS: Record<string, { summary: string; element: string }> = {
  ENFJ: {
    summary: '사람을 이끌고 열정을 불태울 때 살아나는 카리스마 리더의 기질입니다.',
    element: '火木 기운의 온기와 돌파력',
  },
  INFJ: {
    summary: '깊은 통찰력과 이상을 품고 조용히 세상을 변화시키는 예언자의 기질입니다.',
    element: '水木 기운의 통찰과 지혜',
  },
  ENFP: {
    summary: '자유로운 상상력과 넘치는 영감으로 새로운 가능성을 탐색하는 열정가입니다.',
    element: '木火 기운의 생기와 영감',
  },
  INFP: {
    summary: '내면의 신념과 깊은 감수성을 소중히 지키는 따뜻한 이상주의자입니다.',
    element: '水火 기운의 감성과 공감',
  },
  ENTJ: {
    summary: '명확한 비전과 강력한 결단력으로 목표를 정복하는 타고난 사령관입니다.',
    element: '金木 기운의 결단과 통솔',
  },
  INTJ: {
    summary: '치밀한 전략과 냉철한 통찰로 거대한 시스템을 설계하는 지략가입니다.',
    element: '金水 기운의 냉철한 설계',
  },
  ENTP: {
    summary: '기존의 틀을 깨부수고 지적 호기심으로 논쟁을 즐기는 발명가 기질입니다.',
    element: '火金 기운의 위트와 혁신',
  },
  INTP: {
    summary: '원리와 진리를 탐구하며 독창적인 사유를 펼치는 철학자·사색가입니다.',
    element: '水金 기운의 깊은 사유',
  },
  ESFJ: {
    summary: '주변 사람들을 살뜰히 챙기고 조화로운 분위기를 만드는 친화적 서포터입니다.',
    element: '土火 기운의 포용과 친화',
  },
  ISFJ: {
    summary: '묵묵한 책임감과 헌신으로 소중한 사람들을 지키는 든든한 수호자입니다.',
    element: '土金 기운의 묵직한 신뢰',
  },
  ESTJ: {
    summary: '철저한 규율과 현실적 실행력으로 조직을 이끄는 현실 경영자입니다.',
    element: '金土 기운의 질서와 규율',
  },
  ISTJ: {
    summary: '한 치의 오차도 없는 원칙과 신뢰로 임무를 완수하는 성실한 파수꾼입니다.',
    element: '土金 기운의 원칙과 성실',
  },
  ESFP: {
    summary: '순간의 즐거움과 생동감 넘치는 매력으로 분위기를 띄우는 엔터테이너입니다.',
    element: '火土 기운의 활력과 사교',
  },
  ISFP: {
    summary: '따뜻한 감성과 예술적 안목으로 삶을 온화하게 관조하는 예술가입니다.',
    element: '木土 기운의 온화한 미학',
  },
  ESTP: {
    summary: '망설임 없는 행동력과 직관적 감각으로 위기를 돌파하는 승부사입니다.',
    element: '金火 기운의 순발력과 돌파',
  },
  ISTP: {
    summary: '냉철한 관찰력과 정밀한 손기술로 문제를 즉각 해결하는 장인 기질입니다.',
    element: '金水 기운의 실용과 분석',
  },
};

// 16개 MBTI별 현실 가면(사회생활 페르소나) 설명
const ACTUAL_DESCRIPTIONS: Record<string, { summary: string; mask: string }> = {
  ENFJ: {
    summary: '사회에서 모두를 포용하고 솔선수범해야 한다는 무거운 리더의 가면입니다.',
    mask: '외향적 책임감의 가면',
  },
  INFJ: {
    summary: '하지만 현실에서는 갈등을 피하고 홀로 삭이고 참아내는 가면을 쓰고 있습니다.',
    mask: '조용한 침묵과 인내의 가면',
  },
  ENFP: {
    summary: '어떤 상황에서도 늘 밝고 쾌활해야 한다는 긍정 강박의 가면입니다.',
    mask: '발랄한 에너지의 가면',
  },
  INFP: {
    summary: '상처받지 않기 위해 자신의 감정을 숨기고 조용히 관망하는 가면입니다.',
    mask: '방어적 침묵의 가면',
  },
  ENTJ: {
    summary: '빈틈이나 약점을 보이지 않고 완벽히 통제해야 한다는 엄격한 가면입니다.',
    mask: '냉철한 통제의 가면',
  },
  INTJ: {
    summary: '감정을 철저히 배제하고 완벽한 논리로만 무장해야 한다는 가면입니다.',
    mask: '무표정한 철벽의 가면',
  },
  ENTP: {
    summary: '진지함을 숨기고 유쾌한 농담과 재치 있는 언변 뒤에 숨는 가면입니다.',
    mask: '유쾌한 재담꾼의 가면',
  },
  INTP: {
    summary: '불필요한 감정 교류를 피하고 차분한 관찰자로 남으려는 거리두기 가면입니다.',
    mask: '합리적 무관심의 가면',
  },
  ESFJ: {
    summary: '모든 사람에게 좋은 사람이어야 한다는 배려와 미소의 사회적 가면입니다.',
    mask: '친절한 미소의 가면',
  },
  ISFJ: {
    summary: '거절하지 못하고 묵묵히 궂은일을 떠맡는 희생과 배려의 가면입니다.',
    mask: '묵묵한 수용의 가면',
  },
  ESTJ: {
    summary: '감정에 휘둘리지 않고 엄격한 기준을 적용해야 한다는 관리자의 가면입니다.',
    mask: '철저한 규율의 가면',
  },
  ISTJ: {
    summary: '실수하지 않기 위해 규칙과 매뉴얼 뒤에 철저히 숨는 신중함의 가면입니다.',
    mask: '신중한 파수꾼의 가면',
  },
  ESFP: {
    summary: '우울함을 드러내지 않고 항상 분위기를 띄워야 한다는 광대의 가면입니다.',
    mask: '흥겨운 분위기메이커의 가면',
  },
  ISFP: {
    summary: '마찰을 일으키지 않기 위해 상대에게 무조건 맞춰주는 순응의 가면입니다.',
    mask: '조용한 양보의 가면',
  },
  ESTP: {
    summary: '두려움을 숨기고 언제나 자신만만한 척 돌진하는 전사의 가면입니다.',
    mask: '자신만만한 승부사의 가면',
  },
  ISTP: {
    summary: '타인과의 깊은 관계를 피하고 쿨한 척 선을 긋는 독립의 가면입니다.',
    mask: '쿨한 독립성의 가면',
  },
};

export const TodayMbtiCard = memo(function TodayMbtiCard({
  data,
  active: _active,
  height,
  saju,
  onOpenMbti,
}: TodayMbtiCardProps) {
  const insets = useSafeAreaInsets();

  // 선천 MBTI 산출 (데이터 우선, 없을 시 사주에서 직접 계산)
  const innateMbti = useMemo(() => {
    if (data?.innate) return data.innate;
    if (saju) {
      const summary = calculateSajuMbti(saju);
      if (summary.mbti) return summary.mbti;
    }
    return 'ENFJ';
  }, [data, saju]);

  // 현실 가면 MBTI
  const actualMbti = data?.actual ?? null;

  // 일치율 및 누수율
  const syncRate = data?.syncRate ?? (actualMbti ? 75 : 100);
  const leakage = data?.leakage ?? (actualMbti ? 25 : 0);

  // 선천 정보
  const innateInfo = INNATE_DESCRIPTIONS[innateMbti] ?? {
    summary: '사주 원국의 오행 밸런스에 기반한 타고난 본연의 기질입니다.',
    element: '사주 원국 오행 본성',
  };

  // 가면 정보
  const actualInfo = actualMbti
    ? ACTUAL_DESCRIPTIONS[actualMbti] ?? {
        summary: '사회생활을 위해 의식적으로 연기하는 성향입니다.',
        mask: '사회적 페르소나',
      }
    : {
        summary: '아직 사회생활용 가면을 설정하지 않았습니다. 하단 버튼을 눌러 가면을 지정해 보세요.',
        mask: '현실 가면 미설정',
      };

  // 누수율에 따른 동적 진단 처방
  const prescription = useMemo(() => {
    if (!actualMbti) {
      return '현실에서 주로 연기하는 가면을 고르면, 사주 코어와의 간극과 일일 에너지 방전율을 즉시 분석해 드립니다.';
    }
    if (leakage === 0) {
      return '본성과 가면이 완벽히 일치하여 내면의 갈등 없이 기운이 자연스럽게 흐르는 최적의 조화 상태입니다.';
    }
    if (leakage <= 25) {
      return `본성과 다른 ${actualMbti} 가면을 유지하느라 매일 ${leakage}%의 기력이 소모되고 있습니다. 혼자만의 온전한 휴식으로 에너지를 충전하세요.`;
    }
    if (leakage <= 50) {
      return `사회생활에서 절반의 에너지를 가면 유지에 소모하고 있습니다. 퇴근 후에는 본래의 본성(${innateMbti})을 마음껏 발산하는 취미를 권장합니다.`;
    }
    return `타고난 본성(${innateMbti})을 억누른 채 정반대의 가면(${actualMbti})을 쓰느라 심한 번아웃과 에너지 방전 위험이 높습니다. 본래의 기질을 인정해 주세요.`;
  }, [actualMbti, leakage, innateMbti]);

  return (
    <View style={[styles.root, { height }]}>
      {/* 딥 다크 배경 (#070B14 ~ #0E1626) */}
      <LinearGradient
        colors={['#070B14', '#0E1626', '#070B14']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* 배경 네온 글로우 */}
      <View pointerEvents="none" style={styles.ambientGlowCyan} />
      <View pointerEvents="none" style={styles.ambientGlowViolet} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 68,
          },
        ]}
      >
        {/* 상단 칩 */}
        <View style={styles.headerRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>06 · 가면과 본성</Text>
          </View>
        </View>

        {/* 1. 메인 타이틀 & 서브타이틀 */}
        <View style={styles.titleWrap}>
          <Text style={styles.mainTitle}>선천 사주 코어 vs 현실 가면</Text>
          <Text style={styles.subTitle}>
            동양의 사주 오행과 서양의 MBTI로 풀어내는 나의 에너지 누수 리포트
          </Text>
        </View>

        {/* 2. 상단 인포메이션 박스 (온보딩 안내 카드) */}
        <View style={[styles.infoBox, LUXURY_GLASS]}>
          <View style={styles.infoHeaderRow}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoTitle}>왜 사주와 MBTI를 비교하나요?</Text>
          </View>
          <Text style={styles.infoBody}>
            사주팔자의 오행(목화토금수)으로 산출된{' '}
            <Text style={styles.infoHighlightCyan}>[타고난 선천 기질]</Text>과, 사회생활을
            버텨내기 위해 내가 쓰고 있는{' '}
            <Text style={styles.infoHighlightCrimson}>[현실 가면(MBTI)]</Text>이 다를수록
            정신적 피로와 에너지 방전(누수)이 심해집니다.
          </Text>
        </View>

        {/* 3. 좌우 대비(Side-by-Side) 비주얼 카드 */}
        <View style={styles.comparisonGrid}>
          {/* [좌측 카드: 🔮 사주 선천 코어] */}
          <View style={[styles.compareCard, styles.compareCardInnate, CYAN_NEON_GLOW]}>
            <View style={styles.cardBadgeCyan}>
              <Text style={styles.cardBadgeCyanText}>🔮 사주 원국 기반 본성</Text>
            </View>
            <Text style={styles.mbtiTypeCyan}>{innateMbti}</Text>
            <Text style={styles.mbtiSubLabelCyan}>{innateInfo.element}</Text>
            <View style={styles.cardDivider} />
            <Text style={styles.mbtiBodyText}>{innateInfo.summary}</Text>
          </View>

          {/* [우측 카드: 🎭 현실 페르소나] */}
          <View style={[styles.compareCard, styles.compareCardActual, CRIMSON_NEON_GLOW]}>
            <View style={styles.cardBadgeCrimson}>
              <Text style={styles.cardBadgeCrimsonText}>🎭 사회생활용 가면</Text>
            </View>
            <Text style={[styles.mbtiTypeCrimson, !actualMbti && styles.mbtiTypeEmpty]}>
              {actualMbti || '미설정'}
            </Text>
            <Text style={styles.mbtiSubLabelCrimson}>{actualInfo.mask}</Text>
            <View style={styles.cardDivider} />
            <Text style={styles.mbtiBodyText}>{actualInfo.summary}</Text>
          </View>
        </View>

        {/* 4. 하단 게이지 & 에너지 누수 분석 카드 */}
        <View style={[styles.analysisCard, LUXURY_GLASS]}>
          {/* 수치 헤더 */}
          <View style={styles.analysisHeader}>
            <View style={styles.rateBox}>
              <Text style={styles.rateLabel}>동조 일치율</Text>
              <Text style={styles.syncRateText}>{syncRate}%</Text>
            </View>
            <View style={styles.leakageBadge}>
              <Text style={styles.leakageBadgeText}>⚡ 에너지 누수율: {leakage}%</Text>
            </View>
          </View>

          {/* 듀얼 네온 게이지 바 */}
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFillCyan,
                { width: `${syncRate}%` },
              ]}
            />
            {leakage > 0 && (
              <View
                style={[
                  styles.gaugeFillCrimson,
                  { width: `${leakage}%` },
                ]}
              />
            )}
          </View>

          {/* 진단 처방 */}
          <View style={styles.prescriptionBox}>
            <Text style={styles.prescriptionKicker}>진단 처방</Text>
            <Text style={styles.prescriptionText}>{prescription}</Text>
          </View>
        </View>

        {/* 5. 하단 CTA 버튼: 🎭 내 현실 MBTI(사회생활 가면) 변경하기 */}
        <Pressable
          onPress={() => {
            void playHaptic('tap');
            onOpenMbti?.();
          }}
          style={({ pressed }) => [
            styles.ctaButton,
            CTA_NEON_SHADOW,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={['#00F5D4', '#00B4D8', '#7B2CBF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.ctaButtonText}>
            {actualMbti
              ? '🎭 내 현실 MBTI(사회생활 가면) 변경하기 ➔'
              : '🎭 내 현실 MBTI(사회생활 가면) 설정하기 ➔'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#070B14',
  },
  scrollBody: {
    paddingHorizontal: 16,
  },
  ambientGlowCyan: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    ...(IS_WEB ? ({ filter: 'blur(50px)' } as unknown as ViewStyle) : null),
  },
  ambientGlowViolet: {
    position: 'absolute',
    top: 200,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(123, 44, 191, 0.12)',
    ...(IS_WEB ? ({ filter: 'blur(50px)' } as unknown as ViewStyle) : null),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.35)',
  },
  chipText: {
    color: '#00F5D4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleWrap: {
    marginBottom: 10,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 25,
    letterSpacing: -0.3,
    ...KEEP_ALL,
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16.5,
    ...KEEP_ALL,
  },

  /* 💡 상단 인포메이션 박스 */
  infoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.22)',
    padding: 12,
    marginBottom: 12,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoTitle: {
    color: '#00F5D4',
    fontSize: 12.5,
    fontWeight: '800',
  },
  infoBody: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 17,
    ...KEEP_ALL,
  },
  infoHighlightCyan: {
    color: '#00F5D4',
    fontWeight: '800',
  },
  infoHighlightCrimson: {
    color: '#FF4D6D',
    fontWeight: '800',
  },

  /* 좌우 대비 카드 그리드 */
  comparisonGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  compareCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(13, 19, 33, 0.85)',
    borderWidth: 1,
    minHeight: 175,
  },
  compareCardInnate: {
    borderColor: 'rgba(0, 245, 212, 0.35)',
  },
  compareCardActual: {
    borderColor: 'rgba(255, 42, 75, 0.35)',
  },
  cardBadgeCyan: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  cardBadgeCyanText: {
    color: '#00F5D4',
    fontSize: 9.5,
    fontWeight: '800',
  },
  cardBadgeCrimson: {
    backgroundColor: 'rgba(255, 42, 75, 0.12)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  cardBadgeCrimsonText: {
    color: '#FF4D6D',
    fontSize: 9.5,
    fontWeight: '800',
  },
  mbtiTypeCyan: {
    color: '#00F5D4',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mbtiSubLabelCyan: {
    color: '#7DD3FC',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  mbtiTypeCrimson: {
    color: '#FF4D6D',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mbtiTypeEmpty: {
    fontSize: 16,
    color: '#94A3B8',
  },
  mbtiSubLabelCrimson: {
    color: '#FDA4AF',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },
  mbtiBodyText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
    ...KEEP_ALL,
  },

  /* 하단 에너지 누수 분석 카드 */
  analysisCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.22)',
    padding: 13,
    marginBottom: 14,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rateLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  syncRateText: {
    color: '#00F5D4',
    fontSize: 18,
    fontWeight: '900',
  },
  leakageBadge: {
    backgroundColor: 'rgba(255, 42, 75, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  leakageBadgeText: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '800',
  },
  gaugeTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 10,
  },
  gaugeFillCyan: {
    height: '100%',
    backgroundColor: '#00F5D4',
    borderRadius: 999,
  },
  gaugeFillCrimson: {
    height: '100%',
    backgroundColor: '#FF2A4B',
    borderRadius: 999,
  },
  prescriptionBox: {
    backgroundColor: 'rgba(8, 14, 28, 0.75)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
  },
  prescriptionKicker: {
    color: '#00F5D4',
    fontSize: 10.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  prescriptionText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    lineHeight: 17,
    ...KEEP_ALL,
  },

  /* CTA 버튼 */
  ctaButton: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#070B14',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
