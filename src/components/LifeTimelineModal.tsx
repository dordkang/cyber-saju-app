import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import {
  calculateLifeDaeun,
  calculateRemainingMonthsFortune,
  calculateYearFortune,
  DEFAULT_INTERESTS,
  DEFAULT_LIFE_SYNC_RATIO,
  DEFAULT_TARGET_YEAR,
  DaeunPeriod,
  Grade,
  INTEREST_KEYS,
  INTEREST_LABEL,
  InterestKey,
  MonthFortune,
  normalizeInterests,
  queryTimeSliderFortune,
  RiskLevel,
  TimelineCalendarType,
  TimelineGender,
  TimelineOptions,
  TimeSliderFortune,
  TimeSliderMode,
  YearFortuneResult,
} from '../engine/timelineEngine';
import { updateUserOnboardingData } from '../database/db';

const COLOR = {
  bg: '#090D16',
  panel: '#0B1220',
  card: '#131B2E',
  border: '#1F293D',
  cyan: '#00F0FF',
  purple: '#BD93F9',
  yellow: '#F1FA8C',
  red: '#FF5555',
  green: '#50FA7B',
  text: '#E2E8F0',
  muted: '#8B9BB4',
  dim: '#55657E',
} as const;

const INTEREST_EMOJI: Record<InterestKey, string> = {
  wealth: '💰',
  business: '⚔️',
  love: '💔',
  children: '👶',
  health: '🩹',
};

const RISK_META: Record<RiskLevel, { label: string; color: string }> = {
  safe: { label: '안전', color: COLOR.cyan },
  caution: { label: '주의', color: COLOR.yellow },
  danger: { label: '위험', color: COLOR.red },
};

const GRADE_COLOR: Record<Grade, string> = {
  대길: COLOR.cyan,
  길: COLOR.green,
  평: COLOR.purple,
  흉: COLOR.yellow,
  대흉: COLOR.red,
};

const SLIDER_THUMB = 26;
const SLIDER_STEP = 5;

const TM_YEAR_MIN = 2025;
const TM_YEAR_MAX = 2035;
const TM_MODE_LABEL: Record<'year' | 'month', string> = {
  year: `연도별 시간여행 (${TM_YEAR_MIN}~${TM_YEAR_MAX})`,
  month: '월별 시간여행 (1~12월)',
};
const TM_YEAR_TICKS: readonly SliderTick[] = Array.from(
  { length: TM_YEAR_MAX - TM_YEAR_MIN + 1 },
  (_, i) => ({ value: TM_YEAR_MIN + i, label: `'${String((TM_YEAR_MIN + i) % 100).padStart(2, '0')}` })
);
const TM_MONTH_TICKS: readonly SliderTick[] = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function syncColor(percent: number): string {
  if (percent >= 85) return COLOR.cyan;
  if (percent >= 60) return COLOR.purple;
  if (percent >= 30) return COLOR.yellow;
  return COLOR.red;
}

function syncCaption(percent: number): string {
  if (percent >= 85) return '소름 돋게 닮았어요';
  if (percent >= 60) return '꽤 닮았어요';
  if (percent >= 30) return '부분적으로 닮았어요';
  return '거의 안 닮았어요';
}

// ───────────────────────── 네온 슬라이더 (순수 RN PanResponder) ─────────────────────────

interface SliderTick {
  value: number;
  label: string;
}

interface NeonSliderProps {
  value: number;
  color: string;
  /** 기본 0~100. 정수 단위로만 움직인다. */
  min?: number;
  max?: number;
  ticks?: readonly SliderTick[];
  accessibilityLabel?: string;
  accessibilityValueText?: (value: number) => string;
  onChange: (value: number) => void;
  onComplete: (value: number) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

const DEFAULT_SLIDER_TICKS: readonly SliderTick[] = [0, 25, 50, 75, 100].map((v) => ({
  value: v,
  label: String(v),
}));
const TICK_LABEL_WIDTH = 32;

const NeonSlider: React.FC<NeonSliderProps> = ({
  value,
  color,
  min = 0,
  max = 100,
  ticks = DEFAULT_SLIDER_TICKS,
  accessibilityLabel = '대운 일치율',
  accessibilityValueText,
  onChange,
  onComplete,
  onDragStateChange,
}) => {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const layoutWidthRef = useRef(0);

  const clampValue = (v: number): number => {
    if (!Number.isFinite(v)) return min;
    return Math.min(max, Math.max(min, Math.round(v)));
  };

  const current = clampValue(value);
  const currentRef = useRef(current);
  const dragStartRef = useRef(current);

  // PanResponder는 한 번만 만들어지므로 최신 콜백/값/범위는 ref로 읽는다.
  const latest = useRef({ onChange, onComplete, onDragStateChange, min, max });
  latest.current = { onChange, onComplete, onDragStateChange, min, max };
  currentRef.current = current;

  const span = () => Math.max(1, latest.current.max - latest.current.min);
  const clampLatest = (v: number): number => {
    const { min: lo, max: hi } = latest.current;
    if (!Number.isFinite(v)) return lo;
    return Math.min(hi, Math.max(lo, Math.round(v)));
  };
  const usableWidth = () => Math.max(1, layoutWidthRef.current - SLIDER_THUMB);

  const apply = (next: number) => {
    const clamped = clampLatest(next);
    if (clamped === currentRef.current) return;
    currentRef.current = clamped;
    latest.current.onChange(clamped);
  };

  const finish = () => {
    latest.current.onDragStateChange?.(false);
    latest.current.onComplete(currentRef.current);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (layoutWidthRef.current <= 0) return;
        latest.current.onDragStateChange?.(true);
        const ratio = (evt.nativeEvent.locationX - SLIDER_THUMB / 2) / usableWidth();
        const start = clampLatest(latest.current.min + ratio * span());
        dragStartRef.current = start;
        apply(start);
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        if (layoutWidthRef.current <= 0) return;
        apply(dragStartRef.current + (gesture.dx / usableWidth()) * span());
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    layoutWidthRef.current = width;
    setLayoutWidth(width);
  };

  const usable = Math.max(0, layoutWidth - SLIDER_THUMB);
  const ratioOf = (v: number) => (v - min) / Math.max(1, max - min);
  const thumbLeft = ratioOf(current) * usable;
  const fillWidth = thumbLeft + SLIDER_THUMB / 2;

  const accessibilityStep = max - min > 20 ? SLIDER_STEP : 1;
  const stepBy = (delta: number) => {
    const next = clampLatest(currentRef.current + delta);
    currentRef.current = next;
    latest.current.onChange(next);
    latest.current.onComplete(next);
  };

  return (
    <View>
      <View
        style={styles.sliderTouch}
        onLayout={handleLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min,
          max,
          now: current,
          text: accessibilityValueText ? accessibilityValueText(current) : `${current}`,
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') stepBy(accessibilityStep);
          if (event.nativeEvent.actionName === 'decrement') stepBy(-accessibilityStep);
        }}
        {...panResponder.panHandlers}
      >
        {/* 터치 좌표(locationX)가 항상 이 레이어 기준이 되도록 자식은 터치를 받지 않는다. */}
        <View pointerEvents="none" style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { width: fillWidth, backgroundColor: color, shadowColor: color },
            ]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[styles.sliderThumb, { left: thumbLeft, borderColor: color, shadowColor: color }]}
        >
          <View style={[styles.sliderThumbCore, { backgroundColor: color }]} />
        </View>
      </View>
      <View pointerEvents="none" style={styles.sliderTicks}>
        {layoutWidth > 0 &&
          ticks.map((tick) => {
            const center = SLIDER_THUMB / 2 + ratioOf(tick.value) * usable;
            const active = tick.value === current;
            return (
              <View key={tick.value} style={[styles.sliderTick, { left: center - TICK_LABEL_WIDTH / 2 }]}>
                <View style={[styles.sliderTickMark, active && { backgroundColor: color }]} />
                <Text style={[styles.sliderTickText, active && { color }]}>{tick.label}</Text>
              </View>
            );
          })}
      </View>
    </View>
  );
};

// ───────────────────────── 모달 ─────────────────────────

export interface LifeTimelineModalProps {
  visible: boolean;
  onClose: () => void;
  birthDate: string;
  birthTime: string;
  gender?: TimelineGender | null;
  calendarType?: TimelineCalendarType | null;
  /** DB에 저장된 값. 모달이 열릴 때마다 이 값으로 초기화한다. */
  initialSyncRatio?: number;
  initialInterests?: readonly string[];
  /** 사용자가 이미 대운 동기화를 확정했는지. 미확정이면 initialSyncRatio/initialInterests는 기본값이다. */
  isSynced?: boolean;
  /** DB 저장 성공 직후 호출 */
  onSynced?: (syncRatio: number, interests: InterestKey[]) => void | Promise<void>;
  /** 성별 등 필수 정보가 없을 때 설정 화면으로 이동시키는 콜백 */
  onRequestProfile?: () => void;
  /** 첫 실행 자동 온보딩(2/2단계). 환영 뱃지를 보여 주고, 확정 후 완료 토스트를 띄운 뒤 닫는다. */
  isOnboarding?: boolean;
}

const ONBOARDING_TOAST_TEXT = '운명 동기화 완료! 오늘의 일진 주파수를 확인합니다.';
const ONBOARDING_TOAST_FADE_MS = 240;
const ONBOARDING_TOAST_HOLD_MS = 1300;

export const LifeTimelineModal: React.FC<LifeTimelineModalProps> = ({
  visible,
  onClose,
  birthDate,
  birthTime,
  gender,
  calendarType,
  initialSyncRatio,
  initialInterests,
  isSynced = false,
  onSynced,
  onRequestProfile,
  isOnboarding = false,
}) => {
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [interests, setInterests] = useState<InterestKey[]>([...DEFAULT_INTERESTS]);
  const [syncRatio, setSyncRatio] = useState(DEFAULT_LIFE_SYNC_RATIO);
  const [committedSync, setCommittedSync] = useState(DEFAULT_LIFE_SYNC_RATIO);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [now, setNow] = useState<Date>(() => new Date());
  const [tmMode, setTmMode] = useState<Exclude<TimeSliderMode, 'day'>>('year');
  const [tmYear, setTmYear] = useState(DEFAULT_TARGET_YEAR);
  const [tmMonth, setTmMonth] = useState(1);
  const pulse = useRef(new Animated.Value(0)).current;

  const initialInterestsKey = (initialInterests ?? []).join(',');

  useEffect(() => {
    if (!visible) return;
    const ratio = clampPercent(initialSyncRatio ?? DEFAULT_LIFE_SYNC_RATIO);
    const opened = new Date();
    setSyncRatio(ratio);
    setCommittedSync(ratio);
    setInterests(normalizeInterests(initialInterests));
    setDragging(false);
    setSaving(false);
    setToastVisible(false);
    toastOpacity.setValue(0);
    setNow(opened);
    setTmMode('year');
    setTmYear(Math.min(TM_YEAR_MAX, Math.max(TM_YEAR_MIN, opened.getFullYear())));
    setTmMonth(opened.getMonth() + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialSyncRatio, initialInterestsKey]);

  const timeline = useMemo(() => {
    if (!visible || (gender !== 'male' && gender !== 'female')) return null;
    return calculateLifeDaeun(birthDate, birthTime, gender, calendarType ?? 'solar', now);
  }, [visible, birthDate, birthTime, gender, calendarType, now]);

  useEffect(() => {
    if (!timeline) {
      setExpanded([]);
      return;
    }
    const currentIdx = timeline.periods.findIndex((p) => p.isCurrent);
    const open: number[] = [];
    if (currentIdx >= 0) {
      open.push(timeline.periods[currentIdx]!.index);
      const prev = timeline.periods[currentIdx - 1];
      if (prev) open.push(prev.index);
    }
    setExpanded(open);
  }, [timeline]);

  // 연운·월운·타임머신은 성별 없이도 계산되므로 성별이 있을 때만 함께 넘긴다.
  const engineOptions = useMemo<TimelineOptions>(
    () => ({
      birthTime,
      calendarType: calendarType ?? 'solar',
      gender: gender === 'male' || gender === 'female' ? gender : null,
      interests,
      lifeSyncRatio: committedSync,
      referenceDate: now,
    }),
    [birthTime, calendarType, gender, interests, committedSync, now]
  );

  const months = useMemo<MonthFortune[]>(() => {
    if (!visible || !birthDate) return [];
    return calculateRemainingMonthsFortune(birthDate, now, engineOptions);
  }, [visible, birthDate, now, engineOptions]);

  const yearFortune = useMemo(() => {
    if (!visible || !birthDate) return null;
    return calculateYearFortune(birthDate, DEFAULT_TARGET_YEAR, interests, committedSync, engineOptions);
  }, [visible, birthDate, interests, committedSync, engineOptions]);

  // 슬라이더가 움직일 때마다 즉시 재계산한다(룰베이스 연산이라 호출당 1ms 미만).
  const tmValue = tmMode === 'year' ? tmYear : tmMonth;
  const tmResult = useMemo(() => {
    if (!visible || !birthDate) return null;
    return queryTimeSliderFortune(birthDate, tmMode, tmValue, engineOptions);
  }, [visible, birthDate, tmMode, tmValue, engineOptions]);

  const tmKey = tmResult ? `${tmResult.mode}-${tmResult.value}` : '';
  useEffect(() => {
    if (!tmKey) return;
    pulse.setValue(0.6);
    Animated.timing(pulse, { toValue: 0, duration: 520, useNativeDriver: true }).start();
  }, [tmKey, pulse]);

  const toggleInterest = useCallback((key: InterestKey) => {
    setInterests((prev) => {
      if (prev.includes(key)) {
        // 최소 1개는 유지해야 저장과 연산이 항상 유효하다.
        return prev.length <= 1 ? prev : prev.filter((k) => k !== key);
      }
      return INTEREST_KEYS.filter((k) => k === key || prev.includes(k));
    });
  }, []);

  const toggleExpanded = useCallback((index: number) => {
    setExpanded((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  }, []);

  const handleStep = (delta: number) => {
    const next = clampPercent(syncRatio + delta);
    setSyncRatio(next);
    setCommittedSync(next);
  };

  const playOnboardingToast = () =>
    new Promise<void>((resolve) => {
      setToastVisible(true);
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: ONBOARDING_TOAST_FADE_MS,
          useNativeDriver: true,
        }),
        Animated.delay(ONBOARDING_TOAST_HOLD_MS),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: ONBOARDING_TOAST_FADE_MS,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateUserOnboardingData(syncRatio, interests);
      try {
        await onSynced?.(syncRatio, interests);
      } catch (e) {
        console.warn('LifeTimelineModal onSynced 실패:', e);
      }
      if (isOnboarding) await playOnboardingToast();
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('동기화 실패', `운명 궤적을 저장하지 못했습니다.\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  const color = syncColor(syncRatio);
  const hasGender = gender === 'male' || gender === 'female';

  const renderPeriod = (period: DaeunPeriod) => {
    const isOpen = expanded.includes(period.index);
    const accent = period.isCurrent ? COLOR.cyan : period.isPast ? COLOR.purple : COLOR.dim;
    const badge = period.isCurrent ? '현재 활성 운' : period.isPast ? '지나온 궤적' : '다가올 대운';

    return (
      <TouchableOpacity
        key={period.index}
        activeOpacity={0.8}
        onPress={() => toggleExpanded(period.index)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={[
          styles.daeunCard,
          { borderColor: accent },
          period.isCurrent && styles.daeunCardCurrent,
          period.isFuture && styles.daeunCardFuture,
        ]}
      >
        <View style={styles.daeunHeadRow}>
          <Text style={[styles.daeunGanji, { color: accent }]}>{period.ganji.label}</Text>
          <View style={styles.daeunHeadText}>
            <Text style={styles.daeunAge}>{period.ageLabel}</Text>
            <Text style={styles.daeunYears}>
              {period.startYear}~{period.endYear} · {period.lifeStage} · {period.stemGod}/{period.branchGod} ·{' '}
              {period.stage12}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { borderColor: accent, backgroundColor: `${accent}1A` },
              period.isCurrent && styles.badgeCurrent,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: accent },
                period.isCurrent && styles.badgeTextCurrent,
              ]}
            >
              {badge}
            </Text>
          </View>
        </View>

        <Text style={[styles.daeunHeadline, { color: accent }]}>{period.headline}</Text>
        <Text style={styles.daeunSummary}>{period.summary}</Text>

        {isOpen && (
          <View style={styles.factBox}>
            <Text style={styles.factDetail}>{period.detail}</Text>
            <Text style={styles.factCheck}>✔ 팩트체크: {period.factCheck}</Text>
          </View>
        )}
        <Text style={styles.expandHint}>{isOpen ? '▲ 접기' : '▼ 탭하여 팩트체크 보기'}</Text>
      </TouchableOpacity>
    );
  };

  const renderYearFortune = (fortune: YearFortuneResult) => {
    const gradeColor = GRADE_COLOR[fortune.grade] ?? COLOR.purple;
    const score = clampPercent(fortune.score);
    const opportunities = fortune.opportunities.slice(0, 3);
    const risks = fortune.risks.slice(0, 3);

    return (
      <View style={[styles.yearCard, { borderColor: gradeColor, shadowColor: gradeColor }]}>
        <View style={styles.yearTopRow}>
          <View style={styles.yearScoreBox}>
            <Text style={[styles.yearScore, { color: gradeColor, textShadowColor: gradeColor }]}>{score}</Text>
            <Text style={styles.yearScoreUnit}>/ 100점</Text>
          </View>
          <View style={styles.yearMeta}>
            <View style={[styles.badge, styles.yearGradeBadge, { borderColor: gradeColor, backgroundColor: `${gradeColor}1A` }]}>
              <Text style={[styles.badgeText, { color: gradeColor }]}>{fortune.grade}</Text>
            </View>
            <Text style={styles.yearTitle}>
              {fortune.year}년 {fortune.ganji.label}년 · {fortune.ageLabel}
            </Text>
            <Text style={styles.yearGods}>
              천간 {fortune.stemGod} · 지지 {fortune.branchGod} · 12운성 {fortune.stage12}
            </Text>
            <Text style={[styles.yearKeyword, { color: gradeColor }]}>#{fortune.keyword}</Text>
          </View>
        </View>

        <View style={styles.yearGaugeBg}>
          <View
            style={[
              styles.yearGaugeFill,
              { width: `${score}%`, backgroundColor: gradeColor, shadowColor: gradeColor },
            ]}
          />
        </View>

        <Text style={styles.yearSummary}>{fortune.summary}</Text>

        <View style={styles.yearInterestRow}>
          {fortune.appliedInterests.map((key) => (
            <View key={key} style={styles.yearInterestChip}>
              <Text style={styles.yearInterestText}>
                {INTEREST_EMOJI[key]} {INTEREST_LABEL[key]} {clampPercent(fortune.interestScores[key] ?? 0)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.yearListBox, { borderColor: COLOR.green }]}>
          <Text style={[styles.yearListTitle, { color: COLOR.green }]}>🟢 핵심 기회</Text>
          {(opportunities.length > 0 ? opportunities : ['뚜렷한 기회 신호가 없습니다. 현상 유지에 집중하세요.']).map(
            (text, i) => (
              <Text key={`opp-${i}`} style={styles.yearListItem}>
                · {text}
              </Text>
            )
          )}
        </View>

        <View style={[styles.yearListBox, { borderColor: COLOR.red }]}>
          <Text style={[styles.yearListTitle, { color: COLOR.red }]}>🔴 치명적 리스크 · 손재수 / 관재구설</Text>
          {(risks.length > 0 ? risks : ['특별히 두드러진 충·형 신호는 감지되지 않았습니다.']).map((text, i) => (
            <Text key={`risk-${i}`} style={styles.yearListItem}>
              · {text}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderTimeMachineHud = (result: TimeSliderFortune) => {
    const risk = RISK_META[result.riskLevel] ?? RISK_META.safe;
    const gradeColor = GRADE_COLOR[result.grade] ?? COLOR.purple;
    const score = clampPercent(result.score);

    return (
      <View style={[styles.hud, { borderColor: risk.color, shadowColor: risk.color }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.hudFlash, { backgroundColor: risk.color, opacity: pulse }]}
        />
        <View style={styles.hudHeadRow}>
          <View style={styles.hudHeadText}>
            <Text style={styles.hudLabel}>{result.label}</Text>
            <Text style={styles.hudAge}>{result.ageLabel}</Text>
          </View>
          <View style={[styles.badge, { borderColor: risk.color, backgroundColor: `${risk.color}1A` }]}>
            <Text style={[styles.badgeText, { color: risk.color }]}>● {risk.label}</Text>
          </View>
        </View>

        <View style={styles.hudMainRow}>
          <View style={styles.hudCell}>
            <Text style={styles.hudCellLabel}>천간지지</Text>
            <Text style={[styles.hudGanji, { color: COLOR.purple }]}>{result.ganji.label}</Text>
          </View>
          <View style={styles.hudCell}>
            <Text style={styles.hudCellLabel}>운세 점수</Text>
            <Text style={[styles.hudScore, { color: gradeColor, textShadowColor: gradeColor }]}>{score}</Text>
          </View>
          <View style={styles.hudCell}>
            <Text style={styles.hudCellLabel}>길흉 등급</Text>
            <Text style={[styles.hudGrade, { color: gradeColor }]}>{result.grade}</Text>
          </View>
        </View>

        <View style={styles.hudBarBg}>
          <View style={[styles.hudBarFill, { width: `${score}%`, backgroundColor: gradeColor }]} />
        </View>
        <Text style={styles.hudGods}>
          {result.stemGod}/{result.branchGod} · {result.stage12} · #{result.keyword}
        </Text>

        <View style={[styles.hudAdviceBox, { borderColor: risk.color }]}>
          <Text style={[styles.hudAdviceLabel, { color: risk.color }]}>💊 행동 처방</Text>
          <Text style={styles.hudAdviceText}>{result.advice}</Text>
        </View>
      </View>
    );
  };

  const renderMonth = (month: MonthFortune) => {
    const risk = RISK_META[month.riskLevel] ?? RISK_META.safe;
    const note = month.alerts[0] ?? month.advice;
    return (
      <View
        key={`${month.year}-${month.month}`}
        style={[styles.monthCard, { borderColor: month.isCurrentMonth ? COLOR.cyan : COLOR.border }]}
      >
        <View style={styles.monthHeadRow}>
          <Text style={styles.monthLabel}>{month.label}</Text>
          {month.isCurrentMonth && <Text style={styles.monthNow}>지금</Text>}
        </View>
        <Text style={styles.monthGanji}>{month.ganji.label}월</Text>
        <Text style={styles.monthAge}>{month.ageLabel}</Text>
        <Text style={styles.monthKeyword} numberOfLines={1}>
          {month.keyword}
        </Text>

        <View style={styles.monthScoreRow}>
          <Text style={styles.monthScoreLabel}>재물</Text>
          <View style={styles.monthBarBg}>
            <View
              style={[
                styles.monthBarFill,
                { width: `${clampPercent(month.wealthScore)}%`, backgroundColor: COLOR.yellow },
              ]}
            />
          </View>
          <Text style={styles.monthScoreValue}>{clampPercent(month.wealthScore)}</Text>
        </View>
        <View style={styles.monthScoreRow}>
          <Text style={styles.monthScoreLabel}>종합</Text>
          <View style={styles.monthBarBg}>
            <View
              style={[
                styles.monthBarFill,
                { width: `${clampPercent(month.overallScore)}%`, backgroundColor: COLOR.cyan },
              ]}
            />
          </View>
          <Text style={styles.monthScoreValue}>{clampPercent(month.overallScore)}</Text>
        </View>

        <View style={[styles.riskBadge, { borderColor: risk.color }]}>
          <Text style={[styles.riskBadgeText, { color: risk.color }]}>
            위험 경보 · {risk.label} ({month.grade})
          </Text>
        </View>
        <Text style={styles.monthNote} numberOfLines={3}>
          {note}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            🪐 일생 대운 흐름 · 운명 시간여행
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {isOnboarding && (
          <View style={styles.welcomeWrap}>
            <View style={styles.welcomeBadge} accessibilityRole="header">
              <Text style={styles.welcomeText}>🎁 선물: 당신의 일생 대운 궤적이 도출되었습니다</Text>
            </View>
            <Text style={styles.welcomeSub}>
              지난 삶과 얼마나 닮았는지 슬라이더로 알려 주고 [확정]을 눌러 주세요 (2/2)
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={!dragging}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 섹션 1: 핵심 관심사 */}
          <Text style={styles.sectionTitle}>[01 · 핵심 관심사 · 복수 선택]</Text>
          <View style={styles.chipRow}>
            {INTEREST_KEYS.map((key) => {
              const selected = interests.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => toggleInterest(key)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {INTEREST_EMOJI[key]} {INTEREST_LABEL[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {interests.length <= 1 && <Text style={styles.hint}>관심사는 최소 1개가 선택되어 있어야 합니다.</Text>}

          {/* 섹션 2: 만 나이 대운 흐름 */}
          <Text style={styles.sectionTitle}>[02 · 만 나이 대운 흐름과 지난 일 확인]</Text>
          {timeline ? (
            <>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryMain}>
                  현재 {timeline.currentAgeLabel} · 일간 {timeline.dayMaster} · {timeline.strength} · {timeline.direction}
                </Text>
                <Text style={styles.summarySub}>
                  {timeline.daewoonNum}대운(10년 주기) · 첫 대운은 만 {timeline.firstDaeunAge}세에 시작됩니다.
                </Text>
              </View>
              {timeline.periods.map(renderPeriod)}
            </>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {hasGender
                  ? '대운을 계산하지 못했습니다. 생년월일과 태어난 시간을 다시 확인해 주세요.'
                  : '대운 방향(순행/역행)을 정하려면 성별 정보가 필요합니다.'}
              </Text>
              {!hasGender && !!onRequestProfile && (
                <TouchableOpacity style={styles.emptyBtn} onPress={onRequestProfile} activeOpacity={0.8}>
                  <Text style={styles.emptyBtnText}>⚙️ 운명 정보 입력하러 가기</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 섹션 3: 앵커링 질문 & 슬라이더 */}
          <Text style={styles.sectionTitle}>[03 · 기준 질문 · 일치율 보정]</Text>
          <View style={[styles.anchorBox, { borderColor: color, shadowColor: color }]}>
            <Text style={styles.anchorQuestion}>위 대운 흐름이 당신의 실제 삶과 얼마나 닮아 있나요?</Text>
            <Text style={[styles.anchorPercent, { color, textShadowColor: color }]}>{syncRatio}%</Text>
            <Text style={[styles.anchorCaption, { color }]}>{syncCaption(syncRatio)}</Text>
            <Text style={[styles.syncStatus, isSynced ? styles.syncStatusOn : styles.syncStatusOff]}>
              {isSynced
                ? '✔ 동기화 확정됨'
                : '아직 확정 전입니다 · 확정하면 AI 분석에 반영됩니다'}
            </Text>

            <View style={styles.sliderWrap}>
              <NeonSlider
                value={syncRatio}
                color={color}
                onChange={setSyncRatio}
                onComplete={setCommittedSync}
                onDragStateChange={setDragging}
                accessibilityValueText={(v) => `${v}%`}
              />
            </View>

            <View style={styles.stepRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: color }]}
                onPress={() => handleStep(-SLIDER_STEP)}
                activeOpacity={0.7}
                accessibilityLabel={`일치율 ${SLIDER_STEP} 낮추기`}
              >
                <Text style={[styles.stepBtnText, { color }]}>−{SLIDER_STEP}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: color }]}
                onPress={() => handleStep(SLIDER_STEP)}
                activeOpacity={0.7}
                accessibilityLabel={`일치율 ${SLIDER_STEP} 높이기`}
              >
                <Text style={[styles.stepBtnText, { color }]}>+{SLIDER_STEP}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 섹션 4: 신년 운세 */}
          <Text style={styles.sectionTitle}>
            [04 · {yearFortune ? `${yearFortune.year} ${yearFortune.ganji.label}년` : `${DEFAULT_TARGET_YEAR}년`} 신년 운세]
          </Text>
          {yearFortune ? renderYearFortune(yearFortune) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>신년 운세를 계산하지 못했습니다. 생년월일을 확인해 주세요.</Text>
            </View>
          )}

          {/* 섹션 5: 타임머신 슬라이더 */}
          <Text style={styles.sectionTitle}>[05 · 미래 예측 시간여행]</Text>
          <View style={styles.tmBox}>
            <View style={styles.tmTabs}>
              {(['year', 'month'] as const).map((mode) => {
                const selected = tmMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.tmTab, selected && styles.tmTabSelected]}
                    onPress={() => setTmMode(mode)}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.tmTabText, selected && styles.tmTabTextSelected]}>
                      {TM_MODE_LABEL[mode]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.tmSliderWrap}>
              {tmMode === 'year' ? (
                <NeonSlider
                  key="tm-year"
                  value={tmYear}
                  min={TM_YEAR_MIN}
                  max={TM_YEAR_MAX}
                  ticks={TM_YEAR_TICKS}
                  color={COLOR.purple}
                  accessibilityLabel="연도별 시간여행"
                  accessibilityValueText={(v) => `${v}년`}
                  onChange={setTmYear}
                  onComplete={setTmYear}
                  onDragStateChange={setDragging}
                />
              ) : (
                <NeonSlider
                  key="tm-month"
                  value={tmMonth}
                  min={1}
                  max={12}
                  ticks={TM_MONTH_TICKS}
                  color={COLOR.purple}
                  accessibilityLabel="월별 시간여행"
                  accessibilityValueText={(v) => `${v}월`}
                  onChange={setTmMonth}
                  onComplete={setTmMonth}
                  onDragStateChange={setDragging}
                />
              )}
            </View>

            {tmResult ? renderTimeMachineHud(tmResult) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>선택한 시점의 운세를 계산하지 못했습니다.</Text>
              </View>
            )}
          </View>

          {/* 섹션 6: 올해 남은 N개월 */}
          <Text style={styles.sectionTitle}>
            [06 · 올해 남은 {months.length > 0 ? `${months.length}개월` : '개월'} 잔여운]
          </Text>
          {months.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              contentContainerStyle={styles.monthList}
            >
              {months.map(renderMonth)}
            </ScrollView>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>월별 운세를 계산하지 못했습니다. 생년월일을 확인해 주세요.</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={saving}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={COLOR.bg} />
            ) : (
              <Text style={styles.confirmBtnText}>이 운명 궤적 확정 및 동기화</Text>
            )}
          </TouchableOpacity>
        </View>

        {toastVisible && (
          <Animated.View
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                opacity: toastOpacity,
                transform: [
                  {
                    translateY: toastOpacity.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.toastText}>⚡ {ONBOARDING_TOAST_TEXT}</Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: COLOR.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
    backgroundColor: COLOR.panel,
  },
  headerTitle: {
    flex: 1,
    color: COLOR.cyan,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 240, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    marginLeft: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR.purple,
    backgroundColor: COLOR.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: COLOR.purple, fontSize: 16, fontWeight: '900' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28 },
  sectionTitle: {
    color: COLOR.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  hint: { color: COLOR.dim, fontSize: 11, marginTop: 8 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.card,
  },
  chipSelected: {
    borderColor: COLOR.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    shadowColor: COLOR.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: { color: COLOR.muted, fontSize: 13, fontWeight: '700' },
  chipTextSelected: { color: COLOR.cyan },

  summaryBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.card,
    marginBottom: 10,
  },
  summaryMain: { color: COLOR.text, fontSize: 13, fontWeight: '800' },
  summarySub: { color: COLOR.muted, fontSize: 11, marginTop: 4 },

  daeunCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: COLOR.card,
    marginBottom: 10,
  },
  daeunCardCurrent: {
    backgroundColor: '#0B1A26',
    borderWidth: 1.5,
    borderColor: COLOR.cyan,
    shadowColor: COLOR.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.45), inset 0 0 10px rgba(0, 240, 255, 0.08)',
        } as unknown as ViewStyle)
      : null),
  },
  daeunCardFuture: { opacity: 0.7 },
  daeunHeadRow: { flexDirection: 'row', alignItems: 'center' },
  daeunGanji: { fontSize: 24, fontWeight: '900', width: 70 },
  daeunHeadText: { flex: 1, marginHorizontal: 6 },
  daeunAge: { color: COLOR.text, fontSize: 14, fontWeight: '800' },
  daeunYears: { color: COLOR.muted, fontSize: 10, marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1 },
  badgeCurrent: {
    borderColor: COLOR.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    shadowColor: COLOR.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.55)',
        } as unknown as ViewStyle)
      : null),
  },
  badgeText: { fontSize: 10, fontWeight: '900' },
  badgeTextCurrent: {
    color: COLOR.cyan,
    fontWeight: '900',
    ...(Platform.OS === 'web'
      ? ({
          textShadow: '0 0 8px rgba(0, 240, 255, 0.8)',
        } as unknown as TextStyle)
      : null),
  },
  daeunHeadline: { fontSize: 14, fontWeight: '900', lineHeight: 21, marginTop: 12 },
  daeunSummary: { color: COLOR.text, fontSize: 12, lineHeight: 19, marginTop: 6 },
  factBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(189, 147, 249, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(189, 147, 249, 0.4)',
  },
  factDetail: { color: COLOR.text, fontSize: 12, lineHeight: 20 },
  factCheck: { color: COLOR.purple, fontSize: 12, lineHeight: 19, marginTop: 8, fontWeight: '700' },
  expandHint: { color: COLOR.dim, fontSize: 10, marginTop: 8, textAlign: 'right' },

  emptyBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.card,
    alignItems: 'center',
  },
  emptyText: { color: COLOR.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyBtn: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR.purple,
  },
  emptyBtnText: { color: COLOR.purple, fontSize: 12, fontWeight: '800' },

  anchorBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: COLOR.panel,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 6,
  },
  anchorQuestion: { color: COLOR.text, fontSize: 14, fontWeight: '800', lineHeight: 21, textAlign: 'center' },
  anchorPercent: {
    fontSize: 64,
    fontWeight: '900',
    marginTop: 10,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  anchorCaption: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  syncStatus: { fontSize: 11, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  syncStatusOn: { color: COLOR.green },
  syncStatusOff: { color: COLOR.dim },
  sliderWrap: { width: '100%', paddingHorizontal: 4 },
  stepRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stepBtn: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: COLOR.card,
    alignItems: 'center',
  },
  stepBtnText: { fontSize: 13, fontWeight: '900' },

  sliderTouch: { height: 48, justifyContent: 'center' },
  sliderTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A2338',
    borderWidth: 1,
    borderColor: COLOR.border,
    overflow: 'visible',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: (48 - SLIDER_THUMB) / 2,
    width: SLIDER_THUMB,
    height: SLIDER_THUMB,
    borderRadius: SLIDER_THUMB / 2,
    borderWidth: 2,
    backgroundColor: COLOR.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  sliderThumbCore: { width: 10, height: 10, borderRadius: 5 },
  sliderTicks: { height: 26, position: 'relative' },
  sliderTick: { position: 'absolute', top: 0, width: TICK_LABEL_WIDTH, alignItems: 'center' },
  sliderTickMark: { width: 2, height: 6, borderRadius: 1, backgroundColor: COLOR.border },
  sliderTickText: { color: COLOR.dim, fontSize: 10, fontWeight: '700', marginTop: 2 },

  yearCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: COLOR.panel,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  yearTopRow: { flexDirection: 'row', alignItems: 'center' },
  yearScoreBox: { alignItems: 'center', width: 96 },
  yearScore: {
    fontSize: 52,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  yearScoreUnit: { color: COLOR.muted, fontSize: 10, fontWeight: '700', marginTop: -4 },
  yearMeta: { flex: 1, marginLeft: 10 },
  yearGradeBadge: { alignSelf: 'flex-start', marginBottom: 6 },
  yearTitle: { color: COLOR.text, fontSize: 13, fontWeight: '800' },
  yearGods: { color: COLOR.muted, fontSize: 11, marginTop: 3 },
  yearKeyword: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  yearGaugeBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A2338',
    marginTop: 12,
  },
  yearGaugeFill: {
    height: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 4,
  },
  yearSummary: { color: COLOR.text, fontSize: 12, lineHeight: 19, marginTop: 12 },
  yearInterestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  yearInterestChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.card,
  },
  yearInterestText: { color: COLOR.muted, fontSize: 11, fontWeight: '700' },
  yearListBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  yearListTitle: { fontSize: 12, fontWeight: '900', marginBottom: 6 },
  yearListItem: { color: COLOR.text, fontSize: 12, lineHeight: 18, marginTop: 2 },

  tmBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.panel,
  },
  tmTabs: { flexDirection: 'row', gap: 8 },
  tmTab: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tmTabSelected: {
    borderColor: COLOR.purple,
    backgroundColor: 'rgba(189, 147, 249, 0.14)',
    shadowColor: COLOR.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  tmTabText: { color: COLOR.muted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  tmTabTextSelected: { color: COLOR.purple },
  tmSliderWrap: { marginTop: 14, marginBottom: 8, paddingHorizontal: 4 },

  hud: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#0A0F1D',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
  hudFlash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hudHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hudHeadText: { flex: 1, marginRight: 8 },
  hudLabel: { color: COLOR.text, fontSize: 16, fontWeight: '900' },
  hudAge: { color: COLOR.muted, fontSize: 11, marginTop: 2 },
  hudMainRow: { flexDirection: 'row', marginTop: 14 },
  hudCell: { flex: 1, alignItems: 'center' },
  hudCellLabel: { color: COLOR.dim, fontSize: 10, fontWeight: '800', marginBottom: 4 },
  hudGanji: { fontSize: 26, fontWeight: '900' },
  hudScore: {
    fontSize: 34,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  hudGrade: { fontSize: 26, fontWeight: '900' },
  hudBarBg: { height: 6, borderRadius: 3, backgroundColor: '#1A2338', marginTop: 12, overflow: 'hidden' },
  hudBarFill: { height: '100%', borderRadius: 3 },
  hudGods: { color: COLOR.muted, fontSize: 11, marginTop: 8, textAlign: 'center' },
  hudAdviceBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  hudAdviceLabel: { fontSize: 11, fontWeight: '900', marginBottom: 4 },
  hudAdviceText: { color: COLOR.text, fontSize: 13, lineHeight: 20, fontWeight: '700' },

  monthList: { gap: 10, paddingRight: 4 },
  monthCard: {
    width: 176,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: COLOR.card,
  },
  monthHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { color: COLOR.text, fontSize: 16, fontWeight: '900' },
  monthNow: { color: COLOR.cyan, fontSize: 10, fontWeight: '900' },
  monthGanji: { color: COLOR.purple, fontSize: 14, fontWeight: '800', marginTop: 2 },
  monthAge: { color: COLOR.muted, fontSize: 10, marginTop: 2 },
  monthKeyword: { color: COLOR.text, fontSize: 12, fontWeight: '700', marginTop: 8 },
  monthScoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  monthScoreLabel: { color: COLOR.muted, fontSize: 10, width: 28 },
  monthBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A2338',
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  monthBarFill: { height: '100%', borderRadius: 3 },
  monthScoreValue: { color: COLOR.text, fontSize: 11, fontWeight: '800', width: 24, textAlign: 'right' },
  riskBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  riskBadgeText: { fontSize: 10, fontWeight: '900' },
  monthNote: { color: COLOR.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    backgroundColor: COLOR.panel,
  },
  confirmBtn: {
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: COLOR.cyan,
    alignItems: 'center',
    shadowColor: COLOR.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: COLOR.bg, fontSize: 15, fontWeight: '900' },
  welcomeWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  welcomeBadge: {
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLOR.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    shadowColor: COLOR.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeText: {
    color: COLOR.cyan,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 240, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  welcomeSub: { color: COLOR.muted, fontSize: 11, textAlign: 'center', marginTop: 6 },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 110 : 96,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLOR.purple,
    backgroundColor: 'rgba(11, 18, 32, 0.96)',
    shadowColor: COLOR.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
  },
  toastText: { color: COLOR.text, fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 19 },
});
