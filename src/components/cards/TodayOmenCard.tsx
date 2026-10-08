import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ELEMENT_AURA, REEL_PALETTE, REEL_SECTIONS } from '../../types/reels';
import type { TodayOmenData } from '../../types/reels';
import { playHaptic } from '../reels/haptics';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
const GLASS = (
  IS_WEB ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } : null
) as unknown as ViewStyle | null;

const META = REEL_SECTIONS[0];

export interface TodayOmenCardProps {
  data: TodayOmenData;
  /** 지금 화면에 보이는 카드일 때만 터치·애니메이션을 켠다. */
  active: boolean;
  height: number;
  onOpenDaily?: () => void;
}

function formatTodayLabel(now: Date): string {
  const week = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()] ?? '';
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}.${mm}.${dd} · ${week}요일`;
}

function splitGanji(raw: string): { hanja: string; reading: string } {
  const match = raw.match(/^(.+?)\((.+)\)$/);
  if (match?.[1] && match[2]) return { hanja: match[1], reading: match[2] };
  return { hanja: raw || '—', reading: '일진 계산 중' };
}

export const TodayOmenCard = memo(function TodayOmenCard({ data, active, height, onOpenDaily }: TodayOmenCardProps) {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0.35)).current;
  const aura = ELEMENT_AURA[data.element];
  const ganji = splitGanji(data.dayPillarText);
  const compact = height < 700;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0.35);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: !IS_WEB }),
        Animated.timing(pulse, { toValue: 0.35, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: !IS_WEB }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const handleDaily = () => {
    if (!active) return;
    void playHaptic('tap');
    onOpenDaily?.();
  };

  return (
    <View style={[styles.page, { height }]} pointerEvents={active ? 'auto' : 'none'}>
      <LinearGradient
        colors={[REEL_PALETTE.obsidian, aura.mist, REEL_PALETTE.obsidian]}
        locations={[0, 0.46, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(11,14,20,0.15)', 'rgba(11,14,20,0.82)']}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.body,
          {
            paddingTop: insets.top + 14,
            paddingBottom: Math.max(insets.bottom, 12) + 62,
          },
        ]}
      >
        <View>
          <View style={[styles.chip, { borderColor: aura.core }]}>
            <Text style={[styles.chipText, { color: aura.core }]}>
              {META?.no} · {META?.kicker}
            </Text>
          </View>
          <Text style={styles.date}>{formatTodayLabel(new Date())}</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>{META?.title}</Text>
          {!!data.profileLabel && !compact && <Text style={styles.profile}>{data.profileLabel}</Text>}
        </View>

        <View style={[styles.sigilWrap, compact && styles.sigilWrapCompact]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sigilGlow,
              compact && styles.sigilGlowCompact,
              {
                borderColor: aura.core,
                opacity: pulse,
                shadowColor: aura.core,
              },
            ]}
          />
          <View style={[styles.sigil, compact && styles.sigilCompact, { borderColor: aura.core }]}>
            <Text style={[styles.hanjaMark, { color: aura.core }]}>{aura.hanja}</Text>
            <Text style={[styles.ganji, compact && styles.ganjiCompact]}>{ganji.hanja}</Text>
            <Text style={styles.reading}>{ganji.reading}</Text>
            <Text style={[styles.elementName, { color: aura.core }]}>{data.elementName}</Text>
          </View>
        </View>

        <View style={[styles.glass, GLASS]}>
          <Text style={styles.keywordLabel}>오늘의 열쇠</Text>
          <Text style={styles.keyword}>{data.keyword}</Text>
          <Text style={styles.fortune} numberOfLines={compact ? 2 : 4}>
            {data.fortuneText}
          </Text>
          {!compact && (
            <>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>곁에 둘 물건</Text>
                <Text style={styles.itemValue}>{data.luckyItem}</Text>
              </View>
              <Text style={styles.itemReason}>{data.luckyReason}</Text>
            </>
          )}
        </View>

        <Pressable
          onPress={handleDaily}
          accessibilityRole="button"
          accessibilityLabel="오늘 기운 새기기"
          style={({ pressed }) => [
            styles.cta,
            { bottom: Math.max(insets.bottom, 10) + 6 },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.ctaText}>오늘 기운 새기기</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  page: {
    width: '100%',
    backgroundColor: REEL_PALETTE.obsidian,
    overflow: 'hidden',
  },
  body: {
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
  date: { marginTop: 12, color: REEL_PALETTE.muted, fontSize: 12, fontWeight: '700', ...KEEP_ALL },
  title: {
    marginTop: 8,
    color: REEL_PALETTE.text,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    ...KEEP_ALL,
  },
  titleCompact: { fontSize: 24, lineHeight: 30 },
  profile: { marginTop: 8, color: REEL_PALETTE.muted, fontSize: 13, fontWeight: '700', ...KEEP_ALL },
  sigilWrapCompact: { minHeight: 150 },
  sigilGlowCompact: { width: 168, height: 168, borderRadius: 84 },
  sigilCompact: { width: 148, height: 148, borderRadius: 74 },
  ganjiCompact: { fontSize: 32, lineHeight: 38 },
  sigilWrap: { alignItems: 'center', justifyContent: 'center', minHeight: 210 },
  sigilGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
  },
  sigil: {
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 14, 20, 0.72)',
  },
  hanjaMark: { fontSize: 13, fontWeight: '900', letterSpacing: 4, marginBottom: 2 },
  ganji: { color: REEL_PALETTE.text, fontSize: 42, fontWeight: '900', letterSpacing: 2, lineHeight: 50 },
  reading: { color: REEL_PALETTE.muted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  elementName: { marginTop: 8, fontSize: 12, fontWeight: '800', ...KEEP_ALL },
  glass: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(11, 14, 20, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.28)',
    gap: 4,
  },
  keywordLabel: { color: REEL_PALETTE.cyan, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  keyword: { color: REEL_PALETTE.text, fontSize: 20, fontWeight: '900', ...KEEP_ALL },
  fortune: { marginTop: 6, color: '#D5DEEA', fontSize: 14, lineHeight: 22, ...KEEP_ALL },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, gap: 8 },
  itemLabel: { color: REEL_PALETTE.muted, fontSize: 11, fontWeight: '800' },
  itemValue: { color: REEL_PALETTE.amber, fontSize: 14, fontWeight: '900', flex: 1, textAlign: 'right', ...KEEP_ALL },
  itemReason: { color: REEL_PALETTE.muted, fontSize: 12, lineHeight: 18, ...KEEP_ALL },
  cta: {
    position: 'absolute',
    left: 22,
    right: 86,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REEL_PALETTE.cyan,
  },
  ctaText: { color: REEL_PALETTE.ink, fontSize: 15, fontWeight: '900', ...KEEP_ALL },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
