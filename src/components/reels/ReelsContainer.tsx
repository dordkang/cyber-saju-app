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
import { TodayOmenCard } from '../cards/TodayOmenCard';
import { DaewoonTimelineCard } from '../cards/DaewoonTimelineCard';
import { TodayMoneyCard } from '../cards/TodayMoneyCard';
import { TodayMbtiCard } from '../cards/TodayMbtiCard';
import { TodayCircuitCard } from '../cards/TodayCircuitCard';
import { ShamanChamberCard } from '../cards/ShamanChamberCard';
import { useLocale } from '../../locales';
import { CARDS_JA } from '../../locales/cards_ja';
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
const WEB_SNAP_ITEM = (
  IS_WEB
    ? {
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        height: '100%',
        maxHeight: '100%',
        width: '100%',
        overflow: 'hidden',
      }
    : null
) as unknown as ViewStyle | null;
const WEB_SNAP_LIST = (
  IS_WEB
    ? {
        scrollSnapType: 'y mandatory',
        overflowY: 'auto',
        height: '100%',
        width: '100%',
      }
    : null
) as unknown as ViewStyle | null;

const VIEWABILITY = { itemVisiblePercentThreshold: 70, minimumViewTime: 80 } as const;

export interface ReelsContainerProps extends ReelsActionHandlers {
  /** 모달이 열려 있으면 스크롤을 잠그고 배경을 어둡게 한다. */
  paused?: boolean;
  context: ReelsContext;
  targetIndex?: number | null;
  onTargetIndexHandled?: () => void;
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
  const { isJa } = useLocale();
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
        accessibilityLabel={people ? (isJa ? `${people.label} 変更` : `${people.label} 변경`) : (isJa ? '相手設定' : '상대 설정')}
        style={({ pressed }) => [styles.targetHit, pressed && styles.pressed]}
      >
        <View style={styles.targetCopy}>
          <Text style={styles.targetKicker}>
            {isJa ? CARDS_JA.c03_radar.scanTarget : '스캔 대상'}
          </Text>
          <Text style={styles.targetLabel}>
            {people?.label
              ? (isJa && people.label === '배우자' ? CARDS_JA.c03_radar.spouse : people.label)
              : (isJa ? CARDS_JA.c03_radar.spouse : '아직 대상을 정하지 않았어요')}
          </Text>
        </View>
        <View style={styles.changeTag}>
          <Text style={styles.changeTagText}>
            {isJa ? CARDS_JA.c03_radar.change : (people ? '변경 ✏️' : '+ 상대 변경')}
          </Text>
        </View>
      </Pressable>
      <Text style={styles.radarLine}>
        {isJa
          ? (people?.radarScore != null
              ? `浮気・別心指数 ${people.radarScore} · ${people.radarLevel === '안정' ? '安定' : people.radarLevel === '주의' ? '注意' : (people.radarLevel || '安定')}`
              : CARDS_JA.c03_radar.status)
          : (people
              ? `딴마음 지수 ${people.radarScore ?? '—'} · ${people.radarLevel ?? '대기'}`
              : '대상을 정하면 속마음 레이더가 바로 돌아갑니다.')}
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
  isJa = false,
}: {
  meta: ReelSectionMeta;
  height: number;
  active: boolean;
  body: string;
  cta: string;
  onPress?: () => void;
  extra?: React.ReactNode;
  isJa?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const accent = accentOf(meta);

  const handlePress = () => {
    if (!active) return;
    void playHaptic('tap');
    onPress?.();
  };

  const cardJa = useMemo(() => {
    if (!isJa) return null;
    if (meta.id === 'life') return CARDS_JA.c02_daewoon;
    if (meta.id === 'people') return CARDS_JA.c03_radar;
    if (meta.id === 'celebrity') return CARDS_JA.c05_resonance;
    if (meta.id === 'chamber') return CARDS_JA.c08_settings;
    return null;
  }, [isJa, meta.id]);

  const titleLabel = cardJa?.title ?? meta.title;
  const subtitleLabel = cardJa?.subtitle ?? meta.subtitle;

  return (
    <View
      style={[styles.page, WEB_SNAP_ITEM, { height }]}
      pointerEvents={active ? 'auto' : 'none'}
      {...({ className: 'w-full h-full snap-start snap-always overflow-hidden' } as any)}
    >
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
          { paddingTop: Math.max(insets.top, 44) + 48, paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <View>
          <Text style={styles.peekTitle}>{titleLabel}</Text>
          <Text style={styles.peekSubtitle}>{subtitleLabel}</Text>
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

function peekCopy(meta: ReelSectionMeta, context: ReelsContext, isJa: boolean = false): { body: string; cta: string } {
  switch (meta.id) {
    case 'life': {
      let lifeBody = '';
      if (isJa) {
        if (context.life) {
          const ageMatch = context.life.currentAgeLabel?.match(/\d+/) || [''];
          const ageRangeMatch = context.life.ageLabel?.match(/(\d+)\D+(\d+)/);
          const age = ageMatch[0] || '40';
          const start = ageRangeMatch ? ageRangeMatch[1] : '39';
          const end = ageRangeMatch ? ageRangeMatch[2] : '48';
          const ganji = context.life.ganji || '';
          const currentAgeStr = CARDS_JA.c02_daewoon.currentAge
            .replace('{age}', age)
            .replace('{start}', start)
            .replace('{end}', end)
            .replace('{ganji}', ganji);
          const analysisText =
            context.life.theme && !/[\uac00-\ud7a3]/.test(context.life.theme)
              ? context.life.theme
              : CARDS_JA.c02_daewoon.analysis;
          lifeBody = `${currentAgeStr}\n${analysisText}`;
        } else {
          lifeBody = `${CARDS_JA.c02_daewoon.currentAge.replace('{age}', '40').replace('{start}', '39').replace('{end}', '48').replace('{ganji}', '丁未')}\n${CARDS_JA.c02_daewoon.analysis}`;
        }
      } else {
        lifeBody = context.life
          ? `${context.life.currentAgeLabel ? `${context.life.currentAgeLabel} · ` : ''}${context.life.ageLabel} · ${context.life.ganji}\n${context.life.theme}`
          : '생년월일과 성별을 입력하면 지금 어느 파도 위에 있는지 알려 드려요.';
      }
      return {
        body: lifeBody,
        cta: isJa ? CARDS_JA.c02_daewoon.btn : '10년 대운 전체보기',
      };
    }
    case 'people':
      return {
        body: '',
        cta: context.people ? (isJa ? CARDS_JA.c03_radar.btn : '정밀 분석 리포트') : (isJa ? '対象を設定してスキャン' : '대상 설정하고 스캔'),
      };
    case 'money':
      return {
        body: context.money
          ? `${context.money.headline}\n${isJa ? '流入' : '유입'} ${context.money.inflowPower}% (${context.money.inflowLabel}) · ${isJa ? '漏洩' : '누수'} ${context.money.outflowRisk}% (${context.money.outflowLabel})\n[${context.money.modeBadge}]`
          : (isJa ? '四柱推命と今日の日辰で金運の潮流を読み解きます。' : '사주와 오늘 일진으로 돈의 흐름을 읽어요.'),
        cta: isJa ? '金運エンジン深層分析' : '돈 버는 엔진 심층 분석 보기',
      };
    case 'celebrity':
      return {
        body: isJa ? CARDS_JA.c05_resonance.descBox : '일간과 최다 오행이 겹치는 사람을 로컬 명단에서 고릅니다. 서버로 나가지 않아요.',
        cta: isJa ? CARDS_JA.c05_resonance.btn : '유명인 매칭 열기',
      };
    case 'mbti':
      return {
        body: context.mbti
          ? `${isJa ? '先天' : '선천'} ${context.mbti.innate} → ${isJa ? '仮面' : '가면'} ${context.mbti.actual} · ${isJa ? '一致' : '일치'} ${context.mbti.syncRate}% · ${isJa ? '漏洩' : '누수'} ${context.mbti.leakage}%`
          : (isJa ? '現実で使っているタイプを選ぶと、四柱コアとのギャップが数字で出ます。' : '현실에서 쓰는 유형을 고르면, 사주 코어와의 간극이 숫자로 뜹니다.'),
        cta: isJa ? '🎭 現実MBTI(社会的仮面)を変更する' : '🎭 내 현실 MBTI(사회생활 가면) 변경하기',
      };
    case 'circuit':
      return {
        body: isJa ? '生まれ持った最強の武器と最大の弱点を突き、現実の補強策を処方します。' : '타고난 최강의 무기와 가장 치명적인 아킬레스건을 짚고, 현실의 보완책을 처방합니다.',
        cta: isJa ? '欠乏突破の実戦処方を見る' : '결핍 보완 실전 비책 보기',
      };
    case 'chamber':
      return {
        body: isJa
          ? `${CARDS_JA.c08_settings.currentVoiceTitle}\n${CARDS_JA.c08_settings.currentVoiceDesc}`
          : (context.personaLabel
              ? `지금 말투 · ${context.personaLabel}\n프로필 재설정, 로컬 백업, 배경음은 설정에서 다룹니다.`
              : '도사 말투와 기기 설정은 여기서 바꿉니다.'),
        cta: isJa ? CARDS_JA.c08_settings.openSettingsBtn : '설정 열기',
      };
    default:
      return { body: meta.subtitle, cta: isJa ? '次へ' : '계속' };
  }
}

export const ReelsContainer: React.FC<ReelsContainerProps> = ({
  paused = false,
  context,
  targetIndex,
  onTargetIndexHandled,
  ...actions
}) => {
  const insets = useSafeAreaInsets();
  const { isJa } = useLocale();
  const listRef = useRef<FlatList<ReelSectionMeta>>(null);
  const activeRef = useRef(0);
  const skipHapticRef = useRef(true);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const scrollToSectionIndex = useCallback((targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= REEL_SECTIONS.length) return;
    try {
      listRef.current?.scrollToIndex({ index: targetIdx, animated: true });
    } catch {
      if (pageHeight > 0) {
        (listRef.current as any)?.scrollToOffset?.({ offset: targetIdx * pageHeight, animated: true });
      }
    }
    commitIndex(targetIdx);
  }, [pageHeight, commitIndex]);

  useEffect(() => {
    if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < REEL_SECTIONS.length) {
      scrollToSectionIndex(targetIndex);
      onTargetIndexHandled?.();
    }
  }, [targetIndex, scrollToSectionIndex, onTargetIndexHandled]);

  useEffect(() => {
    const handleScrollEvent = (e: any) => {
      const idx = typeof e.detail === 'number' ? e.detail : e.detail?.index;
      if (typeof idx === 'number' && idx >= 0 && idx < REEL_SECTIONS.length) {
        scrollToSectionIndex(idx);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cyber_saju_scroll_to_section', handleScrollEvent as EventListener);
      return () => {
        window.removeEventListener('cyber_saju_scroll_to_section', handleScrollEvent as EventListener);
      };
    }
  }, [scrollToSectionIndex]);

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
        <View
          style={[styles.page, WEB_SNAP_ITEM, { height: pageHeight }]}
          {...({ className: 'w-full h-full snap-start snap-always overflow-hidden' } as any)}
        >
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

    if (item.id === 'life') {
      return (
        <View
          style={[styles.page, WEB_SNAP_ITEM, { height: pageHeight }]}
          {...({ className: 'w-full h-full snap-start snap-always overflow-hidden' } as any)}
        >
          <DaewoonTimelineCard
            active={active}
            height={pageHeight}
            userProfile={context.userProfile ?? context.saju}
            saju={context.saju}
            onOpenTimeline={actions.onOpenTimeline}
            lang={isJa ? 'jp' : 'kr'}
          />
        </View>
      );
    }

    if (item.id === 'money') {
      return (
        <View
          style={[styles.page, WEB_SNAP_ITEM, { height: pageHeight }]}
          {...({ className: 'w-full h-full snap-start snap-always overflow-hidden' } as any)}
        >
          <TodayMoneyCard
            data={context.money}
            active={active}
            height={pageHeight}
            saju={context.saju}
          />
        </View>
      );
    }

    if (item.id === 'mbti') {
      return (
        <View
          style={[styles.page, WEB_SNAP_ITEM, { height: pageHeight }]}
          {...({ className: 'w-full h-full snap-start snap-always overflow-hidden' } as any)}
        >
          <TodayMbtiCard
            data={context.mbti}
            active={active}
            height={pageHeight}
            saju={context.saju}
            onOpenMbti={actions.onOpenMbti}
          />
        </View>
      );
    }

    if (item.id === 'circuit') {
      return (
        <View
          style={[styles.page, WEB_SNAP_ITEM, { height: pageHeight }]}
          {...({ className: 'w-full h-full snap-start snap-always overflow-hidden' } as any)}
        >
          <TodayCircuitCard
            elementsRatio={context.elementsRatio}
            active={active}
            height={pageHeight}
            saju={context.saju}
          />
        </View>
      );
    }

    if (item.id === 'chamber') {
      return (
        <View
          style={[styles.page, WEB_SNAP_ITEM, { height: pageHeight }]}
          {...({ className: 'w-full h-full snap-start snap-always overflow-hidden' } as any)}
        >
          <ShamanChamberCard
            active={active}
            height={pageHeight}
            saju={context.saju}
          />
        </View>
      );
    }

    const peek = peekCopy(item, context, isJa);
    const extra =
      item.id === 'people' ? (
        <PeopleTargetBlock
          people={context.people}
          active={active}
          onChangeTarget={actions.onOpenPartner}
        />
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
        isJa={isJa}
      />
    );
  };

  const aura = ELEMENT_AURA[context.omen.element];
  const currentMeta = REEL_SECTIONS[activeIndex] || REEL_SECTIONS[0];
  const activeChipLabel = useMemo(() => {
    if (!isJa) return `${currentMeta.no} · ${currentMeta.kicker}`;
    switch (currentMeta.id) {
      case 'omen': return '01 · 今日の予兆';
      case 'life': return CARDS_JA.c02_daewoon.tab;
      case 'people': return CARDS_JA.c03_radar.tab;
      case 'money': return '04 · 金運の流れ';
      case 'celebrity': return CARDS_JA.c05_resonance.tab;
      case 'mbti': return '06 · ペルソナ戦術室';
      case 'circuit': return '07 · 五行カウンセリング';
      case 'chamber': return '08 · 密室相談所';
      default: return `${currentMeta.no} · ${currentMeta.kicker}`;
    }
  }, [isJa, currentMeta]);

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
            extraData={`${activeIndex}:${paused}`}
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
            style={[styles.pagerList, WEB_SNAP_LIST]}
            {...({ className: 'w-full h-full snap-y snap-mandatory overflow-y-auto' } as any)}
          />
        )}
      </View>

      {paused && <View pointerEvents="none" style={styles.dim} />}

      {/* 아이폰 다이내믹 아일랜드(카메라) 간섭 방지 헤더 재배치: 좌/우 완전 양분 레이아웃 */}
      <View
        pointerEvents="box-none"
        style={[
          styles.topHeaderBar,
          {
            paddingTop: Math.max(insets.top, 44),
          },
        ]}
      >
        {/* [좌측 영역]: [ 01 · 今日の予兆 ] 섹션 칩 뱃지만 단독 배치 */}
        <View style={[styles.headerSectionChip, { borderColor: accentOf(currentMeta) }]}>
          <Text style={[styles.headerSectionChipText, { color: accentOf(currentMeta) }]}>
            {activeChipLabel}
          </Text>
        </View>

        {/* [중앙 영역]: 100% 공백 유지 (카메라 펀치홀 / 다이내믹 아일랜드 통과 구역) */}
        <View style={styles.headerCenterSpace} />

        {/* [우측 영역]: [ 🔊 / 🔇 ] 음소거 토글 아이콘 + [ ⚙️ ] 설정 톱니바퀴 아이콘 (간격 gap-3) */}
        <View style={styles.headerRightGroup}>
          <Pressable
            onPress={() => railTap(() => actions.onToggleSound?.())}
            style={({ pressed }) => [
              styles.headerIconBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={context.soundOn ? (isJa ? '音声 OFF' : '소리 끄기') : (isJa ? '音声 ON' : '소리 켜기')}
          >
            <Text style={styles.headerIconText}>{context.soundOn ? '🔊' : '🔇'}</Text>
          </Pressable>
          <Pressable
            onPress={() => railTap(() => actions.onSettingsPress?.())}
            style={({ pressed }) => [
              styles.headerIconBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isJa ? '設定' : '설정'}
          >
            <Text style={styles.headerIconText}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      {/* 카드 스크롤 인디케이터 (본문 터치/가림 없는 초슬림 점선) */}
      <View
        pointerEvents="none"
        style={[
          styles.indicatorDots,
          { top: Math.max(insets.top, 44) + 48 },
        ]}
        accessibilityLabel={`${activeIndex + 1}번째 카드`}
      >
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
    </View>
  );
};

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
  pager: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' },
  pagerList: { flex: 1, width: '100%', height: '100%' },
  page: { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: REEL_PALETTE.obsidian },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  peekBody: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    maxWidth: 420,
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
  topHeaderBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 99,
  },
  headerSectionChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(11, 14, 20, 0.75)',
    ...(IS_WEB
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as unknown as ViewStyle)
      : null),
  },
  headerSectionChipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    ...KEEP_ALL,
  },
  headerCenterSpace: {
    flex: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11, 14, 20, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(IS_WEB ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as unknown as ViewStyle) : null),
  },
  headerIconText: {
    fontSize: 15,
  },
  indicatorDots: {
    position: 'absolute',
    right: 8,
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
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
});
