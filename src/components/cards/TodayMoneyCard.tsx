import React, { memo, useMemo, useState, useRef } from 'react';
import {
  Modal,
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
import { analyzeTodayMoney } from '../../engine/moneyEngine';
import type { ReelsMoneyPeek } from '../../types/reels';
import type { SajuResult } from '../../engine/types';
import { useLocale } from '../../locales';

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

const GOLD_NEON_BAR = (
  IS_WEB
    ? {
        boxShadow: '0 0 14px rgba(255, 184, 0, 0.65)',
      }
    : null
) as unknown as ViewStyle | null;

const CRIMSON_NEON_BAR = (
  IS_WEB
    ? {
        boxShadow: '0 0 14px rgba(255, 30, 56, 0.65)',
      }
    : null
) as unknown as ViewStyle | null;

const CTA_NEON_SHADOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 24px rgba(255, 184, 0, 0.35)',
        transition: 'all 0.25s ease',
      }
    : null
) as unknown as ViewStyle | null;

export interface TodayMoneyCardProps {
  data?: ReelsMoneyPeek | null;
  active: boolean;
  height: number;
  saju?: SajuResult | null;
}

function formatDayLabel(date: Date, isJa: boolean = false): string {
  const week = (isJa ? ['日', '月', '火', '水', '木', '金', '土'] : ['일', '월', '화', '수', '목', '금', '토'])[date.getDay()] ?? '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${mm}.${dd} (${week})`;
}

export const TodayMoneyCard = memo(function TodayMoneyCard({
  data,
  active: _active,
  height,
  saju,
}: TodayMoneyCardProps) {
  const insets = useSafeAreaInsets();
  const { isJa, t } = useLocale();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const dateInputRef = useRef<any>(null);

  // 날짜 변경 시 해당 일자의 금전 기운 및 게이지 실시간 연산
  const rawMoney = useMemo(() => {
    return analyzeTodayMoney(saju ?? null, selectedDate);
  }, [saju, selectedDate]);

  const money = useMemo(() => {
    if (!isJa) return rawMoney;
    const jaPreset = t.section04.tenGods[rawMoney.godName as keyof typeof t.section04.tenGods];
    if (!jaPreset) return rawMoney;
    return {
      ...rawMoney,
      inflowLabel: jaPreset.inflowLabel,
      outflowLabel: jaPreset.outflowLabel,
      modeBadge: jaPreset.modeBadge as any,
      energyBadge: t.section04.auraBadge(jaPreset.godHanja, rawMoney.elementName),
      headline: jaPreset.headline,
      insight: jaPreset.baseInsight,
      actionDo: jaPreset.actionDo,
      actionDont: jaPreset.actionDont,
    };
  }, [rawMoney, isJa, t]);

  const handlePrevDay = () => {
    void playHaptic('tap');
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
  };

  const handleNextDay = () => {
    void playHaptic('tap');
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
  };

  const handleToday = () => {
    void playHaptic('tap');
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: any) => {
    const val = e?.target?.value;
    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      if (y && m && d) {
        setSelectedDate(new Date(y, m - 1, d, 12, 0));
      }
    }
  };

  // 모드별 테두리 및 뱃지 컬러 지정
  const modeColor = useMemo(() => {
    if (money.modeBadge.includes('흑자') || money.modeBadge.includes('공격')) {
      return {
        border: 'rgba(255, 184, 0, 0.45)',
        bg: 'rgba(255, 184, 0, 0.12)',
        text: '#FFB800',
        dot: '#FFB800',
      };
    }
    if (money.modeBadge.includes('봉인') || money.modeBadge.includes('방어')) {
      return {
        border: 'rgba(255, 30, 56, 0.45)',
        bg: 'rgba(255, 30, 56, 0.12)',
        text: '#FF4D6D',
        dot: '#FF1E38',
      };
    }
    return {
      border: 'rgba(245, 158, 11, 0.4)',
      bg: 'rgba(245, 158, 11, 0.1)',
      text: '#FBBF24',
      dot: '#FBBF24',
    };
  }, [money.modeBadge]);

  return (
    <View style={[styles.root, { height }]}>
      {/* 딥 다크 앰비언트 배경 (#0D0505 ~ #17090A) */}
      <LinearGradient
        colors={['#0D0505', '#17090A', '#0D0505']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* 배경 은은한 앰버/크림슨 네온 블러 글로우 */}
      <View pointerEvents="none" style={styles.ambientGlowAmber} />
      <View pointerEvents="none" style={styles.ambientGlowCrimson} />

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
        {/* 상단 섹션 칩 & 날짜 컨트롤러 */}
        <View style={styles.headerRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{t.section04.tab}</Text>
          </View>

          <View style={styles.dateControlBar}>
            <Pressable onPress={handlePrevDay} style={styles.dateNavBtn} accessibilityLabel={isJa ? '前日' : '이전 날'}>
              <Text style={styles.dateNavText}>◀</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void playHaptic('tap');
                if (IS_WEB && dateInputRef.current) {
                  try {
                    dateInputRef.current.showPicker?.() || dateInputRef.current.click?.();
                  } catch {
                    dateInputRef.current.click?.();
                  }
                }
              }}
              style={styles.dateCenterBtn}
              accessibilityLabel={isJa ? '日付変更' : '날짜 변경'}
            >
              <Text style={styles.dateCenterText}>📅 {formatDayLabel(selectedDate, isJa)}</Text>
              {IS_WEB && (
                <input
                  ref={dateInputRef}
                  type="date"
                  value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                  onChange={handleDateChange}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 1,
                    height: 1,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Pressable>

            <Pressable onPress={handleToday} style={styles.dateTodayBtn} accessibilityLabel={isJa ? '今日に戻る' : '오늘로 복귀'}>
              <Text style={styles.dateTodayText}>{isJa ? '今日' : '오늘'}</Text>
            </Pressable>

            <Pressable onPress={handleNextDay} style={styles.dateNavBtn} accessibilityLabel={isJa ? '翌日' : '다음 날'}>
              <Text style={styles.dateNavText}>▶</Text>
            </Pressable>
          </View>
        </View>

        {/* 메인 타이틀 & 서브 카피 */}
        <View style={styles.titleWrap}>
          <Text style={styles.mainTitle}>{t.section04.title}</Text>
          <Text style={styles.subTitle}>{t.section04.subtitle}</Text>
        </View>

        {/* 상단 명식 팩트 뱃지 & 동적 모드 태그 */}
        <View style={styles.badgeRow}>
          <View style={styles.energyBadge}>
            <Text style={styles.energyBadgeText}>⚡ {money.energyBadge}</Text>
          </View>
          <View
            style={[
              styles.modeBadge,
              {
                borderColor: modeColor.border,
                backgroundColor: modeColor.bg,
              },
            ]}
          >
            <View style={[styles.modeDot, { backgroundColor: modeColor.dot }]} />
            <Text style={[styles.modeBadgeText, { color: modeColor.text }]}>
              {money.modeBadge}
            </Text>
          </View>
        </View>

        {/* ======================================================== */}
        {/* [A] 시각적 듀얼 그래프 바 (Inflow vs Outflow) */}
        {/* ======================================================== */}
        <View style={[styles.dualGaugeCard, LUXURY_GLASS]}>
          {/* 1. 💰 유입 엔진 (벌리는 기운) */}
          <View style={styles.gaugeSection}>
            <View style={styles.gaugeHeader}>
              <View style={styles.gaugeLabelBox}>
                <Text style={styles.gaugeIcon}>💰</Text>
                <Text style={styles.gaugeTitle}>{isJa ? '流入エンジン' : '유입 엔진'}</Text>
                <Text style={styles.gaugeSubTitle}>{isJa ? '(稼ぐ力)' : '(벌리는 기운)'}</Text>
              </View>
              <View style={styles.gaugeScoreBox}>
                <Text style={styles.inflowScoreNumber}>{money.inflowPower}%</Text>
                <Text style={styles.inflowStatusLabel}>· {money.inflowLabel}</Text>
              </View>
            </View>

            {/* 게이지 트랙 */}
            <View style={styles.gaugeTrackOuter}>
              <View style={styles.trackTicks}>
                <View style={[styles.tickMark, { left: '25%' }]} />
                <View style={[styles.tickMark, { left: '50%' }]} />
                <View style={[styles.tickMark, { left: '75%' }]} />
              </View>
              <View
                style={[
                  styles.inflowGaugeFill,
                  { width: `${Math.min(100, Math.max(8, money.inflowPower))}%` },
                  GOLD_NEON_BAR,
                ]}
              >
                <LinearGradient
                  colors={['#FF8A00', '#FFB800', '#FFE600']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
          </View>

          <View style={styles.gaugeDivider} />

          {/* 2. 🛡️ 누수 경보 (새는 구멍) */}
          <View style={styles.gaugeSection}>
            <View style={styles.gaugeHeader}>
              <View style={styles.gaugeLabelBox}>
                <Text style={styles.gaugeIcon}>🛡️</Text>
                <Text style={styles.gaugeTitle}>{isJa ? '漏水警報' : '누수 경보'}</Text>
                <Text style={styles.gaugeSubTitle}>{isJa ? '(漏れる穴)' : '(새는 구멍)'}</Text>
              </View>
              <View style={styles.gaugeScoreBox}>
                <Text style={styles.outflowScoreNumber}>{money.outflowRisk}%</Text>
                <Text style={styles.outflowStatusLabel}>· {money.outflowLabel}</Text>
              </View>
            </View>

            {/* 게이지 트랙 */}
            <View style={styles.gaugeTrackOuter}>
              <View style={styles.trackTicks}>
                <View style={[styles.tickMark, { left: '25%' }]} />
                <View style={[styles.tickMark, { left: '50%' }]} />
                <View style={[styles.tickMark, { left: '75%' }]} />
              </View>
              <View
                style={[
                  styles.outflowGaugeFill,
                  { width: `${Math.min(100, Math.max(8, money.outflowRisk))}%` },
                  CRIMSON_NEON_BAR,
                ]}
              >
                <LinearGradient
                  colors={['#FF4D6D', '#FF1E38', '#E60026']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* [B] 사주 명식에 근거한 날카로운 '실전 금전 한마디' */}
        {/* ======================================================== */}
        <View style={[styles.insightCard, LUXURY_GLASS]}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightKicker}>{t.section04.insightTitle}</Text>
            <Text style={styles.insightHeadline}>{money.headline}</Text>
          </View>

          <View style={styles.insightQuoteBox}>
            <Text style={styles.insightBodyText}>{money.insight}</Text>
          </View>

          {/* 실전 행동 지침 (Do / Don't) */}
          <View style={styles.actionGrid}>
            <View style={styles.actionDoBox}>
              <View style={styles.actionHeaderRow}>
                <Text style={styles.actionDoBadge}>✅ {t.section04.doTitle}</Text>
              </View>
              <Text style={styles.actionDoText}>{money.actionDo}</Text>
            </View>

            <View style={styles.actionDontBox}>
              <View style={styles.actionHeaderRow}>
                <Text style={styles.actionDontBadge}>❌ {t.section04.dontTitle}</Text>
              </View>
              <Text style={styles.actionDontText}>{money.actionDont}</Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* [C] 하단 CTA 버튼: 돈 버는 엔진 심층 분석 보기 */}
        {/* ======================================================== */}
        <Pressable
          onPress={() => {
            void playHaptic('tap');
            setDetailModalOpen(true);
          }}
          style={({ pressed }) => [
            styles.ctaButton,
            CTA_NEON_SHADOW,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={['#FFB800', '#E59800', '#FF1E38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.ctaButtonText}>{t.section04.deepBtn}</Text>
        </Pressable>
      </ScrollView>

      {/* ======================================================== */}
      {/* 심층 분석 모달 */}
      {/* ======================================================== */}
      <Modal
        visible={detailModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setDetailModalOpen(false)} />
          <View style={[styles.modalCard, LUXURY_GLASS]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalKicker}>{t.section04.modal.kicker}</Text>
                <Text style={styles.modalTitle}>{t.section04.modal.title}</Text>
              </View>
              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  setDetailModalOpen(false);
                }}
                style={styles.modalCloseBtn}
                accessibilityLabel={t.section04.modal.close}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              {/* 명식 기운 요약 카드 */}
              <View style={styles.modalBadgeBox}>
                <Text style={styles.modalEnergyBadge}>{money.energyBadge}</Text>
                <Text style={styles.modalHeadline}>{money.headline}</Text>
              </View>

              {/* 1. 유입 기운 세부 분석 */}
              <View style={styles.modalSectionBox}>
                <Text style={styles.modalSectionTitle}>
                  {isJa ? `💰 流入気運の解読 (${money.inflowPower}%)` : `💰 유입 기운 해단 (${money.inflowPower}%)`}
                </Text>
                <Text style={styles.modalSectionBody}>
                  {isJa
                    ? `本日の日辰は${money.godHanja}の気運が支配します。${money.inflowLabel}が強く働き、${
                        money.inflowPower >= 70
                          ? '交渉で主導権を握るか新規契約を打診する絶好の好機です。躊躇せず積極的に機会を掴み取ってください。'
                          : '無理に大金を追うよりも、すでに確立された売上基盤と既存の取引先を点検し、堅実に足元を固めるべき刻です。'
                      }`
                    : `오늘 일진은 ${money.godName}(${money.godHanja})의 기운이 지배합니다. ${money.inflowLabel}이 강하게 작동하여 ${
                        money.inflowPower >= 70
                          ? '협상에서 주도권을 잡거나 신규 계약을 타진하기에 최적의 시기입니다. 망설이지 말고 적극적으로 기회를 요구하십시오.'
                          : '새로운 큰돈을 무리하게 노리기보다는 이미 형성된 매출 기반과 기존 거래처를 점검하며 안정을 도모해야 합니다.'
                      }`}
                </Text>
              </View>

              {/* 2. 누수 방어선 심층 진단 */}
              <View style={styles.modalSectionBoxCrimson}>
                <Text style={styles.modalSectionTitleCrimson}>
                  {isJa ? `🛡️ 漏洩防衛線警報 (${money.outflowRisk}%)` : `🛡️ 누수 방어선 경보 (${money.outflowRisk}%)`}
                </Text>
                <Text style={styles.modalSectionBody}>
                  {isJa
                    ? `${money.outflowLabel}が発動している状態です。${
                        money.outflowRisk >= 60
                          ? '見栄や感情、あるいは焦りから突発的な浪費が発生する危険性が極めて高い。決済画面が開いた際は、必ず30分以上間を置いて再検討してください。'
                          : '全般的な資金防衛線は堅牢ですが、契約書の細かな特約条項や自動更新課金など、些細な隙間を今一度点検するのが賢明です。'
                      }`
                    : `${money.outflowLabel}이 발동되어 있는 상태입니다. ${
                        money.outflowRisk >= 60
                          ? '체면이나 감정, 또는 조급함으로 인해 즉흥적인 지출이 발생할 확률이 매우 높습니다. 오늘 결제창이 열릴 때는 반드시 30분 이상 시간을 두고 재검토하십시오.'
                          : '전반적인 재정 방어선이 탄탄하나, 계약서의 작은 특약 사항이나 자동 갱신 결제 같은 사소한 틈새를 한 번 더 짚어보는 것이 안전합니다.'
                      }`}
                </Text>
              </View>

              {/* 3. 오늘의 3단계 금전 골든타임 */}
              <View style={styles.modalSectionBox}>
                <Text style={styles.modalSectionTitle}>
                  {isJa ? '⏰ 時間帯別・資金行動の秘策' : '⏰ 시간대별 금전 행동 비책'}
                </Text>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineHour}>{isJa ? '[午前 09~12時]' : '[오전 09~12시]'}</Text>
                  <Text style={styles.timelineDesc}>
                    {isJa
                      ? '書類点検・支出計画の精査。決裁の即時承認は保留。'
                      : '문서 정비 & 지출 계획 검토. 결재창 즉시 승인 보류.'}
                  </Text>
                </View>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineHour}>{isJa ? '[午後 13~17時]' : '[오후 13~17시]'}</Text>
                  <Text style={styles.timelineDesc}>
                    {isJa
                      ? '交渉および単価の確定に集中。明確な数字のみで語れ。'
                      : '협상 및 단가 확정 집중. 명확한 숫자로만 대화할 것.'}
                  </Text>
                </View>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineHour}>{isJa ? '[夜 18~22時]' : '[저녁 18~22시]'}</Text>
                  <Text style={styles.timelineDesc}>
                    {isJa
                      ? '財布を封印し口座残高を確認。酒席での気前の良さは厳禁。'
                      : '지갑 봉인 & 계좌 잔고 확인. 술자리 호기 결제 절대 차단.'}
                  </Text>
                </View>
              </View>

              {/* Do / Don't 재강조 */}
              <View style={styles.modalDoDontBox}>
                <Text style={styles.modalDoText}>✅ DO: {money.actionDo}</Text>
                <Text style={styles.modalDontText}>❌ DON&apos;T: {money.actionDont}</Text>
              </View>

              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  setDetailModalOpen(false);
                }}
                style={styles.modalConfirmBtn}
              >
                <Text style={styles.modalConfirmText}>
                  {isJa ? '秘策を確認し財布を守る' : '비책 확인 및 지갑 수성하기'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0D0505',
  },
  scrollBody: {
    paddingHorizontal: 16,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  ambientGlowAmber: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    ...(IS_WEB ? ({ filter: 'blur(60px)' } as unknown as ViewStyle) : null),
  },
  ambientGlowCrimson: {
    position: 'absolute',
    top: 140,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 30, 56, 0.12)',
    ...(IS_WEB ? ({ filter: 'blur(60px)' } as unknown as ViewStyle) : null),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
  },
  chipText: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 12, 14, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.25)',
  },
  dateNavBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  dateNavText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: '800',
  },
  dateCenterBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'relative',
  },
  dateCenterText: {
    color: '#F4F7FB',
    fontSize: 11,
    fontWeight: '800',
  },
  dateTodayBtn: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 2,
  },
  dateTodayText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: '800',
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
    color: '#BFA8A8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
    ...KEEP_ALL,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  energyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  energyBadgeText: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  /* 듀얼 게이지 카드 */
  dualGaugeCard: {
    backgroundColor: 'rgba(24, 10, 12, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.22)',
    padding: 14,
    marginBottom: 12,
  },
  gaugeSection: {
    paddingVertical: 4,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gaugeLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gaugeIcon: {
    fontSize: 14,
  },
  gaugeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  gaugeSubTitle: {
    color: '#998084',
    fontSize: 11,
    fontWeight: '600',
  },
  gaugeScoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  inflowScoreNumber: {
    color: '#FFB800',
    fontSize: 17,
    fontWeight: '900',
  },
  inflowStatusLabel: {
    color: '#FFC83B',
    fontSize: 11,
    fontWeight: '700',
  },
  outflowScoreNumber: {
    color: '#FF1E38',
    fontSize: 17,
    fontWeight: '900',
  },
  outflowStatusLabel: {
    color: '#FF6B7F',
    fontSize: 11,
    fontWeight: '700',
  },
  gaugeTrackOuter: {
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 3, 4, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  trackTicks: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    pointerEvents: 'none',
  },
  tickMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  inflowGaugeFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  outflowGaugeFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  gaugeDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },

  /* 핵심 통찰 카드 */
  insightCard: {
    backgroundColor: 'rgba(22, 9, 11, 0.82)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 56, 0.22)',
    padding: 14,
    marginBottom: 14,
  },
  insightHeader: {
    marginBottom: 8,
  },
  insightKicker: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  insightHeadline: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    ...KEEP_ALL,
  },
  insightQuoteBox: {
    backgroundColor: 'rgba(12, 3, 5, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.18)',
    padding: 12,
    marginBottom: 10,
  },
  insightBodyText: {
    color: '#EDE2E4',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
    ...KEEP_ALL,
  },

  /* Do / Don't 그리드 */
  actionGrid: {
    gap: 8,
  },
  actionDoBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 10,
  },
  actionHeaderRow: {
    marginBottom: 4,
  },
  actionDoBadge: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '900',
  },
  actionDoText: {
    color: '#A7F3D0',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    ...KEEP_ALL,
  },
  actionDontBox: {
    backgroundColor: 'rgba(255, 30, 56, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 56, 0.3)',
    padding: 10,
  },
  actionDontBadge: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '900',
  },
  actionDontText: {
    color: '#FECDD3',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    ...KEEP_ALL,
  },

  /* 하단 CTA 버튼 */
  ctaButton: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#0A0202',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  /* 모달 */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalBackdropPress: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    maxHeight: '85%',
    backgroundColor: '#120507',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    padding: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalKicker: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    color: '#BFA8A8',
    fontSize: 16,
    fontWeight: '800',
  },
  modalScrollBody: {
    gap: 14,
  },
  modalBadgeBox: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.28)',
    padding: 12,
  },
  modalEnergyBadge: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalHeadline: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    ...KEEP_ALL,
  },
  modalSectionBox: {
    backgroundColor: 'rgba(28, 12, 14, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    padding: 12,
  },
  modalSectionBoxCrimson: {
    backgroundColor: 'rgba(28, 8, 12, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 56, 0.25)',
    padding: 12,
  },
  modalSectionTitle: {
    color: '#FFB800',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  modalSectionTitleCrimson: {
    color: '#FF4D6D',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  modalSectionBody: {
    color: '#DDD0D2',
    fontSize: 12,
    lineHeight: 18,
    ...KEEP_ALL,
  },
  timelineRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
    alignItems: 'baseline',
  },
  timelineHour: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
    width: 90,
  },
  timelineDesc: {
    flex: 1,
    color: '#DDD0D2',
    fontSize: 11.5,
    lineHeight: 16,
    ...KEEP_ALL,
  },
  modalDoDontBox: {
    backgroundColor: 'rgba(10, 2, 4, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    gap: 6,
  },
  modalDoText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    ...KEEP_ALL,
  },
  modalDontText: {
    color: '#FF4D6D',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    ...KEEP_ALL,
  },
  modalConfirmBtn: {
    marginTop: 6,
    backgroundColor: '#FFB800',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#0D0505',
    fontSize: 14,
    fontWeight: '900',
  },
});
