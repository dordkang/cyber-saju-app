import React, { createElement, memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REPORT_BUTTON_LABEL } from '../constants/devFlags';
import { REEL_SECTION_VIDEO } from '../constants/videoAssets';
import type { ReelSectionKey } from '../constants/videoAssets';
import type { MoneyEngineResult } from '../engine/moneyEngine';
import type { NatalSummary } from '../engine/natalSummary';
import type { FiveElement } from '../engine/types';
import { startAmbient, stopAmbient } from '../utils/ambientSynth';

const IS_WEB = Platform.OS === 'web';

const COLORS = {
  space: '#05070D',
  cyan: '#00FFCC',
  violet: '#BD93F9',
  red: '#FF5555',
  text: '#F2F6FF',
  muted: '#9AA8BD',
  ink: '#04100D',
};

/** 섹션 진입 후 영상만 보여 주는 시간. 이후 버튼과 카드가 서서히 나타난다. */
const REVEAL_DELAY_MS = 2000;
const CONTENT_MAX_WIDTH = 480;
const CHROME_HEIGHT = 56;

/** 한글 단어 중간에서 줄이 끊기지 않도록 한다. 웹 전용 속성이라 타입을 우회한다. */
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
const GLASS_BLUR = (
  IS_WEB ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : null
) as unknown as ViewStyle | null;
const DIM_BLUR = (
  IS_WEB ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : null
) as unknown as ViewStyle | null;
const SNAP_CONTAINER = (IS_WEB ? { scrollSnapType: 'y mandatory' } : null) as unknown as ViewStyle | null;
const SNAP_PAGE = (IS_WEB ? { scrollSnapAlign: 'start', scrollSnapStop: 'always' } : null) as unknown as ViewStyle | null;
const GLOW_CYAN = (IS_WEB ? { boxShadow: '0 0 22px rgba(0, 255, 204, 0.38)' } : null) as unknown as ViewStyle | null;

interface SectionMeta {
  key: ReelSectionKey;
  no: string;
  chip: string;
  accent: string;
  /** 영상이 없거나 불러오는 동안 보이는 다크 네온 그라디언트 */
  fallback: ViewStyle;
}

function gradient(glow: string, side: string): ViewStyle {
  return (
    IS_WEB
      ? {
          backgroundImage:
            `radial-gradient(120% 70% at ${side}, ${glow}, transparent 62%), ` +
            'linear-gradient(180deg, #05070D 0%, #0A1020 55%, #05070D 100%)',
        }
      : { backgroundColor: '#080C16' }
  ) as unknown as ViewStyle;
}

const SECTIONS: readonly SectionMeta[] = [
  { key: 'life', no: '01', chip: '인생 · 人生 · Life', accent: COLORS.cyan, fallback: gradient('rgba(0, 255, 204, 0.26)', '50% 0%') },
  { key: 'people', no: '02', chip: '사람 · 도화 & 속마음', accent: COLORS.violet, fallback: gradient('rgba(189, 147, 249, 0.3)', '80% 10%') },
  { key: 'money', no: '03', chip: '돈 · 비즈니스', accent: COLORS.cyan, fallback: gradient('rgba(0, 255, 204, 0.22)', '20% 100%') },
  { key: 'health', no: '04', chip: '건강 · 3초 리셋', accent: COLORS.violet, fallback: gradient('rgba(255, 85, 85, 0.2)', '50% 100%') },
];

/** 위아래로 무한히 이어지도록 양 끝에 반대편 섹션을 한 장씩 복제해 둔다. */
const PAGE_KEYS: readonly ReelSectionKey[] = ['health', 'life', 'people', 'money', 'health', 'life'];
const REAL_PAGE_COUNT = SECTIONS.length;

// ───────────────────────── 공개 타입 ─────────────────────────

export interface ReelsDaeunInfo {
  /** 예: 만 52세 ~ 61세 */
  ageLabel: string;
  /** 예: 丙子 */
  ganji: string;
  /** 예: 현재 만 51세 */
  currentAgeLabel?: string;
  theme: string;
}

export interface ReelsDaeunStripItem {
  label: string;
  current: boolean;
  past: boolean;
}

export interface ReelsPartnerInfo {
  /** 예: 애인 · 1990-05-02 */
  label: string;
  /** 딴마음 지수 0~100. 계산하지 못했으면 null */
  radarScore: number | null;
  radarLevel: string | null;
}

export interface ReelsFortuneViewProps {
  /** 모달이 열려 있으면 true. 배경 영상을 멈추고 어두운 블러를 덮는다. */
  paused?: boolean;
  daeun?: ReelsDaeunInfo | null;
  daeunStrip?: readonly ReelsDaeunStripItem[];
  /** 엔진이 계산한 사주 4주 8자와 오행 비율 */
  natal?: NatalSummary | null;
  partner?: ReelsPartnerInfo | null;
  money?: MoneyEngineResult | null;
  /** 오늘 지갑을 지켜 줄 행운의 물건 */
  luckyItem?: string;
  /** 오늘 기록한 오행 배터리 충전량(25/50/75/100). 기록 전이면 null */
  batteryLevel?: number | null;
  onOpenTimeline?: () => void;
  onAddPartner?: () => void;
  onOpenReport?: () => void;
  onOpenDailyCard?: () => void;
  onSettingsPress?: () => void;
}

// ───────────────────────── 배경: 영상 + 폴백 + 딤 ─────────────────────────

interface SectionVideoProps {
  uri: string;
  playing: boolean;
  preloadAuto: boolean;
}

const SectionVideo = memo(function SectionVideo({ uri, playing, preloadAuto }: SectionVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    // React의 muted 속성은 초기 렌더에서 DOM에 반영되지 않는 경우가 있어 직접 지정한다.
    el.muted = true;
    el.defaultMuted = true;
    if (playingRef.current) el.play().catch(() => undefined);
    else el.pause();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => undefined);
    else el.pause();
  }, [playing]);

  // 브라우저가 자동재생을 막은 경우 첫 터치에서 다시 재생을 시도한다.
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return undefined;
    const resume = () => {
      const el = videoRef.current;
      if (el && playingRef.current && el.paused) el.play().catch(() => undefined);
    };
    document.addEventListener('pointerdown', resume, { passive: true });
    return () => document.removeEventListener('pointerdown', resume);
  }, []);

  if (!IS_WEB || failed) return null;

  return createElement('video', {
    ref: setVideoRef,
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: preloadAuto ? 'auto' : 'metadata',
    disablePictureInPicture: true,
    tabIndex: -1,
    'aria-hidden': true,
    onCanPlay: () => setReady(true),
    onError: () => setFailed(true),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      pointerEvents: 'none',
      filter: 'saturate(1.1) contrast(1.05) brightness(0.9)',
      opacity: ready ? 1 : 0,
      transition: 'opacity 700ms ease',
    },
  });
});

const READABILITY_STYLE = (
  IS_WEB
    ? {
        backgroundImage:
          'linear-gradient(to bottom, rgba(5,7,13,0.72) 0%, rgba(5,7,13,0.28) 30%, rgba(5,7,13,0.18) 52%, rgba(5,7,13,0.88) 100%)',
      }
    : { backgroundColor: 'rgba(5, 7, 13, 0.4)' }
) as unknown as ViewStyle;

/** 영상이 멈추는 동안 배경 위에 덮이는 30% 어두운 블러 딤 */
const DimLayer = memo(function DimLayer({ on }: { on: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: on ? 1 : 0,
      duration: on ? 140 : 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: !IS_WEB,
    }).start();
  }, [on, opacity]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.fill, styles.dim, DIM_BLUR, { opacity }]}
    />
  );
});

interface SectionBackdropProps {
  meta: SectionMeta;
  playing: boolean;
  active: boolean;
  dimmed: boolean;
}

const SectionBackdrop = memo(function SectionBackdrop({ meta, playing, active, dimmed }: SectionBackdropProps) {
  const asset = REEL_SECTION_VIDEO[meta.key];
  return (
    <View pointerEvents="none" style={[styles.fill, { backgroundColor: asset?.tint ?? COLORS.space }, meta.fallback]}>
      {asset ? <SectionVideo uri={asset.uri} playing={playing} preloadAuto={active} /> : null}
      <View style={[styles.fill, READABILITY_STYLE]} />
      <DimLayer on={dimmed} />
    </View>
  );
});

// ───────────────────────── 공통 UI 조각 ─────────────────────────

type ButtonTone = 'cyan' | 'violet' | 'red' | 'ghost';

interface ActionButtonProps {
  label: string;
  tone?: ButtonTone;
  onPress?: () => void;
  compact?: boolean;
}

const ActionButton = memo(function ActionButton({ label, tone = 'cyan', onPress, compact = false }: ActionButtonProps) {
  const toneStyle =
    tone === 'cyan'
      ? [styles.btnCyan, GLOW_CYAN]
      : tone === 'red'
        ? styles.btnRed
        : tone === 'violet'
          ? styles.btnViolet
          : styles.btnGhost;
  const textStyle = tone === 'cyan' || tone === 'red' ? styles.btnTextDark : tone === 'violet' ? styles.btnTextViolet : styles.btnTextLight;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, compact && styles.btnCompact, toneStyle, pressed && styles.pressed]}
    >
      <Text style={[styles.btnText, compact && styles.btnTextCompact, textStyle]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
});

const Meter = memo(function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={styles.meter}>
      <View style={styles.meterHead}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={[styles.meterValue, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
});

const ELEMENT_COLOR: Record<FiveElement, string> = {
  Wood: '#7CE38B',
  Fire: '#FF7A59',
  Earth: '#F5C451',
  Metal: '#D6DEEB',
  Water: '#5AA9FF',
};

const NatalBlock = memo(function NatalBlock({ natal }: { natal: NatalSummary }) {
  return (
    <View style={styles.natal}>
      <Text style={styles.cardLabel}>내 사주 원국 · 일간(본원) {natal.dayMaster}</Text>
      <View style={styles.natalRow}>
        {natal.pillars.map((p) => (
          <View key={p.key} style={[styles.natalCell, p.isDayMaster && styles.natalCellDay]}>
            <Text style={styles.natalLabel}>{p.isDayMaster ? '일주 · 본원' : p.label}</Text>
            <Text style={styles.natalChar}>
              <Text style={{ color: ELEMENT_COLOR[p.stemElement] }}>{p.stem}</Text>
              <Text style={{ color: ELEMENT_COLOR[p.branchElement] }}>{p.branch}</Text>
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.ratioRow}>
        {natal.ratio.map((r) => (
          <View key={r.element} style={styles.ratioItem}>
            <Text style={[styles.ratioLabel, { color: ELEMENT_COLOR[r.element] }]}>
              {r.label} {r.count}
            </Text>
            <Text style={styles.ratioPercent}>{Number(r.percent.toFixed(1))}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// ───────────────────────── 02 사람: 딴마음 레이더 ─────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return COLORS.red;
  if (score >= 40) return COLORS.violet;
  return COLORS.cyan;
}

interface RadarProps {
  size: number;
  score: number | null;
  running: boolean;
}

const Radar = memo(function Radar({ size, score, running }: RadarProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!running) {
      spin.stopAnimation();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 3800, easing: Easing.linear, useNativeDriver: !IS_WEB })
    );
    loop.start();
    return () => loop.stop();
  }, [running, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const radius = size / 2;
  const blipColor = score == null ? COLORS.muted : scoreColor(score);
  const blipDistance = score == null ? radius * 0.55 : radius * (0.14 + (1 - score / 100) * 0.74);
  const angle = (-38 * Math.PI) / 180;
  const blipX = radius + blipDistance * Math.cos(angle) - 7;
  const blipY = radius + blipDistance * Math.sin(angle) - 7;

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={score == null ? '딴마음 레이더' : `딴마음 지수 ${score}`}>
      {[1, 0.68, 0.36].map((ratio) => (
        <View
          key={ratio}
          style={[
            styles.radarRing,
            {
              width: size * ratio,
              height: size * ratio,
              borderRadius: (size * ratio) / 2,
              top: (size - size * ratio) / 2,
              left: (size - size * ratio) / 2,
            },
          ]}
        />
      ))}
      <View style={[styles.radarAxis, { left: radius - 0.5, top: 0, width: 1, height: size }]} />
      <View style={[styles.radarAxis, { top: radius - 0.5, left: 0, height: 1, width: size }]} />
      <Animated.View style={[styles.fill, { transform: [{ rotate }] }]}>
        <View style={[styles.radarSweep, { left: radius - 1, height: radius, backgroundColor: COLORS.cyan }]} />
      </Animated.View>
      <View
        style={[
          styles.radarBlip,
          { left: blipX, top: blipY, backgroundColor: blipColor, borderColor: blipColor },
        ]}
      />
      <View style={[styles.radarCenter, { left: radius - 4, top: radius - 4 }]} />
    </View>
  );
});

// ───────────────────────── 04 건강: 오행 배터리 ─────────────────────────

const BATTERY_SEGMENTS = 4;

const Battery = memo(function Battery({ level }: { level: number | null }) {
  const filled = level == null ? 0 : Math.min(BATTERY_SEGMENTS, Math.max(0, Math.round(level / 25)));
  const color = level == null ? COLORS.muted : level <= 25 ? COLORS.red : level <= 50 ? COLORS.violet : COLORS.cyan;
  return (
    <View style={styles.batteryWrap} accessible accessibilityLabel={level == null ? '오늘 충전 전' : `오늘 충전량 ${level}퍼센트`}>
      <View style={styles.batteryBody}>
        {Array.from({ length: BATTERY_SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.batterySeg,
              i < filled ? { backgroundColor: color, borderColor: color } : null,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.batteryText, { color }]}>
        {level == null ? '오늘은 아직 충전 전이에요' : `오늘 충전량 ${level}%`}
      </Text>
    </View>
  );
});

// ───────────────────────── 섹션 ─────────────────────────

function useDelayedReveal(active: boolean) {
  const [shown, setShown] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      setShown(false);
      return undefined;
    }
    const timer = setTimeout(() => setShown(true), REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: shown ? 1 : 0,
      duration: shown ? 700 : 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: !IS_WEB,
    }).start();
  }, [shown, progress]);

  return { shown, progress };
}

interface ReelSectionProps extends ReelsFortuneViewProps {
  meta: SectionMeta;
  height: number;
  active: boolean;
  /** 모달이나 카드가 열려 영상을 멈춰야 하는지 */
  hold: boolean;
  onCardFocusChange: (open: boolean) => void;
}

const ReelSection = memo(function ReelSection(props: ReelSectionProps) {
  const {
    meta,
    height,
    active,
    hold,
    daeun,
    daeunStrip,
    natal,
    partner,
    money,
    luckyItem,
    batteryLevel,
    onOpenTimeline,
    onAddPartner,
    onOpenReport,
    onOpenDailyCard,
    onCardFocusChange,
  } = props;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { shown, progress } = useDelayedReveal(active);
  const [engineOpen, setEngineOpen] = useState(false);
  const compact = height < 720;

  useEffect(() => {
    if (!active && engineOpen) setEngineOpen(false);
  }, [active, engineOpen]);

  useEffect(() => {
    if (meta.key === 'money') onCardFocusChange(engineOpen && active);
  }, [engineOpen, active, meta.key, onCardFocusChange]);

  const playing = active && !hold;
  const dimmed = active && hold;
  const radarSize = Math.round(Math.min(width * 0.62, height * (compact ? 0.2 : 0.3), 250));

  const revealStyle = {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  let titleLines: string;
  let subtitle: string;
  switch (meta.key) {
    case 'life':
      titleLines = '10년마다 바뀌는\n인생의 파도';
      subtitle = '지금 타고 있는 파도부터 앞으로 올 파도까지 한눈에 봐요.';
      break;
    case 'people':
      titleLines = '상대방 딴마음\n레이더';
      subtitle = '내 사람 사주 속 이성 매력(도화) 신호를 잡아내요.';
      break;
    case 'money':
      titleLines = '오늘의 돈 버는 엔진\n지갑 털림 방어선';
      subtitle = money?.headline ?? '내 사주와 오늘 일진으로 오늘의 돈 흐름을 읽어요.';
      break;
    default:
      titleLines = '하루 3초,\n오행 배터리 충전';
      subtitle = '오늘 기분 카드 한 장만 고르면 끝나요.';
  }

  return (
    <View style={[styles.page, { height }, SNAP_PAGE]}>
      <SectionBackdrop meta={meta} playing={playing} active={active} dimmed={dimmed} />

      <Animated.View
        pointerEvents={shown ? 'box-none' : 'none'}
        style={[
          styles.content,
          { paddingTop: insets.top + CHROME_HEIGHT, paddingBottom: Math.max(insets.bottom, 12) + 14 },
          revealStyle,
        ]}
      >
        <View style={styles.contentInner}>
          <View>
            <View style={[styles.chip, { borderColor: meta.accent }]}>
              <Text style={[styles.chipText, { color: meta.accent }]}>
                {meta.no} · {meta.chip}
              </Text>
            </View>
            <Text style={[styles.title, compact && styles.titleCompact]}>{titleLines}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.middle}>
            {meta.key === 'life' && (
              <View style={styles.glass}>
                {daeun ? (
                  <>
                    <Text style={styles.cardLabel}>
                      지금 타고 있는 대운{daeun.currentAgeLabel ? ` · ${daeun.currentAgeLabel}` : ''}
                    </Text>
                    <Text style={styles.cardValue}>
                      {daeun.ageLabel} · {daeun.ganji}
                    </Text>
                    {!(compact && natal) && (
                      <Text style={styles.cardBody} numberOfLines={3}>
                        {daeun.theme}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.cardLabel}>내 대운 파도</Text>
                    <Text style={styles.cardBody}>생년월일과 성별을 입력하면 지금 어느 파도 위에 있는지 알려 드려요.</Text>
                  </>
                )}
                {!!daeunStrip?.length && (
                  <View style={styles.strip}>
                    {daeunStrip.map((item) => (
                      <View key={item.label} style={styles.stripItem}>
                        <View
                          style={[
                            styles.stripDot,
                            item.past && styles.stripDotPast,
                            item.current && styles.stripDotCurrent,
                          ]}
                        />
                        <Text style={[styles.stripLabel, item.current && styles.stripLabelCurrent]}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {natal && <NatalBlock natal={natal} />}
              </View>
            )}

            {meta.key === 'people' && (
              <View style={styles.radarBox}>
                <Radar size={radarSize} score={partner?.radarScore ?? null} running={playing} />
                <Text style={[styles.radarScore, { color: partner?.radarScore != null ? scoreColor(partner.radarScore) : COLORS.muted }]}>
                  {partner?.radarScore != null
                    ? `딴마음 지수 ${partner.radarScore} · ${partner.radarLevel ?? ''}`
                    : '내 사람을 보관하면 레이더가 켜져요'}
                </Text>
              </View>
            )}

            {meta.key === 'money' && money && (
              <View style={styles.glass}>
                <Meter label="돈 버는 엔진" value={money.power} color={COLORS.cyan} />
                <Meter label="지갑 방어선" value={money.defense} color={money.defense < 40 ? COLORS.red : COLORS.violet} />
              </View>
            )}

            {meta.key === 'health' && <Battery level={batteryLevel ?? null} />}
          </View>

          <View style={styles.actions}>
            {meta.key === 'life' && (
              <ActionButton label="📈 내 인생 10년 대운 전체보기 (무료)" tone="cyan" onPress={onOpenTimeline} />
            )}

            {meta.key === 'people' && (
              <View style={[styles.glass, styles.vault]}>
                <Text style={styles.vaultCaption}>PARTNER VAULT</Text>
                <Text style={styles.vaultTitle}>내 사람(비밀) 관찰 보관함</Text>
                <Text style={styles.vaultBody} numberOfLines={2}>
                  {partner ? partner.label : '아직 보관된 사람이 없어요. 입력한 정보는 이 기기에만 저장돼요.'}
                </Text>
                <View style={styles.vaultButtons}>
                  <View style={styles.vaultButtonCell}>
                    <ActionButton label="+ 내 사람 사주 추가" tone="violet" compact onPress={onAddPartner} />
                  </View>
                  <View style={styles.vaultButtonCell}>
                    <ActionButton label={REPORT_BUTTON_LABEL} tone="red" compact onPress={onOpenReport} />
                  </View>
                </View>
              </View>
            )}

            {meta.key === 'money' &&
              (engineOpen && money ? (
                <View style={[styles.glass, { borderColor: COLORS.cyan }]}>
                  <View style={[styles.statusChip, { borderColor: money.defense < 40 ? COLORS.red : COLORS.cyan }]}>
                    <Text style={[styles.statusText, { color: money.defense < 40 ? COLORS.red : COLORS.cyan }]}>
                      엔진 상태 · {money.status}
                    </Text>
                  </View>
                  <Text style={styles.cardLabel}>돈 버는 법</Text>
                  <Text style={styles.cardBody}>{money.engineLine}</Text>
                  <Text style={[styles.cardLabel, styles.cardLabelGap]}>지갑 지키는 법</Text>
                  <Text style={styles.cardBody}>{money.defenseLine}</Text>
                  {!!luckyItem && (
                    <Text style={[styles.cardBody, styles.cardLabelGap]}>오늘 곁에 둘 물건 · {luckyItem}</Text>
                  )}
                  <View style={styles.closeRow}>
                    <ActionButton label="확인했어요" tone="ghost" compact onPress={() => setEngineOpen(false)} />
                  </View>
                </View>
              ) : (
                <ActionButton label="💰 오늘 돈 버는 엔진 활성화" tone="cyan" onPress={() => setEngineOpen(true)} />
              ))}

            {meta.key === 'health' && (
              <ActionButton label="⚡ 3초 오행 정산 및 배터리 충전" tone="cyan" onPress={onOpenDailyCard} />
            )}

            <Text style={styles.swipeHint}>↑ 위로 밀어서 다음 이야기</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

// ───────────────────────── 메인 뷰 ─────────────────────────

export const ReelsFortuneView: React.FC<ReelsFortuneViewProps> = (props) => {
  const { paused = false, onSettingsPress } = props;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const readyRef = useRef(false);
  const activeRef = useRef(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [cardOpen, setCardOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => () => stopAmbient(), []);

  // 높이가 정해지거나 바뀌면(모바일 주소창 등) 현재 섹션 위치로 다시 맞춘다.
  useEffect(() => {
    if (pageHeight <= 0) return undefined;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: (activeRef.current + 1) * pageHeight, animated: false });
      readyRef.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, [pageHeight]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    if (next > 0 && next !== pageHeight) setPageHeight(next);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageHeight <= 0 || !readyRef.current) return;
    const y = e.nativeEvent.contentOffset.y;
    const page = Math.round(y / pageHeight);
    const section = (((page - 1) % REAL_PAGE_COUNT) + REAL_PAGE_COUNT) % REAL_PAGE_COUNT;
    if (section !== activeRef.current) {
      activeRef.current = section;
      setActiveIdx(section);
    }
    // 복제 페이지에 정확히 도착하면 진짜 페이지로 소리 없이 점프해서 무한 루프를 만든다.
    if (Math.abs(y - page * pageHeight) <= 2) {
      if (page === 0) scrollRef.current?.scrollTo({ y: REAL_PAGE_COUNT * pageHeight, animated: false });
      else if (page === PAGE_KEYS.length - 1) scrollRef.current?.scrollTo({ y: pageHeight, animated: false });
    }
  };

  const toggleSound = () => {
    if (soundOn) {
      stopAmbient();
      setSoundOn(false);
    } else if (startAmbient()) {
      setSoundOn(true);
    }
  };

  const hold = paused || cardOpen;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.pager} onLayout={handleLayout}>
        {pageHeight > 0 && (
          <ScrollView
            ref={scrollRef}
            pagingEnabled
            snapToInterval={pageHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            bounces={false}
            overScrollMode="never"
            style={SNAP_CONTAINER}
          >
            {PAGE_KEYS.map((key, page) => {
              const meta = SECTIONS.find((s) => s.key === key) ?? SECTIONS[0];
              if (!meta) return null;
              const isActive = SECTIONS[activeIdx]?.key === key;
              return (
                <ReelSection
                  key={`${key}-${page}`}
                  {...props}
                  meta={meta}
                  height={pageHeight}
                  active={isActive}
                  hold={hold}
                  onCardFocusChange={setCardOpen}
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      <View pointerEvents="box-none" style={[styles.chrome, { paddingTop: insets.top + 10 }]}>
        <View style={styles.chromeInner}>
          <View style={styles.progress} accessibilityLabel={`${activeIdx + 1}번째 이야기`}>
            {SECTIONS.map((s, i) => (
              <View
                key={s.key}
                style={[styles.progressSeg, i === activeIdx && { backgroundColor: COLORS.cyan }]}
              />
            ))}
          </View>
          <View style={styles.chromeButtons}>
            <Pressable
              onPress={toggleSound}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={soundOn ? '소리 끄기' : '소리 켜기'}
              style={({ pressed }) => [styles.chromeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.chromeIcon}>{soundOn ? '🔊' : '🔇'}</Text>
            </Pressable>
            <Pressable
              onPress={onSettingsPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="내 정보 설정"
              style={({ pressed }) => [styles.chromeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.chromeIcon}>⚙️</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const GLASS_BG = 'rgba(8, 12, 22, 0.66)';
const GLASS_BORDER = 'rgba(0, 255, 204, 0.28)';
const TEXT_SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.75)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
} as const;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: COLORS.space,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  pager: { flex: 1 },
  page: { width: '100%', overflow: 'hidden', backgroundColor: COLORS.space },

  chrome: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, zIndex: 10 },
  chromeInner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', gap: 10 },
  progress: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.22)' },
  chromeButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  chromeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 12, 22, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chromeIcon: { fontSize: 16 },

  content: { flex: 1, paddingHorizontal: 20 },
  contentInner: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', justifyContent: 'space-between' },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: 12 },
  actions: { gap: 10 },

  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.55)',
  },
  chipText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, ...KEEP_ALL },
  title: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 32,
    lineHeight: 41,
    fontWeight: '900',
    ...KEEP_ALL,
    ...TEXT_SHADOW,
  },
  titleCompact: { fontSize: 26, lineHeight: 34 },
  subtitle: { marginTop: 8, color: '#D8E1EF', fontSize: 14, lineHeight: 21, ...KEEP_ALL, ...TEXT_SHADOW },
  swipeHint: { marginTop: 2, color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, textAlign: 'center', ...KEEP_ALL },

  glass: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    gap: 4,
    ...(GLASS_BLUR ?? {}),
  },
  cardLabel: { color: COLORS.cyan, fontSize: 12, fontWeight: '800', ...KEEP_ALL },
  cardLabelGap: { marginTop: 10 },
  cardValue: { marginTop: 2, color: COLORS.text, fontSize: 22, fontWeight: '900', ...KEEP_ALL },
  cardBody: { color: COLORS.text, fontSize: 14, lineHeight: 22, ...KEEP_ALL },

  strip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  stripItem: { alignItems: 'center', gap: 5, flex: 1 },
  stripDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.35)' },
  stripDotPast: { backgroundColor: 'rgba(189, 147, 249, 0.55)' },
  stripDotCurrent: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.cyan },
  stripLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  stripLabelCurrent: { color: COLORS.cyan, fontWeight: '900' },

  natal: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.14)', gap: 8 },
  natalRow: { flexDirection: 'row', gap: 6 },
  natalCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  natalCellDay: { borderColor: COLORS.cyan, backgroundColor: 'rgba(0, 255, 204, 0.1)' },
  natalLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '800', ...KEEP_ALL },
  natalChar: { fontSize: 22, fontWeight: '900', lineHeight: 30 },
  ratioRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ratioItem: { flex: 1, alignItems: 'center' },
  ratioLabel: { fontSize: 12, fontWeight: '900' },
  ratioPercent: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },

  radarBox: { alignItems: 'center', gap: 10 },
  radarRing: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(0, 255, 204, 0.38)', backgroundColor: 'rgba(0, 255, 204, 0.03)' },
  radarAxis: { position: 'absolute', backgroundColor: 'rgba(0, 255, 204, 0.18)' },
  radarSweep: { position: 'absolute', top: 0, width: 2, opacity: 0.75 },
  radarBlip: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 2, opacity: 0.95 },
  radarCenter: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.cyan },
  radarScore: { fontSize: 15, fontWeight: '900', ...KEEP_ALL, ...TEXT_SHADOW },

  meter: { gap: 6, marginBottom: 8 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { color: COLORS.text, fontSize: 13, fontWeight: '800', ...KEEP_ALL },
  meterValue: { fontSize: 13, fontWeight: '900' },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.12)', overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: 4 },

  batteryWrap: { alignItems: 'center', gap: 14 },
  batteryBody: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(5, 7, 13, 0.5)',
  },
  batterySeg: {
    width: 52,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  batteryText: { fontSize: 15, fontWeight: '900', ...KEEP_ALL, ...TEXT_SHADOW },

  vault: { borderColor: 'rgba(189, 147, 249, 0.5)', gap: 2 },
  vaultCaption: { color: COLORS.violet, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  vaultTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900', ...KEEP_ALL },
  vaultBody: { marginTop: 2, color: COLORS.muted, fontSize: 12, lineHeight: 18, ...KEEP_ALL },
  vaultButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  vaultButtonCell: { flex: 1 },

  statusChip: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 6,
  },
  statusText: { fontSize: 12, fontWeight: '900', ...KEEP_ALL },
  closeRow: { marginTop: 12 },

  btn: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: { minHeight: 48, paddingHorizontal: 8, borderRadius: 14 },
  btnCyan: { backgroundColor: COLORS.cyan },
  btnRed: { backgroundColor: COLORS.red },
  btnViolet: { backgroundColor: 'rgba(189, 147, 249, 0.12)', borderWidth: 1.5, borderColor: COLORS.violet },
  btnGhost: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.28)' },
  btnText: { fontSize: 15, fontWeight: '900', textAlign: 'center', ...KEEP_ALL },
  btnTextCompact: { fontSize: 12.5 },
  btnTextDark: { color: COLORS.ink },
  btnTextViolet: { color: COLORS.violet },
  btnTextLight: { color: COLORS.text },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
