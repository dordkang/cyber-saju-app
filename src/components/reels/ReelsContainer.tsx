import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
  type ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ElementCircuit } from '../ElementCircuit';
import { TodayOmenCard } from '../cards/TodayOmenCard';
import { TodayMoneyCard } from '../cards/TodayMoneyCard';
import {
  ELEMENT_AURA,
  REEL_ACCENT_HEX,
  REEL_PALETTE,
  REEL_SECTION_COUNT,
  REEL_SECTIONS,
} from '../../types/reels';
import type {
  ReelSectionMeta,
  ReelsActionHandlers,
  ReelsContext,
  ReelsPeoplePeek,
} from '../../types/reels';
import { playHaptic } from './haptics';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
const GLASS = (
  IS_WEB ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : null
) as unknown as ViewStyle | null;
const WEB_SNAP_ITEM = (IS_WEB ? { scrollSnapAlign: 'start', scrollSnapStop: 'always' } : null) as unknown as ViewStyle | null;
const WEB_SNAP_LIST = (IS_WEB ? { scrollSnapType: 'y mandatory' } : null) as unknown as ViewStyle | null;

const VIEWABILITY = { itemVisiblePercentThreshold: 70, minimumViewTime: 80 } as const;

export interface ReelsContainerProps extends ReelsActionHandlers {
  /** 모달이 열려 있으면 스크롤을 잠그고 배경을 어둡게 한다. */
  paused?: boolean;
  context: ReelsContext;
}

function accentOf(meta: ReelSectionMeta): string {
  return REEL_ACCENT_HEX[meta.accent];
}

function shareOmen(text: string): void {
  const payload = text.trim();
  if (!payload) return;
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const canShare = Boolean(nav && typeof (nav as { share?: unknown }).share === 'function');
  if (canShare) {
    void (nav as { share: (data: { title: string; text: string }) => Promise<void> })
      .share({ title: '오늘의 징조', text: payload })
      .catch(() => undefined);
    return;
  }
  const clipboard = nav?.clipboard;
  if (clipboard?.writeText) {
    clipboard.writeText(payload).then(
      () => Alert.alert('복사됨', '오늘의 징조를 클립보드에 담았어요.'),
      () => Alert.alert('공유', payload)
    );
    return;
  }
  Alert.alert('오늘의 징조', payload);
}

const PeopleTargetBlock = memo(function PeopleTargetBlock({
  people,
  active,
  onChangeTarget,
}: {
  people?: ReelsPeoplePeek | null;
  active: boolean;
  onChangeTarget?: () => void;
}) {
  const handleChange = () => {
    if (!active) return;
    void playHaptic('tap');
    onChangeTarget?.();
  };

  return (
    <View>
      <Pressable
        onPress={handleChange}
        accessibilityRole="button"
        accessibilityLabel={people ? `${people.label} 변경` : '상대 설정'}
        style={({ pressed }) => [styles.targetHit, pressed && styles.pressed]}
      >
        <View style={styles.targetCopy}>
          <Text style={styles.targetKicker}>스캔 대상</Text>
          <Text style={styles.targetLabel}>{people?.label ?? '아직 대상을 정하지 않았어요'}</Text>
        </View>
        <View style={styles.changeTag}>
          <Text style={styles.changeTagText}>{people ? '변경 ✏️' : '+ 상대 변경'}</Text>
        </View>
      </Pressable>
      <Text style={styles.radarLine}>
        {people
          ? `딴마음 지수 ${people.radarScore ?? '—'} · ${people.radarLevel ?? '대기'}`
          : '대상을 정하면 속마음 레이더가 바로 돌아갑니다.'}
      </Text>
    </View>
  );
});

const PeekCard = memo(function PeekCard({
  meta,
  height,
  active,
  body,
  cta,
  onPress,
  extra,
}: {
  meta: ReelSectionMeta;
  height: number;
  active: boolean;
  body: string;
  cta: string;
  onPress?: () => void;
  extra?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const accent = accentOf(meta);

  const handlePress = () => {
    if (!active) return;
    void playHaptic('tap');
    onPress?.();
  };

  return (
    <View style={[styles.page, WEB_SNAP_ITEM, { height }]} pointerEvents={active ? 'auto' : 'none'}>
      <LinearGradient
        colors={[REEL_PALETTE.obsidian, `${accent}33`, REEL_PALETTE.obsidian]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.peekBody,
          { paddingTop: insets.top + 18, paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <View>
          <View style={[styles.chip, { borderColor: accent }]}>
            <Text style={[styles.chipText, { color: accent }]}>
              {meta.no} · {meta.kicker}
            </Text>
          </View>
          <Text style={styles.peekTitle}>{meta.title}</Text>
          <Text style={styles.peekSubtitle}>{meta.subtitle}</Text>
        </View>
        <View style={[styles.glass, GLASS, { borderColor: `${accent}59` }]}>
          {!!body && <Text style={styles.peekBodyText}>{body}</Text>}
          {extra}
        </View>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={cta}
          style={({ pressed }) => [styles.cta, { backgroundColor: accent }, pressed && styles.pressed]}
        >
          <Text style={[styles.ctaText, meta.accent === 'crimson' ? styles.ctaInk : styles.ctaInkDark]}>{cta}</Text>
        </Pressable>
      </View>
    </View>
  );
});

function peekCopy(meta: ReelSectionMeta, context: ReelsContext): { body: string; cta: string } {
  switch (meta.id) {
    case 'life':
      return {
        body: context.life
          ? `${context.life.currentAgeLabel ? `${context.life.currentAgeLabel} · ` : ''}${context.life.ageLabel} · ${context.life.ganji}\n${context.life.theme}`
          : '생년월일과 성별을 입력하면 지금 어느 파도 위에 있는지 알려 드려요.',
        cta: '10년 대운 전체보기',
      };
    case 'people':
      return {
        body: '',
        cta: context.people ? '정밀 분석 리포트' : '대상 설정하고 스캔',
      };
    case 'money':
      return {
        body: context.money
          ? `${context.money.headline}\n유입 ${context.money.inflowPower}% (${context.money.inflowLabel}) · 누수 ${context.money.outflowRisk}% (${context.money.outflowLabel})\n[${context.money.modeBadge}]`
          : '사주와 오늘 일진으로 돈의 흐름을 읽어요.',
        cta: '돈 버는 엔진 심층 분석 보기',
      };
    case 'celebrity':
      return {
        body: '일간과 최다 오행이 겹치는 사람을 로컬 명단에서 고릅니다. 서버로 나가지 않아요.',
        cta: '유명인 매칭 열기',
      };
    case 'mbti':
      return {
        body: context.mbti
          ? `선천 ${context.mbti.innate} → 가면 ${context.mbti.actual} · 일치 ${context.mbti.syncRate}% · 누수 ${context.mbti.leakage}%`
          : '현실에서 쓰는 유형을 고르면, 사주 코어와의 간극이 숫자로 뜹니다.',
        cta: '가면 고르기',
      };
    case 'circuit':
      return {
        body: '원국 여덟 글자의 오행 비중입니다. 0%는 결핍, 과다는 치우침입니다.',
        cta: '오늘 기운 새기기',
      };
    case 'chamber':
      return {
        body: context.personaLabel
          ? `지금 말투 · ${context.personaLabel}\n프로필 재설정, 로컬 백업, 배경음은 설정에서 다룹니다.`
          : '도사 말투와 기기 설정은 여기서 바꿉니다.',
        cta: '설정 열기',
      };
    default:
      return { body: meta.subtitle, cta: '계속' };
  }
}

export const ReelsContainer: React.FC<ReelsContainerProps> = ({ paused = false, context, ...actions }) => {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ReelSectionMeta>>(null);
  const activeRef = useRef(0);
  const skipHapticRef = useRef(true);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [resonance, setResonance] = useState(0);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: pageHeight, offset: pageHeight * index, index }),
    [pageHeight]
  );

  const commitIndex = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(REEL_SECTION_COUNT - 1, next));
    if (clamped === activeRef.current) return;
    activeRef.current = clamped;
    setActiveIndex(clamped);
    if (skipHapticRef.current) {
      skipHapticRef.current = false;
      return;
    }
    void playHaptic('snap');
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.index;
    if (typeof first === 'number') commitIndex(first);
  }).current;

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageHeight <= 0) return;
    commitIndex(Math.round(e.nativeEvent.contentOffset.y / pageHeight));
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    if (next > 0 && next !== pageHeight) setPageHeight(next);
  };

  useEffect(() => {
    skipHapticRef.current = true;
  }, [pageHeight]);

  const omenShareText = useMemo(() => {
    const o = context.omen;
    return [`오늘의 징조 ${o.dayPillarText}`, o.elementName, o.keyword, o.fortuneText].filter(Boolean).join('\n');
  }, [context.omen]);

  const railTap = (fn: () => void) => {
    void playHaptic('tap');
    fn();
  };

  const renderItem = ({ item, index }: { item: ReelSectionMeta; index: number }) => {
    const active = index === activeIndex && !paused;
    if (item.id === 'omen') {
      return (
        <View style={WEB_SNAP_ITEM}>
          <TodayOmenCard
            data={context.omen}
            active={active}
            height={pageHeight}
            onOpenDaily={actions.onOpenDailyCard}
            isBatteryFull={context.batteryLevel === 100}
            saju={context.saju}
            partner={context.partnerProfile}
            partnerSaju={context.partnerSaju}
            onOpenPartner={actions.onOpenPartner}
          />
        </View>
      );
    }

    if (item.id === 'money') {
      return (
        <View style={WEB_SNAP_ITEM}>
          <TodayMoneyCard
            data={context.money}
            active={active}
            height={pageHeight}
            saju={context.saju}
          />
        </View>
      );
    }

    const peek = peekCopy(item, context);
    const extra =
      item.id === 'people' ? (
        <PeopleTargetBlock
          people={context.people}
          active={active}
          onChangeTarget={actions.onOpenPartner}
        />
      ) : item.id === 'circuit' && context.elementsRatio ? (
        <View style={styles.circuitWrap}>
          <ElementCircuit elementsRatio={context.elementsRatio} />
        </View>
      ) : null;

    const onPress = () => {
      switch (item.id) {
        case 'life':
          actions.onOpenTimeline?.();
          break;
        case 'people':
          if (context.people) actions.onOpenReport?.();
          else actions.onOpenPartner?.();
          break;
        case 'money':
          Alert.alert('돈의 흐름', peek.body);
          break;
        case 'circuit':
          actions.onOpenDailyCard?.();
          break;
        case 'celebrity':
          actions.onOpenCelebrity?.();
          break;
        case 'mbti':
          actions.onOpenMbti?.();
          break;
        case 'chamber':
          actions.onSettingsPress?.();
          break;
        default:
          break;
      }
    };

    return (
      <PeekCard
        meta={item}
        height={pageHeight}
        active={active}
        body={peek.body}
        cta={peek.cta}
        onPress={onPress}
        extra={extra}
      />
    );
  };

  const aura = ELEMENT_AURA[context.omen.element];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.pager} onLayout={handleLayout}>
        {pageHeight > 0 && (
          <FlatList
            ref={listRef}
            data={REEL_SECTIONS}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            extraData={`${activeIndex}:${paused}:${resonance}`}
            getItemLayout={getItemLayout}
            pagingEnabled
            snapToInterval={pageHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            scrollEnabled={!paused}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            removeClippedSubviews={!IS_WEB}
            viewabilityConfig={VIEWABILITY}
            onViewableItemsChanged={onViewableItemsChanged}
            onMomentumScrollEnd={handleScrollEnd}
            key={pageHeight}
            style={WEB_SNAP_LIST}
          />
        )}
      </View>

      {paused && <View pointerEvents="none" style={styles.dim} />}

      <View pointerEvents="box-none" style={[styles.chrome, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.dots} accessibilityLabel={`${activeIndex + 1}번째 카드`}>
          {REEL_SECTIONS.map((section, i) => (
            <View
              key={section.id}
              style={[
                styles.dot,
                i === activeIndex && [styles.dotActive, { backgroundColor: accentOf(section) }],
              ]}
            />
          ))}
        </View>

        <View style={[styles.rail, { marginBottom: Math.max(insets.bottom, 8) }]}>
          <RailButton
            icon="✦"
            label={resonance > 0 ? String(resonance) : '공명'}
            onPress={() =>
              railTap(() => {
                setResonance((n) => n + 1);
              })
            }
          />
          <RailButton icon="↗" label="공유" onPress={() => railTap(() => shareOmen(omenShareText))} />
          <RailButton
            icon={context.soundOn ? '🔊' : '🔇'}
            label={context.soundOn ? '소리 켜짐' : '소리'}
            onPress={() => railTap(() => actions.onToggleSound?.())}
          />
          <RailButton icon="⚙️" label="설정" onPress={() => railTap(() => actions.onSettingsPress?.())} />
          <View style={[styles.railAvatar, { borderColor: aura.core }]}>
            <Text style={[styles.railAvatarText, { color: aura.core }]}>{aura.hanja}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const RailButton = memo(function RailButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.railBtn, GLASS, pressed && styles.pressed]}
    >
      <View style={styles.railIconWrap}>
        <Text style={styles.railIcon}>{icon}</Text>
      </View>
      <Text style={styles.railLabel}>{label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: REEL_PALETTE.obsidian,
    overflow: 'hidden',
  },
  pager: { flex: 1 },
  page: { width: '100%', overflow: 'hidden', backgroundColor: REEL_PALETTE.obsidian },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  peekBody: {
    flex: 1,
    paddingHorizontal: 22,
    paddingRight: 86,
    justifyContent: 'space-between',
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(11, 14, 20, 0.55)',
  },
  chipText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, ...KEEP_ALL },
  peekTitle: {
    marginTop: 14,
    color: REEL_PALETTE.text,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    ...KEEP_ALL,
  },
  peekSubtitle: { marginTop: 8, color: '#C9D3E0', fontSize: 14, lineHeight: 21, ...KEEP_ALL },
  glass: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(11, 14, 20, 0.62)',
    borderWidth: 1,
    gap: 8,
  },
  peekBodyText: { color: REEL_PALETTE.text, fontSize: 15, lineHeight: 23, fontWeight: '700', ...KEEP_ALL },
  circuitWrap: { marginTop: 4 },
  targetHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  targetCopy: { flex: 1, gap: 2 },
  targetKicker: { color: REEL_PALETTE.crimson, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  targetLabel: { color: REEL_PALETTE.text, fontSize: 18, fontWeight: '900', ...KEEP_ALL },
  changeTag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.55)',
    backgroundColor: 'rgba(255, 51, 102, 0.12)',
  },
  changeTagText: { color: REEL_PALETTE.crimson, fontSize: 11, fontWeight: '800' },
  radarLine: { marginTop: 10, color: '#C9D3E0', fontSize: 14, lineHeight: 21, fontWeight: '700', ...KEEP_ALL },
  cta: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 15, fontWeight: '900', ...KEEP_ALL },
  ctaInk: { color: REEL_PALETTE.text },
  ctaInkDark: { color: REEL_PALETTE.ink },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },

  chrome: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 78,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingRight: 8,
    zIndex: 8,
  },
  dots: {
    alignItems: 'center',
    gap: 7,
    marginRight: 10,
    marginTop: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  dotActive: {
    height: 16,
    borderRadius: 3,
  },
  rail: {
    alignItems: 'center',
    gap: 12,
    marginRight: 2,
  },
  railBtn: {
    width: 54,
    alignItems: 'center',
    gap: 3,
  },
  railIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 14, 20, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  railIcon: { fontSize: 18, color: REEL_PALETTE.text },
  railLabel: { color: REEL_PALETTE.text, fontSize: 10, fontWeight: '800', ...KEEP_ALL },
  railAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 14, 20, 0.7)',
  },
  railAvatarText: { fontSize: 18, fontWeight: '900' },
});
