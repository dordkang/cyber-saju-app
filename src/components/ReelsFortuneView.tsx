import React, { createElement, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_REEL_VIDEO, getElementReelVideo } from '../constants/videoAssets';
import { ELEMENT_SHORT_KR, LUCKY_ITEM_BY_ELEMENT, buildReelsContent } from '../engine/reelsContent';
import type { FiveElement } from '../engine/types';
import { startAmbient, stopAmbient } from '../utils/ambientSynth';

const IS_WEB = Platform.OS === 'web';
const FILM_BLACK = '#070707';
const FILM_HOLE = 'rgba(238, 230, 214, 0.78)';
const MONO_FONT = Platform.select({
  ios: 'Menlo',
  web: "'SF Mono', Menlo, Consolas, 'Courier New', monospace",
  default: 'monospace',
});
const HANDWRITING_FONT = Platform.select({
  web: "'Nanum Pen Script', 'Gaegu', 'Segoe Print', cursive",
  default: undefined,
});

/** 한글 단어 중간에서 줄이 끊기지 않도록 한다. 웹 전용 속성이라 타입을 우회한다. */
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
/** 다크 글래스모피즘: 웹에서는 배경 블러까지 적용한다. */
const GLASS_BLUR = (
  IS_WEB ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : null
) as unknown as ViewStyle | null;

const FRAME_SIDE = 22;
const FRAME_VERTICAL = 12;
const FRAME_RADIUS = 28;
const HOLE_W = 8;
const HOLE_H = 14;
const HOLE_PITCH = 27;
const RAIL_SIZE = 46;

export type ReelsElement = FiveElement;

const ELEMENT_CAPTION: Record<ReelsElement, { top: string; bottom: string }> = {
  Wood: { top: '새로 시작하는 기운이 올라오는 날', bottom: '작은 시도 하나가 오늘의 포인트예요' },
  Fire: { top: '존재감이 한껏 켜지는 날이에요', bottom: '망설이던 말은 오늘 꺼내 보세요' },
  Earth: { top: '차분히 중심을 잡는 안정의 날', bottom: '서두르지 않아도 흐름은 내 편이에요' },
  Metal: { top: '결단이 또렷해지는 날이에요', bottom: '정리할 건 정리하고 가볍게 가요' },
  Water: { top: '직감과 감성이 깊어지는 날이에요', bottom: '흐름에 몸을 맡기면 길이 보여요' },
};

// ───────────────────────── 웹 전용 에셋(손글씨 폰트, 필름 그레인 애니메이션) ─────────────────────────

const GRAIN_NODE_ID = 'cs-film-grain';
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.4 0 0 0 -0.42'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN_STYLE = {
  backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN_SVG)}")`,
  backgroundSize: '180px 180px',
} as unknown as ViewStyle;

let webAssetsInstalled = false;

function installWebAssets(): void {
  if (!IS_WEB || webAssetsInstalled || typeof document === 'undefined') return;
  webAssetsInstalled = true;
  try {
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap';
    document.head.appendChild(font);

    const style = document.createElement('style');
    style.textContent =
      '@keyframes csGrainShift{0%{transform:translate(0,0)}20%{transform:translate(-4%,3%)}' +
      '40%{transform:translate(3%,-4%)}60%{transform:translate(-3%,-2%)}80%{transform:translate(4%,2%)}100%{transform:translate(0,0)}}' +
      `#${GRAIN_NODE_ID}{animation:csGrainShift .9s steps(5) infinite}`;
    document.head.appendChild(style);
  } catch {
    // 폰트·애니메이션은 꾸밈 요소라 실패해도 화면은 그대로 동작한다.
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 글자 사이에 줄바꿈을 넣어 위에서 아래로 흐르는 세로 문구로 만든다. */
function toVertical(text: string): string {
  return Array.from(text.trim()).join('\n');
}

// ───────────────────────── 타임코드 / 파형 (리렌더 범위를 좁히기 위해 분리) ─────────────────────────

const Timecode = memo(function Timecode() {
  const [text, setText] = useState(() => formatClock(new Date()));
  useEffect(() => {
    const id = setInterval(() => setText(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Text style={styles.timecode} accessibilityLabel={`현재 시각 ${text}`}>
      {text}
    </Text>
  );
});

const BAR_COUNT = 22;

const Waveform = memo(function Waveform({ playing }: { playing: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setTick((t) => (t + 1) % 10000), 130);
    return () => clearInterval(id);
  }, [playing]);

  const heights = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => {
        if (!playing) return 3;
        const level = (Math.sin((i + tick) * 0.62) + Math.sin((i * 1.7 + tick) * 0.41) + 2) / 4;
        return 4 + Math.round(level * 18);
      }),
    [tick, playing]
  );

  return (
    <View style={styles.waveRow} importantForAccessibility="no" accessibilityElementsHidden>
      {heights.map((h, i) => (
        <View key={i} style={[styles.waveBar, { height: h }, !playing && styles.waveBarIdle]} />
      ))}
    </View>
  );
});

// ───────────────────────── 배경: 빈티지 필름 비디오 레이어 ─────────────────────────

const VIDEO_FILTER = 'sepia(0.22) saturate(1.08) contrast(1.05) brightness(0.92)';

const VideoBackdrop = memo(function VideoBackdrop({ element }: { element: ReelsElement }) {
  const requested = getElementReelVideo(element);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [readyUri, setReadyUri] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const active = failedUri === requested.uri ? DEFAULT_REEL_VIDEO : requested;

  // 브라우저가 자동재생을 막았거나 저전력 모드로 멈춘 경우, 첫 터치에서 다시 재생을 시도한다.
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return undefined;
    const resume = () => {
      const video = videoRef.current;
      if (video?.paused) video.play().catch(() => undefined);
    };
    document.addEventListener('pointerdown', resume, { passive: true });
    return () => document.removeEventListener('pointerdown', resume);
  }, []);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    // React의 muted 속성은 초기 렌더에서 DOM에 반영되지 않는 경우가 있어 직접 지정한다.
    el.muted = true;
    el.defaultMuted = true;
    el.play().catch(() => undefined);
  }, []);

  return (
    <View pointerEvents="none" style={[styles.fill, { backgroundColor: active.tint }]}>
      {IS_WEB &&
        createElement('video', {
          key: active.uri,
          ref: setVideoRef,
          src: active.uri,
          autoPlay: true,
          loop: true,
          muted: true,
          playsInline: true,
          preload: 'auto',
          disablePictureInPicture: true,
          tabIndex: -1,
          'aria-hidden': true,
          onCanPlay: () => setReadyUri(active.uri),
          onError: () => {
            if (active.uri !== DEFAULT_REEL_VIDEO.uri) setFailedUri(active.uri);
          },
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            filter: VIDEO_FILTER,
            opacity: readyUri === active.uri ? 1 : 0,
            transition: 'opacity 900ms ease',
          },
        })}
    </View>
  );
});

/** 위·아래만 살짝 눌러 자막과 타임코드를 읽히게 하고, 가운데 영상은 최대한 살린다. */
const VIGNETTE_STOPS = [
  { at: 0, alpha: 0.5 },
  { at: 0.3, alpha: 0.1 },
  { at: 0.58, alpha: 0.06 },
  { at: 1, alpha: 0.78 },
] as const;
const NATIVE_VIGNETTE_BANDS = 24;

const WEB_VIGNETTE_STYLE = {
  backgroundImage: `linear-gradient(to bottom, ${VIGNETTE_STOPS.map(
    (s) => `rgba(0, 0, 0, ${s.alpha}) ${s.at * 100}%`
  ).join(', ')})`,
} as unknown as ViewStyle;

function vignetteAlphaAt(position: number): number {
  for (let i = 1; i < VIGNETTE_STOPS.length; i += 1) {
    const prev = VIGNETTE_STOPS[i - 1];
    const next = VIGNETTE_STOPS[i];
    if (prev && next && position <= next.at) {
      const ratio = (position - prev.at) / (next.at - prev.at);
      return prev.alpha + (next.alpha - prev.alpha) * ratio;
    }
  }
  return VIGNETTE_STOPS[VIGNETTE_STOPS.length - 1]?.alpha ?? 0;
}

const NATIVE_BAND_ALPHAS = Array.from({ length: NATIVE_VIGNETTE_BANDS }, (_, i) =>
  vignetteAlphaAt((i + 0.5) / NATIVE_VIGNETTE_BANDS)
);

const VignetteOverlay = memo(function VignetteOverlay() {
  if (IS_WEB) {
    return <View pointerEvents="none" style={[styles.fill, WEB_VIGNETTE_STYLE]} />;
  }
  return (
    <View pointerEvents="none" style={styles.fill}>
      {NATIVE_BAND_ALPHAS.map((alpha, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: `rgba(0, 0, 0, ${alpha.toFixed(3)})` }} />
      ))}
    </View>
  );
});

const GrainOverlay = memo(function GrainOverlay() {
  if (!IS_WEB) return null;
  return <View pointerEvents="none" nativeID={GRAIN_NODE_ID} style={[styles.grain, GRAIN_STYLE]} />;
});

// ───────────────────────── 외곽 필름 프레임(둥근 창 + 스프로킷 홀) ─────────────────────────

const WEB_WINDOW_STYLE = {
  boxShadow: `0 0 0 9999px ${FILM_BLACK}`,
} as unknown as ViewStyle;

const SprocketColumn = memo(function SprocketColumn({ side, count }: { side: 'left' | 'right'; count: number }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.sprockets, side === 'left' ? { left: (FRAME_SIDE - HOLE_W) / 2 } : { right: (FRAME_SIDE - HOLE_W) / 2 }]}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.hole} />
      ))}
    </View>
  );
});

const FilmFrame = memo(function FilmFrame({ height }: { height: number }) {
  const holes = Math.max(6, Math.floor(height / HOLE_PITCH));
  return (
    <View pointerEvents="none" style={styles.fill}>
      {IS_WEB ? (
        <View style={[styles.filmWindow, WEB_WINDOW_STYLE]} />
      ) : (
        <>
          <View style={[styles.edge, { top: 0, left: 0, right: 0, height: FRAME_VERTICAL }]} />
          <View style={[styles.edge, { bottom: 0, left: 0, right: 0, height: FRAME_VERTICAL }]} />
          <View style={[styles.edge, { top: 0, bottom: 0, left: 0, width: FRAME_SIDE }]} />
          <View style={[styles.edge, { top: 0, bottom: 0, right: 0, width: FRAME_SIDE }]} />
          <View style={[styles.filmWindow, styles.filmWindowBorder]} />
        </>
      )}
      <SprocketColumn side="left" count={holes} />
      <SprocketColumn side="right" count={holes} />
    </View>
  );
});

// ───────────────────────── 레일 버튼 ─────────────────────────

interface RailButtonProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

const RailButton = memo(function RailButton({ icon, label, onPress }: RailButtonProps) {
  return (
    <View style={styles.railItem}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        style={({ pressed }) => [styles.railBtn, pressed && styles.pressed]}
      >
        <Text style={styles.railIcon}>{icon}</Text>
      </Pressable>
      <Text style={styles.railLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

// ───────────────────────── 릴스 페이지 ─────────────────────────

interface ReelPage {
  key: string;
  /** 우측 상단 굵은 제목. 예: 기록 01 */
  recordNo: string;
  /** 우측 상단 세로 손글씨 문구 */
  handwriting: string;
  /** 자막 상단의 작은 요약 줄 */
  meta: string;
  /** 자막 본문 (최대 2줄) */
  captions: string[];
}

const ReelPageView = memo(function ReelPageView({ page, height }: { page: ReelPage; height: number }) {
  return (
    <View style={[styles.page, { height }]}>
      <View style={styles.captionBox}>
        <Text style={styles.captionMeta} numberOfLines={1}>
          {page.meta}
        </Text>
        {page.captions.slice(0, 2).map((line, i) => (
          <Text key={`${page.key}-c${i}`} style={[styles.captionLine, i > 0 && styles.captionLineSub]} numberOfLines={2}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
});

// ───────────────────────── 메인 뷰 ─────────────────────────

export interface ReelsFortuneViewProps {
  /** 오행 테마. 생략하면 오늘 일진 천간의 오행을 사용한다. */
  element?: ReelsElement;
  /** 오늘의 오행 기운 이름. 예: "백금(白金)의 기운" */
  elementName?: string;
  /** 오늘의 일진 간지. 예: "丙子(병자)" */
  dayPillarText?: string;
  /** 오늘의 기운 키워드 */
  keyword?: string;
  /** 3단 점사 요약 또는 일일 운세 한 줄 */
  fortuneText?: string;
  /** 오늘의 행운 오브젝트/패션 아이템 */
  luckyItem?: string;
  luckyReason?: string;
  /** 촬영창 보조 라벨. 예: "#2 호스트 · 戊土 일간" */
  profileLabel?: string;
  onSettingsPress?: () => void;
  onTarotPress?: () => void;
  onMatchPress?: () => void;
  onSharePress?: () => void;
  /** 사주 대시보드(하단 시트) 열기. 전달하지 않으면 버튼을 숨긴다. */
  onOpenDashboard?: () => void;
}

export const ReelsFortuneView: React.FC<ReelsFortuneViewProps> = ({
  element,
  elementName,
  dayPillarText,
  keyword,
  fortuneText,
  luckyItem,
  luckyReason,
  profileLabel,
  onSettingsPress,
  onTarotPress,
  onMatchPress,
  onSharePress,
  onOpenDashboard,
}) => {
  const { height } = useWindowDimensions();
  const [pageHeight, setPageHeight] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    installWebAssets();
    return () => stopAmbient();
  }, []);

  const turnSoundOn = () => {
    if (startAmbient()) setSoundOn(true);
  };
  const toggleSound = () => {
    if (soundOn) {
      stopAmbient();
      setSoundOn(false);
    } else {
      turnSoundOn();
    }
  };

  // props가 비어 있어도 화면이 깨지지 않도록 오늘 일진 기준의 기본 문구로 채운다.
  const fallback = useMemo(() => buildReelsContent(null), []);
  const resolvedElement: ReelsElement = element ?? fallback.element;
  const caption = ELEMENT_CAPTION[resolvedElement] ?? ELEMENT_CAPTION.Wood;

  const pages = useMemo<ReelPage[]>(() => {
    const name = elementName ?? fallback.elementName;
    const mood = keyword ?? fallback.keyword;
    const fortune = fortuneText ?? fallback.fortuneText;
    const item = luckyItem ?? LUCKY_ITEM_BY_ELEMENT[resolvedElement];
    const reason = luckyReason ?? `${ELEMENT_SHORT_KR[resolvedElement]} 기운을 채워 줘요`;
    const pillar = dayPillarText ?? fallback.dayPillarText;
    return [
      {
        key: 'energy',
        recordNo: '기록 01',
        handwriting: '오늘 내가 두를 기운',
        meta: pillar
          ? `나의 ${ELEMENT_SHORT_KR[resolvedElement]} 기운 · 오늘의 일진 ${pillar}`
          : `나의 ${ELEMENT_SHORT_KR[resolvedElement]} 기운 · ${name}`,
        captions: [fortune],
      },
      {
        key: 'keyword',
        recordNo: '기록 02',
        handwriting: '오늘의 핵심 처세',
        meta: `오늘의 처세 · ${mood}`,
        captions: [caption.top, caption.bottom],
      },
      {
        key: 'fit',
        recordNo: '기록 03',
        handwriting: '오늘 챙길 행운의 물건',
        meta: `행운의 물건 · ${item}`,
        captions: [reason, '오늘은 이 물건 하나면 충분해요'],
      },
    ];
  }, [elementName, dayPillarText, keyword, fortuneText, luckyItem, luckyReason, resolvedElement, fallback, caption]);

  const current = pages[Math.min(pageIndex, pages.length - 1)] ?? pages[0];
  const handwritingSize = height < 700 ? 17 : 22;

  const handleLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    if (next > 0 && next !== pageHeight) setPageHeight(next);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageHeight <= 0) return;
    const index = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
    setPageIndex(Math.min(pages.length - 1, Math.max(0, index)));
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <VideoBackdrop element={resolvedElement} />
      <GrainOverlay />
      <VignetteOverlay />
      <FilmFrame height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        {/* 소리가 꺼져 있을 때 화면 어디를 눌러도 켜진다(브라우저는 터치 이후에만 소리를 허용한다). */}
        <Pressable
          style={styles.frame}
          onPress={soundOn ? undefined : turnSoundOn}
          accessible={false}
          focusable={false}
        >
          {/* 상단: 좌측 타임코드 / 우측 기록 번호 + 세로 손글씨 */}
          <View style={styles.topBar} pointerEvents="none">
            <View style={styles.topLeft}>
              <Timecode />
              {!!profileLabel && (
                <Text style={styles.profileLabel} numberOfLines={1}>
                  {profileLabel}
                </Text>
              )}
            </View>
            <View style={styles.topRight}>
              <Text style={styles.recordNo} numberOfLines={1}>
                {current?.recordNo}
              </Text>
              <Text
                style={[styles.handwriting, { fontSize: handwritingSize, lineHeight: handwritingSize * 1.08 }]}
                accessibilityLabel={current?.handwriting}
              >
                {toVertical(current?.handwriting ?? '')}
              </Text>
            </View>
          </View>

          {/* 상하 스와이프 세로 릴스 페이저: 자막 박스가 바닥에 붙는다 */}
          <View style={styles.pager} onLayout={handleLayout}>
            {pageHeight > 0 && (
              <ScrollView
                pagingEnabled
                snapToInterval={pageHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumEnd}
                disableIntervalMomentum
                bounces={false}
                overScrollMode="never"
              >
                {pages.map((page) => (
                  <ReelPageView key={page.key} page={page} height={pageHeight} />
                ))}
              </ScrollView>
            )}

            <View pointerEvents="none" style={styles.dots}>
              {pages.map((page, i) => (
                <View key={page.key} style={[styles.dot, i === pageIndex && styles.dotActive]} />
              ))}
            </View>
          </View>

          {/* 하단: 좌측 볼륨 버튼 / 중앙 파형 / 우측 대시보드 */}
          <View style={styles.audioBar}>
            <Pressable
              onPress={toggleSound}
              accessibilityRole="button"
              accessibilityLabel={soundOn ? '소리 끄기' : '소리 켜기'}
              hitSlop={8}
              style={({ pressed }) => [styles.volumeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.volumeIcon}>{soundOn ? '🔊' : '🔇'}</Text>
            </Pressable>

            <View pointerEvents="none" style={styles.waveCenter}>
              <Waveform playing={soundOn} />
              {!soundOn && <Text style={styles.waveHint}>화면을 터치하면 소리가 켜져요</Text>}
            </View>

            {onOpenDashboard ? (
              <Pressable
                onPress={onOpenDashboard}
                accessibilityRole="button"
                accessibilityLabel="사주 대시보드 열기"
                hitSlop={8}
                style={({ pressed }) => [styles.dashBtn, pressed && styles.pressed]}
              >
                <Text style={styles.dashBtnText}>⌃ 대시보드</Text>
              </Pressable>
            ) : (
              <View />
            )}
          </View>

          {/* 우측 세로 플로팅 레일 */}
          <View style={styles.rail}>
            <RailButton icon="⚙️" label="설정" onPress={onSettingsPress} />
            <RailButton icon="🃏" label="다시뽑기" onPress={onTarotPress} />
            <RailButton icon="⚡" label="궁합투시" onPress={onMatchPress} />
            <RailButton icon="↗️" label="결과공유" onPress={onSharePress} />
          </View>
        </Pressable>
      </SafeAreaView>
    </View>
  );
};

const GLASS_DARK = 'rgba(10, 8, 8, 0.5)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.2)';
const SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.7)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: FILM_BLACK,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  grain: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '120%',
    height: '120%',
    opacity: 0.16,
  },
  safe: { flex: 1 },
  frame: { flex: 1, paddingHorizontal: FRAME_SIDE + 14, paddingTop: FRAME_VERTICAL + 8 },

  filmWindow: {
    position: 'absolute',
    top: FRAME_VERTICAL,
    bottom: FRAME_VERTICAL,
    left: FRAME_SIDE,
    right: FRAME_SIDE,
    borderRadius: FRAME_RADIUS,
  },
  filmWindowBorder: { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  edge: { position: 'absolute', backgroundColor: FILM_BLACK },
  sprockets: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: HOLE_W,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 6,
  },
  hole: { width: HOLE_W, height: HOLE_H, borderRadius: 3, backgroundColor: FILM_HOLE },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  topLeft: { flexShrink: 1 },
  timecode: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: MONO_FONT,
    fontVariant: ['tabular-nums'],
    ...SHADOW,
  },
  profileLabel: {
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    ...KEEP_ALL,
    ...SHADOW,
  },
  topRight: { alignItems: 'center', minWidth: 64 },
  recordNo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'right',
    ...KEEP_ALL,
    ...SHADOW,
  },
  handwriting: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.92)',
    fontFamily: HANDWRITING_FONT,
    fontStyle: IS_WEB ? 'normal' : 'italic',
    textAlign: 'center',
    ...SHADOW,
  },

  pager: { flex: 1, overflow: 'hidden', marginTop: 8 },
  page: { justifyContent: 'flex-end', paddingRight: RAIL_SIZE + 14 },
  captionBox: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: GLASS_DARK,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    ...(GLASS_BLUR ?? {}),
  },
  captionMeta: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 5,
    ...KEEP_ALL,
  },
  captionLine: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', lineHeight: 22, ...KEEP_ALL },
  captionLineSub: { fontWeight: '500', color: 'rgba(255, 255, 255, 0.82)' },

  dots: {
    position: 'absolute',
    left: -8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 3, height: 12, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.28)' },
  dotActive: { backgroundColor: '#FFFFFF' },

  audioBar: {
    height: 52,
    marginTop: 4,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    ...(GLASS_BLUR ?? {}),
  },
  volumeIcon: { fontSize: 16 },
  waveCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveRow: { flexDirection: 'row', alignItems: 'center', height: 24 },
  waveBar: {
    width: 2.5,
    marginHorizontal: 1.2,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  waveBarIdle: { backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  waveHint: {
    marginTop: 3,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 10,
    fontWeight: '600',
    ...KEEP_ALL,
    ...SHADOW,
  },
  dashBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  dashBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.3, ...KEEP_ALL },

  rail: {
    position: 'absolute',
    right: FRAME_SIDE + 8,
    bottom: 78,
    alignItems: 'center',
    gap: 12,
  },
  railItem: { alignItems: 'center', minWidth: RAIL_SIZE + 10 },
  railBtn: {
    width: RAIL_SIZE,
    height: RAIL_SIZE,
    borderRadius: RAIL_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    ...(GLASS_BLUR ?? {}),
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  railIcon: { fontSize: 21 },
  railLabel: { marginTop: 3, color: '#FFFFFF', fontSize: 10, fontWeight: '700', ...KEEP_ALL, ...SHADOW },
});
