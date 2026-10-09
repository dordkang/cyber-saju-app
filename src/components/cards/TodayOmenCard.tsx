import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
import { ELEMENT_AURA, REEL_PALETTE, REEL_SECTIONS } from '../../types/reels';
import type { TodayOmenData } from '../../types/reels';
import type { SajuResult } from '../../engine/types';
import type { PartnerProfile } from '../../database/db';
import { calculateSaju } from '../../engine/calculator';
import { formatGanji, ELEMENT_TITLE_KR } from '../../engine/reelsContent';
import { getTenGod } from '../../engine/timelineEngine';
import { playHaptic } from '../reels/haptics';
import { TomorrowStrategyAccordion } from './TomorrowStrategyAccordion';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
const WINE_GLASS = (
  IS_WEB
    ? {
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 0 20px rgba(180, 20, 40, 0.15)',
      }
    : null
) as unknown as ViewStyle | null;

const WEB_CTA_SHADOW = (
  IS_WEB
    ? {
        boxShadow: '0 0 30px rgba(255, 30, 60, 0.6)',
        transition: 'all 0.3s ease',
      }
    : null
) as unknown as ViewStyle | null;

const META = REEL_SECTIONS[0];

export interface TodayOmenCardProps {
  data: TodayOmenData;
  /** 지금 화면에 보이는 카드일 때만 터치·애니메이션을 켠다. */
  active: boolean;
  height: number;
  onOpenDaily?: () => void;
  isBatteryFull?: boolean;
  saju?: SajuResult | null;
  partner?: PartnerProfile | null;
  partnerSaju?: SajuResult | null;
  onOpenPartner?: () => void;
}

function formatTodayLabel(now: Date): string {
  const week = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()] ?? '';
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}.${mm}.${dd} (${week})`;
}

function splitGanji(raw: string): { hanja: string; reading: string } {
  const match = raw?.match(/^(.+?)\((.+)\)$/);
  if (match?.[1] && match[2]) return { hanja: match[1], reading: match[2] };
  return { hanja: raw || '丙辰', reading: raw ? '일진 계산 중' : '병진' };
}

export const TodayOmenCard = memo(function TodayOmenCard({
  data,
  active,
  height,
  onOpenDaily,
  isBatteryFull,
  saju,
  partner,
  partnerSaju,
  onOpenPartner,
}: TodayOmenCardProps) {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const compact = height < 700;

  // 조언 전문 상세 모달 상태
  const [fortuneModalOpen, setFortuneModalOpen] = useState(false);

  // 기준 일자 선택 상태
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateInputRef = useRef<any>(null);

  // 오늘 날짜 키 (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${mm}-${dd}`;
  }, []);

  // 1일 1회 정산 제한 락 상태
  const [isSettledToday, setIsSettledToday] = useState(false);

  useEffect(() => {
    try {
      const settled = (globalThis as any)?.localStorage?.getItem(`cybersaju.daily_settled.${todayStr}`);
      if (settled === 'true' || isBatteryFull) {
        setIsSettledToday(true);
      }
    } catch {
      if (isBatteryFull) setIsSettledToday(true);
    }
  }, [todayStr, isBatteryFull]);

  // 날짜 변경에 따른 실시간 일진/오행/십신 재계산
  const dynamicOmen = useMemo(() => {
    try {
      const calculated = calculateSaju(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate(),
        12,
        0,
        true
      );
      const dayPillar = calculated.pillars.day;
      const element = dayPillar.elements[0];
      const ganjiText = formatGanji(dayPillar.stem, dayPillar.branch);
      const myDay = saju?.dayMaster ?? '戊';
      const god = getTenGod(myDay, dayPillar.stem);
      return {
        element,
        elementName: ELEMENT_TITLE_KR[element] ?? '적화(赤火)의 기운',
        dayPillarText: ganjiText,
        god,
        ganji: splitGanji(ganjiText),
      };
    } catch {
      return {
        element: data.element,
        elementName: data.elementName,
        dayPillarText: data.dayPillarText,
        god: null,
        ganji: splitGanji(data.dayPillarText),
      };
    }
  }, [selectedDate, saju, data]);

  const aura = ELEMENT_AURA[dynamicOmen.element] ?? ELEMENT_AURA.Fire;
  const ganji = dynamicOmen.ganji;

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

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0.4);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: !IS_WEB }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: !IS_WEB }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const handleDaily = () => {
    if (!active) return;
    if (isSettledToday) return;

    void playHaptic('tap');
    Alert.alert(
      '⚠️ 신중 정산 안내',
      '오늘의 기운은 하루에 단 한 번만 새길 수 있습니다. 신중하게 정산하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신중히 새기기',
          onPress: () => {
            void playHaptic('tap');
            onOpenDaily?.();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.page, { height }]} pointerEvents={active ? 'auto' : 'none'}>
      {/* 1. 배경: 딥 블랙 & 다크 버건디/와인 그라데이션 */}
      <LinearGradient
        colors={['#1c0408', '#0f0204', '#050102']}
        locations={[0, 0.48, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          {
            paddingTop: insets.top + 14,
            paddingBottom: Math.max(insets.bottom, 16) + 72,
          },
        ]}
      >
        {/* 상단 헤더 및 기준 일자 선택기 (Date Selector) 복원 */}
        <View>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {META?.no} · {META?.kicker}
              </Text>
            </View>

            {/* 날짜 선택 컨트롤 바 */}
            <View style={styles.dateControlBar}>
              <Pressable onPress={handlePrevDay} style={styles.dateNavBtn} accessibilityLabel="이전 날">
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
                accessibilityLabel="날짜 변경"
              >
                <Text style={styles.dateCenterText}>📅 {formatTodayLabel(selectedDate)}</Text>
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

              <Pressable onPress={handleToday} style={styles.dateTodayBtn} accessibilityLabel="오늘로 복귀">
                <Text style={styles.dateTodayText}>오늘</Text>
              </Pressable>

              <Pressable onPress={handleNextDay} style={styles.dateNavBtn} accessibilityLabel="다음 날">
                <Text style={styles.dateNavText}>▶</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.title, compact && styles.titleCompact]}>{META?.title}</Text>
          {!!data.profileLabel && !compact && <Text style={styles.profile}>{data.profileLabel}</Text>}
        </View>

        {/* 2. 중앙 일주/오행 링 (Fire Ring) & 붉은빛 글로우 방사 효과 */}
        <View style={[styles.sigilWrap, compact && styles.sigilWrapCompact]}>
          <View
            pointerEvents="none"
            style={[
              styles.radialBackglow,
              compact && styles.radialBackglowCompact,
              IS_WEB && ({
                background: 'radial-gradient(circle, rgba(255, 20, 50, 0.32) 0%, rgba(255, 20, 50, 0.12) 42%, transparent 72%)',
                boxShadow: '0 0 80px rgba(255, 20, 50, 0.25)',
              } as unknown as ViewStyle),
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.sigilGlow,
              compact && styles.sigilGlowCompact,
              {
                opacity: pulse,
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[styles.sigilMidRing, compact && styles.sigilMidRingCompact]}
          />

          <View style={[styles.sigil, compact && styles.sigilCompact]}>
            <Text style={styles.hanjaMark}>{aura.hanja || '火'}</Text>
            <Text style={[styles.ganji, compact && styles.ganjiCompact]}>{ganji.hanja}</Text>
            <Text style={styles.reading}>{ganji.reading}</Text>
            <Text style={styles.elementName}>{dynamicOmen.elementName}</Text>
          </View>
        </View>

        {/* 3. 하단 "오늘의 열쇠" 카드 (딥 와인 글래스모피즘, 은은한 크림슨 테두리) */}
        <Pressable
          onPress={() => {
            void playHaptic('tap');
            setFortuneModalOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="천기 해단 전문 보기"
          style={({ pressed }) => [styles.glass, WINE_GLASS, pressed && styles.glassPressed]}
        >
          <View style={styles.glassHeaderRow}>
            <Text style={styles.keywordLabel}>
              {dynamicOmen.god ? `${dynamicOmen.god}의 열쇠` : '오늘의 열쇠'}
            </Text>
            <View style={styles.readMoreBadge}>
              <Text style={styles.readMoreText}>천기 전문 보기 ↗</Text>
            </View>
          </View>
          <Text style={styles.keyword}>
            {dynamicOmen.god ? `${dynamicOmen.god} · ${dynamicOmen.elementName}` : data.keyword}
          </Text>
          <Text style={styles.fortune} numberOfLines={2}>
            {data.fortuneText}
          </Text>
          {!compact && (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>곁에 둘 물건</Text>
              <Text style={styles.itemValue}>{data.luckyItem}</Text>
            </View>
          )}
        </Pressable>

        {/* 4. 하단 CTA 버튼 ("오늘 기운 새기기" / 1일 1회 잠금) */}
        <Pressable
          onPress={handleDaily}
          disabled={isSettledToday}
          accessibilityRole="button"
          accessibilityLabel={isSettledToday ? '오늘 기운 새김 완료' : '오늘 기운 새기기'}
          style={({ pressed }) => [
            styles.ctaWrapperInline,
            !isSettledToday && WEB_CTA_SHADOW,
            isSettledToday && styles.ctaDisabled,
            pressed && !isSettledToday && styles.pressed,
          ]}
        >
          {isSettledToday ? (
            <View style={styles.ctaDisabledBox}>
              <Text style={styles.ctaDisabledText}>
                ✨ 오늘의 기운이 이미 마음에 새겨졌습니다 (내일 다시 열림)
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#ff1f3d', '#e50914', '#b3001b']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>오늘 기운 새기기</Text>
            </LinearGradient>
          )}
        </Pressable>

        {/* 5. 배터리 100% 완충 시 해금되는 [내일의 천기 & 작전 설계] 아코디언 카드 */}
        <TomorrowStrategyAccordion
          unlocked={Boolean(isBatteryFull)}
          saju={saju ?? null}
          partner={partner}
          partnerSaju={partnerSaju}
          baseDate={selectedDate}
          onOpenDaily={onOpenDaily}
          onOpenPartner={onOpenPartner}
        />
      </ScrollView>

      {/* 6. 천기 해단 상세 전문 모달 (화면 전체 덮는 딥 버건디 톤) */}
      <Modal
        visible={fortuneModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFortuneModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFortuneModalOpen(false)}
            accessibilityLabel="배경 닫기"
          />
          <View style={styles.modalCard}>
            <LinearGradient
              colors={['#24050b', '#160307', '#090103']}
              locations={[0, 0.5, 1]}
              style={styles.modalGradient}
            >
              {/* 모달 상단 헤더 */}
              <View style={styles.modalHeader}>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>🔮 옥동자 천기(天氣) 해단 전문</Text>
                </View>
                <Pressable
                  onPress={() => {
                    void playHaptic('tap');
                    setFortuneModalOpen(false);
                  }}
                  hitSlop={12}
                  style={styles.modalCloseBtn}
                  accessibilityLabel="닫기"
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalKeyword}>
                {dynamicOmen.god ? `${dynamicOmen.god} · ${dynamicOmen.elementName}` : data.keyword}
              </Text>
              <Text style={styles.modalDateSub}>
                {formatTodayLabel(selectedDate)} · {dynamicOmen.dayPillarText}
              </Text>

              {/* 전문 스크롤 영역 */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalQuoteBox}>
                  <Text style={styles.modalFortuneText}>{data.fortuneText}</Text>
                </View>

                {Boolean(data.luckyItem) && (
                  <View style={styles.modalItemSection}>
                    <View style={styles.modalItemRow}>
                      <Text style={styles.modalItemLabel}>곁에 둘 비책 물건</Text>
                      <Text style={styles.modalItemValue}>{data.luckyItem}</Text>
                    </View>
                    {Boolean(data.luckyReason) && (
                      <Text style={styles.modalItemReason}>{data.luckyReason}</Text>
                    )}
                  </View>
                )}
              </ScrollView>

              {/* 하단 확인 버튼 */}
              <Pressable
                onPress={() => {
                  void playHaptic('tap');
                  setFortuneModalOpen(false);
                }}
                style={({ pressed }) => [styles.modalConfirmBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalConfirmText}>마음에 깊이 새기기 (닫기)</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  page: {
    width: '100%',
    backgroundColor: '#050102',
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
  scrollBody: {
    paddingHorizontal: 22,
    paddingRight: 86,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
    gap: 12,
  },
  ctaWrapperInline: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff1f3d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 25,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ff2a4b',
    backgroundColor: 'rgba(28, 4, 8, 0.75)',
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 12px rgba(255, 42, 75, 0.25)',
        } as unknown as ViewStyle)
      : null),
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#ff2a4b',
    ...KEEP_ALL,
  },
  dateControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 8, 14, 0.85)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.35)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  dateNavBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dateNavText: {
    color: '#ff4b60',
    fontSize: 10,
    fontWeight: '900',
  },
  dateCenterBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'relative',
  },
  dateCenterText: {
    color: '#F4F7FB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dateTodayBtn: {
    backgroundColor: 'rgba(255, 30, 56, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.4)',
  },
  dateTodayText: {
    color: '#ff758f',
    fontSize: 10,
    fontWeight: '800',
  },
  date: {
    marginTop: 12,
    color: '#a8868e',
    fontSize: 12,
    fontWeight: '700',
    ...KEEP_ALL,
  },
  title: {
    marginTop: 8,
    color: '#F4F7FB',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    ...KEEP_ALL,
  },
  titleCompact: { fontSize: 24, lineHeight: 30 },
  profile: {
    marginTop: 8,
    color: '#a8868e',
    fontSize: 13,
    fontWeight: '700',
    ...KEEP_ALL,
  },
  sigilWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 290,
    paddingVertical: 18,
    position: 'relative',
    overflow: 'visible',
  },
  sigilWrapCompact: { minHeight: 230, paddingVertical: 12, overflow: 'visible' },
  radialBackglow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 20, 50, 0.12)',
    shadowColor: '#ff1432',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 40,
  },
  radialBackglowCompact: {
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  sigilGlow: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1.5,
    borderColor: '#ff1e38',
    shadowColor: '#ff1e38',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 35,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 35px #ff1e38, 0 0 15px rgba(255, 30, 56, 0.6)',
        } as unknown as ViewStyle)
      : null),
  },
  sigilGlowCompact: {
    width: 172,
    height: 172,
    borderRadius: 86,
  },
  sigilMidRing: {
    position: 'absolute',
    width: 202,
    height: 202,
    borderRadius: 101,
    borderWidth: 1,
    borderColor: 'rgba(255, 50, 75, 0.45)',
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 18px rgba(255, 30, 56, 0.45)',
        } as unknown as ViewStyle)
      : null),
  },
  sigilMidRingCompact: {
    width: 156,
    height: 156,
    borderRadius: 78,
  },
  sigil: {
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 2,
    borderColor: '#ef4444', // border-red-500
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 2, 4, 0.85)',
    shadowColor: '#ff1e38',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 35,
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 35px #ff1e38, inset 0 0 20px rgba(255, 30, 56, 0.25)',
        } as unknown as ViewStyle)
      : null),
  },
  sigilCompact: {
    width: 144,
    height: 144,
    borderRadius: 72,
  },
  hanjaMark: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 2,
    color: '#ff2a4b',
    ...(IS_WEB
      ? ({
          textShadow: '0 0 10px rgba(255, 42, 75, 0.7)',
        } as unknown as TextStyle)
      : null),
  },
  ganji: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 50,
    ...(IS_WEB
      ? ({
          textShadow: '0 0 16px rgba(255, 255, 255, 0.25)',
        } as unknown as TextStyle)
      : null),
  },
  ganjiCompact: { fontSize: 32, lineHeight: 38 },
  reading: {
    color: '#c9a4aa',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  elementName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#ff2a4b',
    ...KEEP_ALL,
    ...(IS_WEB
      ? ({
          textShadow: '0 0 8px rgba(255, 42, 75, 0.6)',
        } as unknown as TextStyle)
      : null),
  },
  glass: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 8, 14, 0.8)', // bg-[#1c080e]/80
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.6)', // border border-red-900/60
    shadowColor: 'rgba(180, 20, 40, 0.35)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    gap: 4,
  },
  keywordLabel: {
    color: '#ff4b60',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  keyword: {
    color: '#F4F7FB',
    fontSize: 20,
    fontWeight: '900',
    ...KEEP_ALL,
  },
  fortune: {
    marginTop: 6,
    color: '#E0CDD1',
    fontSize: 14,
    lineHeight: 22,
    ...KEEP_ALL,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
    gap: 8,
  },
  itemLabel: {
    color: '#a8868e',
    fontSize: 11,
    fontWeight: '800',
  },
  itemValue: {
    color: '#ff758f',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right',
    ...KEEP_ALL,
  },
  itemReason: {
    color: '#a8868e',
    fontSize: 12,
    lineHeight: 18,
    ...KEEP_ALL,
  },
  ctaWrapper: {
    position: 'absolute',
    left: 22,
    right: 86,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff1f3d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 25,
  },
  ctaGradient: {
    width: '100%',
    paddingVertical: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    ...KEEP_ALL,
    ...(IS_WEB
      ? ({
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.45)',
        } as unknown as TextStyle)
      : null),
  },
  glassHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  readMoreBadge: {
    backgroundColor: 'rgba(255, 30, 56, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.45)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readMoreText: {
    color: '#ff4b60',
    fontSize: 10,
    fontWeight: '800',
  },
  glassPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  ctaDisabled: {
    opacity: 0.85,
  },
  ctaDisabledBox: {
    width: '100%',
    paddingVertical: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(28, 6, 12, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.5)',
    paddingHorizontal: 16,
  },
  ctaDisabledText: {
    color: '#c9a4aa',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    ...KEEP_ALL,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...(IS_WEB
      ? ({
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        } as unknown as ViewStyle)
      : null),
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 30, 60, 0.65)',
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 32px rgba(255, 20, 50, 0.35)',
        } as unknown as ViewStyle)
      : null),
  },
  modalGradient: {
    padding: 22,
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalBadge: {
    backgroundColor: 'rgba(255, 30, 56, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalBadgeText: {
    color: '#ff4b60',
    fontSize: 11,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    color: '#a8868e',
    fontSize: 18,
    fontWeight: '700',
  },
  modalKeyword: {
    color: '#F4F7FB',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
    ...KEEP_ALL,
  },
  modalDateSub: {
    color: '#ff758f',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  modalQuoteBox: {
    borderRadius: 14,
    backgroundColor: 'rgba(15, 2, 4, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.5)',
    padding: 16,
  },
  modalFortuneText: {
    color: '#F4F7FB',
    fontSize: 15,
    lineHeight: 25,
    fontWeight: '700',
    ...KEEP_ALL,
  },
  modalItemSection: {
    borderRadius: 14,
    backgroundColor: 'rgba(28, 8, 14, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.45)',
    padding: 14,
    gap: 6,
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemLabel: {
    color: '#a8868e',
    fontSize: 11,
    fontWeight: '800',
  },
  modalItemValue: {
    color: '#ff4b60',
    fontSize: 14,
    fontWeight: '900',
  },
  modalItemReason: {
    color: '#c9a4aa',
    fontSize: 12,
    lineHeight: 18,
    ...KEEP_ALL,
  },
  modalConfirmBtn: {
    marginTop: 14,
    backgroundColor: '#ff1f3d',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 20px rgba(255, 31, 61, 0.45)',
        } as unknown as ViewStyle)
      : null),
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
