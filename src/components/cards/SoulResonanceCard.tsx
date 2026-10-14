/**
 * [CYBER-SAJU] 영혼의 공명 (Soul Frequency Matrix) 셀럽 매칭 카드
 * (src/components/cards/SoulResonanceCard.tsx)
 * 
 * - 상단 내부 중복 번호 뱃지 제거 및 메인 타이틀부터 직관적 시작
 * - 1) 최고 일치 셀럽 하이라이트: [SPECIAL RESONANCE UNLOCKED] 네온 배지
 * - 2) 주파수 라디오 튜너 슬라이더 (60% ~ 99%): 150ms 디바운스로 모바일 60fps 부드러운 전환
 * - 3) 1:1 공명 메시지 박스: [이름] 님 / [名前]様 호칭 및 정중한 경어체 카운슬링
 * - 4) [⚡ 내 영혼의 공명 카드 공유하기] 버튼 -> 9:16 ViralShareModal 호출
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SajuResult } from '../../engine/types';
import {
  CELEBRITY_RESONANCE_DATASET,
  calculateCelebrityMatches,
  formatResonanceMessage,
  type CelebrityData,
  type CelebrityMatchResult,
} from '../../data/celebrityResonance';
import { ViralShareModal } from '../modals/ViralShareModal';
import { playHaptic } from '../reels/haptics';
import { getActiveLanguage } from '../../utils/langManager';

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

interface Props {
  active: boolean;
  height: number;
  saju: SajuResult | null | undefined;
  userProfile?: { name?: string; birthDate?: string } | null;
  onOpenCelebrityModal?: () => void;
  lang?: 'kr' | 'jp';
}

export const SoulResonanceCard = memo(function SoulResonanceCard({
  active,
  height,
  saju,
  userProfile,
  onOpenCelebrityModal,
  lang,
}: Props) {
  const insets = useSafeAreaInsets();
  const currentLang = lang || (getActiveLanguage() === 'jp' ? 'jp' : 'kr');
  const isJa = currentLang === 'jp';

  // 사주 기반 매칭 결과 산출
  const matchResult: CelebrityMatchResult = useMemo(() => {
    return calculateCelebrityMatches(saju);
  }, [saju]);

  // 현재 선택된 셀럽 및 주파수 상태
  const [selectedCelebId, setSelectedCelebId] = useState<string>(
    matchResult.bestMatch.celebrity.id
  );
  const [sliderFreq, setSliderFreq] = useState<number>(matchResult.bestMatch.syncRate);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 사주 변경 시 1위 셀럽으로 재동기화
  useEffect(() => {
    setSelectedCelebId(matchResult.bestMatch.celebrity.id);
    setSliderFreq(matchResult.bestMatch.syncRate);
  }, [matchResult]);

  // 현재 선택된 셀럽 객체 및 일치율
  const currentMatch = useMemo(() => {
    const found = matchResult.allMatches.find((m) => m.celebrity.id === selectedCelebId);
    return found || matchResult.bestMatch;
  }, [matchResult, selectedCelebId]);

  const currentCeleb = currentMatch.celebrity;
  const isBest = currentMatch.isBestMatch;

  // 150ms 디바운스 슬라이더 타이머
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = useCallback(
    (newFreq: number) => {
      setSliderFreq(newFreq);
      void playHaptic('tap');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        // newFreq와 가장 가까운 셀럽 매칭 항목 찾기
        let closest = matchResult.allMatches[0];
        let minDiff = 999;
        matchResult.allMatches.forEach((m) => {
          const diff = Math.abs(m.syncRate - newFreq);
          if (diff < minDiff) {
            minDiff = diff;
            closest = m;
          }
        });
        setSelectedCelebId(closest.celebrity.id);
      }, 150);
    },
    [matchResult]
  );

  const handleSelectCelebDirectly = useCallback(
    (celebId: string) => {
      void playHaptic('tap');
      setSelectedCelebId(celebId);
      const target = matchResult.allMatches.find((m) => m.celebrity.id === celebId);
      if (target) {
        setSliderFreq(target.syncRate);
      }
    },
    [matchResult]
  );

  // 사용자 호칭 및 일간/오행 정보
  const userName = userProfile?.name || null;
  const userDayMaster = saju?.dayMaster || '甲';
  const STEM_TO_HANJA: Record<string, string> = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
    己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
  };
  const userElement = STEM_TO_HANJA[userDayMaster] || '木';
  const defaultCaller = isJa ? 'ご縁者' : '인연자';
  const honorific = isJa ? '様' : ' 님';
  const userDisplayName = `${(userName && userName.trim()) || defaultCaller}${honorific}`;

  // 현지화 텍스트
  const celebName = isJa ? currentCeleb.name.jp : currentCeleb.name.kr;
  const celebTitle = isJa ? currentCeleb.title.jp : currentCeleb.title.kr;
  const celebTenGod = isJa ? currentCeleb.tenGod.jp : currentCeleb.tenGod.kr;
  const celebCoreKeyword = isJa ? currentCeleb.coreKeyword.jp : currentCeleb.coreKeyword.kr;
  const resonanceBody = useMemo(() => {
    const rawTemplate = isJa ? currentCeleb.resonanceMessage.jp : currentCeleb.resonanceMessage.kr;
    return formatResonanceMessage(rawTemplate, userName, currentLang);
  }, [currentCeleb, userName, currentLang, isJa]);

  const handleOpenShare = () => {
    void playHaptic('tap');
    setIsShareModalOpen(true);
  };

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 52,
            paddingBottom: insets.bottom + 90,
          },
        ]}
      >
        {/* 1. 메인 타이틀 (상단 내부 중복 번호 뱃지 없이 깔끔하게 시작) */}
        <View style={styles.titleWrap}>
          <Text style={styles.mainTitle}>
            {isJa
              ? '魂の共鳴 (SOUL FREQUENCY MATRIX)'
              : '영혼의 공명 (SOUL FREQUENCY MATRIX)'}
          </Text>
          <Text style={styles.subTitle}>
            {isJa
              ? '歴史を動かした巨人とあなたの魂の周波数を同期する1:1マトリクス'
              : '역사를 뒤흔든 거인과 나의 영혼 주파수를 실시간 동조하는 1:1 파동 매칭'}
          </Text>
        </View>

        {/* 2. 최고 일치 셀럽 하이라이트 배지 (1위 매칭 셀럽일 때 네온 골드/크림슨 글로우) */}
        {isBest && (
          <View
            style={[
              styles.bestResonanceBadgeWrap,
              IS_WEB
                ? ({
                    boxShadow: '0 0 20px rgba(255, 184, 0, 0.45)',
                  } as unknown as ViewStyle)
                : null,
            ]}
          >
            <View style={styles.bestResonancePill}>
              <Text style={styles.bestResonanceBolt}>⚡</Text>
              <Text style={styles.bestResonanceText}>
                SPECIAL RESONANCE UNLOCKED
              </Text>
              <Text style={styles.bestResonanceSub}>
                {isJa ? '【最高周波数同調】' : '【최고 주파수 동조】'}
              </Text>
            </View>
          </View>
        )}

        {/* 3. 라디오 주파수 튜너 슬라이더 (60% ~ 99%) */}
        <View style={[styles.tunerCard, LUXURY_GLASS]}>
          <View style={styles.tunerHeaderRow}>
            <View style={styles.tunerLabelGroup}>
              <Text style={styles.tunerIcon}>📻</Text>
              <Text style={styles.tunerLabel}>FREQUENCY TUNER</Text>
            </View>
            <View style={styles.tunerRateBadge}>
              <Text style={[styles.tunerRateValue, { color: currentCeleb.themeColor }]}>
                {sliderFreq}% SYNC
              </Text>
            </View>
          </View>

          {/* 웹 range slider 또는 모바일 네온 트랙 */}
          {IS_WEB ? (
            <View style={styles.rangeInputContainer}>
              <input
                type="range"
                min={60}
                max={99}
                step={1}
                value={sliderFreq}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 10,
                  borderRadius: 5,
                  outline: 'none',
                  background:
                    'linear-gradient(90deg, #A855F7 0%, #00F5D4 35%, #00F0FF 65%, #FFB800 85%, #FF2A4B 100%)',
                  cursor: 'pointer',
                  accentColor: currentCeleb.themeColor,
                }}
              />
            </View>
          ) : (
            <View style={styles.mobileTrack}>
              <View
                style={[
                  styles.mobileFill,
                  {
                    width: `${((sliderFreq - 60) / 39) * 100}%`,
                    backgroundColor: currentCeleb.themeColor,
                  },
                ]}
              />
            </View>
          )}

          {/* 셀럽 퀵 칩 리스트 (가로 스크롤 가능) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {matchResult.allMatches.map((m) => {
              const activeChip = m.celebrity.id === selectedCelebId;
              const nameText = isJa ? m.celebrity.name.jp : m.celebrity.name.kr;
              return (
                <TouchableOpacity
                  key={m.celebrity.id}
                  style={[
                    styles.celebChip,
                    activeChip && {
                      borderColor: m.celebrity.themeColor,
                      backgroundColor: `${m.celebrity.themeColor}22`,
                    },
                    activeChip &&
                      IS_WEB &&
                      ({
                        boxShadow: `0 0 12px ${m.celebrity.glowColor}`,
                      } as unknown as ViewStyle),
                  ]}
                  onPress={() => handleSelectCelebDirectly(m.celebrity.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipEmoji}>{m.celebrity.emojiIcon}</Text>
                  <Text
                    style={[
                      styles.chipName,
                      activeChip && { color: m.celebrity.themeColor, fontWeight: '900' },
                    ]}
                  >
                    {nameText}
                  </Text>
                  <Text style={styles.chipFreq}>{m.syncRate}%</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. 1:1 공명 메시지 박스 (선택된 셀럽 프로필 & 카운슬링 본문) */}
        <View
          style={[
            styles.resonanceCard,
            LUXURY_GLASS,
            {
              borderColor: currentCeleb.themeColor,
            },
            IS_WEB
              ? ({
                  boxShadow: `0 0 24px ${currentCeleb.glowColor}, inset 0 0 16px rgba(0,0,0,0.5)`,
                } as unknown as ViewStyle)
              : null,
          ]}
        >
          {/* 셀럽 프로필 헤더 */}
          <View style={styles.celebHeader}>
            <View
              style={[
                styles.avatarCircle,
                {
                  borderColor: currentCeleb.themeColor,
                  backgroundColor: `${currentCeleb.themeColor}15`,
                },
              ]}
            >
              <Text style={styles.avatarEmoji}>{currentCeleb.emojiIcon}</Text>
            </View>
            <View style={styles.celebMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.celebNameText}>{celebName}</Text>
                <View
                  style={[
                    styles.tenGodTag,
                    {
                      borderColor: currentCeleb.themeColor,
                      backgroundColor: `${currentCeleb.themeColor}20`,
                    },
                  ]}
                >
                  <Text style={[styles.tenGodTagText, { color: currentCeleb.themeColor }]}>
                    {celebTenGod}
                  </Text>
                </View>
              </View>
              <Text style={styles.celebTitleText} numberOfLines={1}>
                {celebTitle}
              </Text>
            </View>
          </View>

          {/* 핵심 킬러 키워드 */}
          <View
            style={[
              styles.keywordBanner,
              {
                borderLeftColor: currentCeleb.themeColor,
              },
            ]}
          >
            <Text style={[styles.keywordLabel, { color: currentCeleb.themeColor }]}>
              {isJa ? '【核心共鳴コード】' : '【핵심 공명 코드】'}
            </Text>
            <Text style={[styles.keywordText, KEEP_ALL]}>
              "{celebCoreKeyword}"
            </Text>
          </View>

          {/* 1:1 공명 카운슬링 본문 (품격 있는 경어체 & 호칭 자동 치환) */}
          <View style={styles.counselingBox}>
            <View style={styles.counselingHeaderRow}>
              <Text style={styles.counselingSpeakerBadge}>
                {isJa ? `🗣️ ${celebName}からの言霊` : `🗣️ ${celebName}의 사주 파동 전언`}
              </Text>
              <Text style={styles.counselingTargetBadge}>{userDisplayName}</Text>
            </View>
            <Text style={[styles.counselingBodyText, KEEP_ALL]}>
              {resonanceBody}
            </Text>
          </View>
        </View>

        {/* 5. 9:16 SNS 바이럴 공유 트리거 버튼 */}
        <TouchableOpacity
          style={[
            styles.shareCtaButton,
            { backgroundColor: currentCeleb.themeColor },
            IS_WEB
              ? ({
                  boxShadow: `0 0 24px ${currentCeleb.glowColor}`,
                } as unknown as ViewStyle)
              : null,
          ]}
          onPress={handleOpenShare}
          activeOpacity={0.85}
        >
          <Text style={styles.shareCtaText}>
            {isJa
              ? '⚡ 魂の共鳴カードを共有する'
              : '⚡ 내 영혼의 공명 카드 공유하기'}
          </Text>
          <Text style={styles.shareCtaSub}>
            INSTA / LINE STORY // 𝕏 TWITTER VIRAL
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 내부 공유 모달 */}
      <ViralShareModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        celebrity={currentCeleb}
        syncRate={sliderFreq}
        userName={userName}
        userDayMaster={userDayMaster}
        userElement={userElement}
        lang={currentLang}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  titleWrap: {
    marginBottom: 2,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
  },

  /* 1위 셀럽 하이라이트 배지 */
  bestResonanceBadgeWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bestResonancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  bestResonanceBolt: {
    fontSize: 14,
    color: '#FFB800',
  },
  bestResonanceText: {
    color: '#FFD700',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bestResonanceSub: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* 라디오 주파수 튜너 카드 */
  tunerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  tunerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tunerLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tunerIcon: {
    fontSize: 14,
  },
  tunerLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tunerRateBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tunerRateValue: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rangeInputContainer: {
    width: '100%',
    paddingVertical: 2,
  },
  mobileTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  mobileFill: {
    height: '100%',
  },
  chipScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  celebChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipEmoji: {
    fontSize: 12,
  },
  chipName: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  chipFreq: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
  },

  /* 1:1 공명 메시지 박스 */
  resonanceCard: {
    backgroundColor: 'rgba(10, 15, 29, 0.85)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  celebHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  celebMeta: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  celebNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  tenGodTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  tenGodTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  celebTitleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  keywordBanner: {
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    gap: 3,
  },
  keywordLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  keywordText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  counselingBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  counselingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counselingSpeakerBadge: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  counselingTargetBadge: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  counselingBodyText: {
    color: '#E2E8F0',
    fontSize: 12.5,
    lineHeight: 19,
  },

  /* 하단 공유 CTA 버튼 */
  shareCtaButton: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  shareCtaText: {
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  shareCtaSub: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
