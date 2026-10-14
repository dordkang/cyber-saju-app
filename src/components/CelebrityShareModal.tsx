/**
 * [CYBER-SAJU] 영혼의 공명 10인 셀럽 매칭 & 9:16 바이럴 공유 모달
 * (src/components/CelebrityShareModal.tsx)
 * 
 * - 한·일·글로벌 10대 레전드 셀럽 공명 DB (src/data/celebrityResonance.ts) 연동
 * - 60% ~ 99% 주파수 라디오 튜너 슬라이더 (150ms 디바운스 부드러운 전환)
 * - 9:16 인스타/LINE 스토리 최적화 규격 네온 포토카드
 * - 원클릭 바이럴 3종 액션:
 *   1) 📸 이미지 저장 (html-to-image 캡처 & Web Share API)
 *   2) 𝕏 (Twitter) 인텐트 공유 (#사이버사주 #영혼의공명)
 *   3) 🔗 결과 요약 및 링크 클립보드 복사
 * - kr / jp 완벽 분리 및 [이름] 님 / [名前]様 호칭 규칙 준수
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { playHaptic } from './reels/haptics';
import { useLocale } from '../locales';
import {
  CELEBRITY_RESONANCE_DATASET,
  formatResonanceMessage,
  type CelebrityData,
} from '../data/celebrityResonance';
import { getActiveLanguage } from '../utils/langManager';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
const CARD_RATIO = 9 / 16;
const WATERMARK_URL = 'cyber-saju-app.pages.dev';

interface Props {
  visible: boolean;
  onClose: () => void;
  celebrityResult?: any;
  userDayMaster?: string;
  userName?: string | null;
}

function formatToday(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}.${mm}.${dd}`;
}

export function CelebrityShareModal({
  visible,
  onClose,
  celebrityResult,
  userDayMaster = '甲',
  userName,
}: Props) {
  const { width, height } = useWindowDimensions();
  const { locale } = useLocale();
  const currentLang = getActiveLanguage() === 'jp' || locale === 'ja' ? 'jp' : 'kr';
  const isJa = currentLang === 'jp';

  const [isSharing, setIsSharing] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // 기본 주파수 슬라이더 초기값 (60~99% 범위)
  const initialFreq = useMemo(() => {
    const raw = celebrityResult?.syncRate ? Math.round(celebrityResult.syncRate) : 95;
    return Math.max(60, Math.min(99, raw));
  }, [celebrityResult]);

  const [sliderFreq, setSliderFreq] = useState<number>(initialFreq);
  const [selectedCelebId, setSelectedCelebId] = useState<string>('elon-musk');

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (visible) {
      setSliderFreq(initialFreq);
      // 가장 가까운 셀럽 검색
      let closest = CELEBRITY_RESONANCE_DATASET[0];
      let minDiff = 999;
      CELEBRITY_RESONANCE_DATASET.forEach((c) => {
        const diff = Math.abs(c.baseFrequency - initialFreq);
        if (diff < minDiff) {
          minDiff = diff;
          closest = c;
        }
      });
      setSelectedCelebId(closest.id);
    }
  }, [visible, initialFreq]);

  // 150ms 디바운스 라디오 튜너
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = useCallback((newFreq: number) => {
    setSliderFreq(newFreq);
    void playHaptic('tap');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      let closest = CELEBRITY_RESONANCE_DATASET[0];
      let minDiff = 999;
      CELEBRITY_RESONANCE_DATASET.forEach((c) => {
        const diff = Math.abs(c.baseFrequency - newFreq);
        if (diff < minDiff) {
          minDiff = diff;
          closest = c;
        }
      });
      setSelectedCelebId(closest.id);
    }, 150);
  }, []);

  const handleSelectCelebDirect = useCallback((celeb: CelebrityData) => {
    void playHaptic('tap');
    setSelectedCelebId(celeb.id);
    setSliderFreq(celeb.baseFrequency);
  }, []);

  const currentCeleb = useMemo(() => {
    const found = CELEBRITY_RESONANCE_DATASET.find((c) => c.id === selectedCelebId);
    return found || CELEBRITY_RESONANCE_DATASET[0];
  }, [selectedCelebId]);

  if (!visible) return null;

  // 9:16 인스타 스토리 규격 비율 계산
  const maxCardHeight = Math.min(620, Math.max(380, height * 0.72));
  const maxCardWidth = Math.min(360, Math.max(220, width - 36));
  const cardWidth = Math.min(maxCardWidth, maxCardHeight * CARD_RATIO);
  const cardHeight = cardWidth / CARD_RATIO;
  const scale = Math.min(1, Math.max(0.72, cardWidth / 330));
  const circleSize = Math.round(92 * scale);

  // 사용자 호칭
  const defaultUser = isJa ? 'ご縁者' : '인연자';
  const honorific = isJa ? '様' : ' 님';
  const userDisplayName = `${(userName && userName.trim()) || defaultUser}${honorific}`;

  const celebName = isJa ? currentCeleb.name.jp : currentCeleb.name.kr;
  const celebTitle = isJa ? currentCeleb.title.jp : currentCeleb.title.kr;
  const celebTenGod = isJa ? currentCeleb.tenGod.jp : currentCeleb.tenGod.kr;
  const celebCoreKeyword = isJa ? currentCeleb.coreKeyword.jp : currentCeleb.coreKeyword.kr;
  const resonanceBody = formatResonanceMessage(
    isJa ? currentCeleb.resonanceMessage.jp : currentCeleb.resonanceMessage.kr,
    userName,
    currentLang
  );

  // 1) 📸 이미지 저장 액션 (인스타/LINE 스토리용)
  const handleSaveImage = async () => {
    if (isSharing) return;
    setIsSharing(true);
    void playHaptic('tap');

    try {
      if (IS_WEB) {
        const node = document.getElementById('soul-frequency-card');
        if (!node) {
          Alert.alert(
            isJa ? '保存エラー' : '저장 실패',
            isJa ? 'カード要素が見つかりません。' : '카드 요소를 찾을 수 없습니다.'
          );
          return;
        }

        const { toBlob, toPng } = await import('html-to-image');

        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
          try {
            const blob = await toBlob(node, {
              quality: 0.98,
              pixelRatio: 2.5,
            });
            if (blob) {
              const file = new File(
                [blob],
                `cyber-saju-${currentCeleb.id}-${sliderFreq}.png`,
                { type: 'image/png' }
              );
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: isJa
                    ? `サイバー四柱推命 // 魂の共鳴 [${celebName}]`
                    : `사이버 사주 // 영혼의 공명 [${celebName}]`,
                  text: isJa
                    ? `${userDisplayName}の魂の周波数 ${sliderFreq}% 同調レジェンド: ${celebName} (${celebTitle})`
                    : `${userDisplayName}의 영혼 주파수 ${sliderFreq}% 동조 레전드: ${celebName} (${celebTitle})`,
                });
                return;
              }
            }
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') return;
            console.warn('Web Share fallback to direct download:', shareErr);
          }
        }

        const dataUrl = await toPng(node, {
          quality: 0.98,
          pixelRatio: 2.5,
        });
        const link = document.createElement('a');
        link.download = `cyber-saju-resonance-${currentCeleb.id}-${sliderFreq}pct.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Alert.alert(
          isJa ? '📸 ストーリー画像保存完了' : '📸 인스타 스토리 카드 저장 완료',
          isJa
            ? '高解像度9:16ネオンカードが保存されました。InstagramやLINEのストーリーでシェアしてください！'
            : '고해상도 9:16 네온 카드가 저장되었습니다. 인스타그램이나 LINE 스토리에 공유해 보세요!'
        );
      } else {
        Alert.alert(
          isJa ? 'ご案内' : '안내',
          isJa ? 'ウェブブラウザ環境でカードの保存がサポートされています。' : '웹 브라우저 환경에서 카드 저장이 지원됩니다.'
        );
      }
    } catch (err) {
      console.error('Image capture error:', err);
      Alert.alert(
        isJa ? 'エラー' : '오류',
        isJa ? '画像の生成中に問題が発生しました。' : '이미지 생성 중 문제가 발생했습니다.'
      );
    } finally {
      setIsSharing(false);
    }
  };

  // 2) 𝕏 (Twitter) 공유 액션
  const handleTwitterShare = () => {
    void playHaptic('tap');
    const shareText = isJa
      ? `【サイバー四柱推命 // 魂の共鳴】\n${userDisplayName}の魂の周波数と${sliderFreq}%同調する歴史的レジェンドは【${celebName}】(${celebTitle})です。\n\n「${celebCoreKeyword}」\n\nあなたと共鳴する英雄を今すぐスキャン⚡\n`
      : `[사이버 사주 // 영혼의 공명]\n${userDisplayName}의 영혼 주파수와 ${sliderFreq}% 동조하는 역사적 레전드는 【${celebName}】(${celebTitle})입니다.\n\n"${celebCoreKeyword}"\n\n당신과 공명하는 영웅을 지금 스캔해 보세요⚡\n`;

    const hashtags = isJa
      ? 'サイバー四柱推命,魂の共鳴,四柱推命'
      : '사이버사주,영혼의공명,사주팔자';

    const shareUrl = `https://${WATERMARK_URL}`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&hashtags=${encodeURIComponent(hashtags)}&url=${encodeURIComponent(shareUrl)}`;

    if (typeof window !== 'undefined') {
      window.open(intentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 3) 🔗 클립보드 링크 복사 액션
  const handleCopyLink = async () => {
    void playHaptic('tap');
    const copyText = isJa
      ? `[サイバー四柱推命 // 魂の共鳴]\n${userDisplayName} × ${celebName} (${sliderFreq}% SYNC)\n${celebCoreKeyword}\nhttps://${WATERMARK_URL}`
      : `[사이버 사주 // 영혼의 공명]\n${userDisplayName} × ${celebName} (${sliderFreq}% SYNC)\n${celebCoreKeyword}\nhttps://${WATERMARK_URL}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(copyText);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2400);
      } else {
        Alert.alert(isJa ? 'コピー完了' : '링크 복사 완료', copyText);
      }
    } catch {
      Alert.alert(isJa ? 'リンク' : '링크', `https://${WATERMARK_URL}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* 상단 닫기 헤더 바 */}
        <View style={[styles.topBar, { width: cardWidth }]}>
          <Text style={styles.topBarTitle}>
            {isJa ? '⚡ 魂の共鳴 (SOUL FREQUENCY)' : '⚡ 영혼의 공명 (SOUL FREQUENCY)'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeIconButton}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 9:16 인스타/LINE 스토리 캡처 대상 네온 카드 */}
        <View
          // @ts-ignore
          id="soul-frequency-card"
          style={[
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
              borderColor: currentCeleb.themeColor,
              shadowColor: currentCeleb.themeColor,
            },
            IS_WEB
              ? ({
                  boxShadow: `0 0 32px ${currentCeleb.glowColor}, inset 0 0 16px rgba(0,0,0,0.6)`,
                } as unknown as ViewStyle)
              : null,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.cardScroll, { padding: Math.round(14 * scale) }]}
          >
            {/* 1. 상단 사이버 헤더 */}
            <View style={styles.header}>
              <View style={styles.headerBadge}>
                <Text style={[styles.headerTitle, { color: currentCeleb.themeColor }]} numberOfLines={1}>
                  CYBER-SAJU // SOUL FREQUENCY MATRIX
                </Text>
              </View>
              <Text style={styles.headerDate}>{formatToday()}</Text>
            </View>

            {/* 2. 사용자 호칭 & 사주 요약 */}
            <View style={styles.userSection}>
              <Text style={[styles.userNameText, KEEP_ALL]}>{userDisplayName}</Text>
              <View style={styles.userSajuPill}>
                <Text style={styles.userSajuText}>
                  {isJa
                    ? `本元 ${userDayMaster} (${currentCeleb.element}の気) × 波動同調`
                    : `일간 ${userDayMaster} (${currentCeleb.element} 기운) × 파동 동조`}
                </Text>
              </View>
            </View>

            {/* 3. 원형 일치율 네온 게이지 */}
            <View style={styles.syncWrap}>
              <View
                style={[
                  styles.syncCircle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    borderColor: currentCeleb.themeColor,
                  },
                  IS_WEB
                    ? ({
                        boxShadow: `0 0 24px ${currentCeleb.glowColor}`,
                      } as unknown as ViewStyle)
                    : null,
                ]}
              >
                <Text style={styles.syncIcon}>{currentCeleb.emojiIcon}</Text>
                <Text
                  style={[
                    styles.syncValue,
                    {
                      fontSize: Math.round(26 * scale),
                      color: currentCeleb.themeColor,
                      textShadowColor: currentCeleb.glowColor,
                    },
                  ]}
                >
                  {sliderFreq}%
                </Text>
                <Text style={styles.syncLabel}>
                  {isJa ? '周波数同調' : '주파수 동조'}
                </Text>
              </View>
            </View>

            {/* 4. 라디오 주파수 튜너 슬라이더 */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeaderRow}>
                <Text style={styles.sliderHeaderLabel}>TUNER FREQUENCY</Text>
                <Text style={[styles.sliderHeaderFreq, { color: currentCeleb.themeColor }]}>
                  {sliderFreq}Hz / %
                </Text>
              </View>

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
                      height: 8,
                      borderRadius: 4,
                      outline: 'none',
                      background: `linear-gradient(90deg, #A855F7 0%, #00F5D4 35%, #00F0FF 65%, #FFB800 85%, #FF2A4B 100%)`,
                      cursor: 'pointer',
                      accentColor: currentCeleb.themeColor,
                    }}
                  />
                </View>
              ) : (
                <View style={styles.mobileSliderTrack}>
                  <View
                    style={[
                      styles.mobileSliderFill,
                      {
                        width: `${((sliderFreq - 60) / 39) * 100}%`,
                        backgroundColor: currentCeleb.themeColor,
                      },
                    ]}
                  />
                </View>
              )}

              {/* 퀵 칩 리스트 */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsScroll}
              >
                {CELEBRITY_RESONANCE_DATASET.map((c) => {
                  const isActive = c.id === currentCeleb.id;
                  const cName = isJa ? c.name.jp : c.name.kr;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.quickChip,
                        isActive && {
                          borderColor: c.themeColor,
                          backgroundColor: `${c.themeColor}22`,
                        },
                      ]}
                      onPress={() => handleSelectCelebDirect(c)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickChipEmoji}>{c.emojiIcon}</Text>
                      <Text
                        style={[
                          styles.quickChipName,
                          isActive && { color: c.themeColor, fontWeight: '900' },
                        ]}
                      >
                        {cName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 5. 인물 정보 & 십신 뱃지 */}
            <View style={styles.identity}>
              <Text style={[styles.name, { fontSize: Math.round(20 * scale) }]} numberOfLines={1}>
                {celebName}
              </Text>
              <Text style={styles.title} numberOfLines={1}>
                {celebTitle}
              </Text>
              <View
                style={[
                  styles.tag,
                  {
                    borderColor: currentCeleb.themeColor,
                    backgroundColor: `${currentCeleb.themeColor}18`,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: currentCeleb.themeColor }]}>
                  ⚡ {celebTenGod}
                </Text>
              </View>
            </View>

            {/* 6. 핵심 킬러 키워드 1줄 요약 */}
            <View style={[styles.keywordBox, { borderColor: `${currentCeleb.themeColor}40` }]}>
              <Text style={[styles.keywordTitle, { color: currentCeleb.themeColor }]}>
                {isJa ? '【核心共鳴コード】' : '【핵심 공명 코드】'}
              </Text>
              <Text style={[styles.keywordBody, KEEP_ALL]}>
                "{celebCoreKeyword}"
              </Text>
            </View>

            {/* 7. 1:1 공명 메시지 박스 */}
            <View style={styles.counselingBox}>
              <Text style={[styles.counselingBody, KEEP_ALL]} numberOfLines={4}>
                {resonanceBody}
              </Text>
            </View>

            {/* 8. 하단 워터마크 */}
            <View style={styles.footer}>
              <Text style={styles.footerBrand}>
                CYBER-SAJU // LOCAL EDGE MATRIX
              </Text>
              <Text style={[styles.watermarkUrl, { color: currentCeleb.themeColor }]}>
                ⚡ {WATERMARK_URL}
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* 토스트 배너 */}
        {copiedToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>
              {isJa ? '✓ 結果とURLをコピーしました' : '✓ 결과 요약과 링크가 복사되었습니다'}
            </Text>
          </View>
        )}

        {/* 하단 바이럴 액션 버튼 3종 */}
        <View style={[styles.actionRow, { width: cardWidth }]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.saveButton,
              { backgroundColor: currentCeleb.themeColor },
              IS_WEB
                ? ({
                    boxShadow: `0 0 16px ${currentCeleb.glowColor}`,
                  } as unknown as ViewStyle)
                : null,
            ]}
            onPress={handleSaveImage}
            disabled={isSharing}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText} numberOfLines={1}>
              {isSharing
                ? (isJa ? '📸 保存中...' : '📸 캡처 중...')
                : (isJa ? '📸 画像を保存 (ストーリー)' : '📸 이미지 저장 (스토리용)')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.twitterButton]}
            onPress={handleTwitterShare}
            activeOpacity={0.8}
          >
            <Text style={styles.twitterButtonText} numberOfLines={1}>
              {isJa ? '𝕏 でシェア' : '𝕏 공유'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.linkButton]}
            onPress={handleCopyLink}
            activeOpacity={0.8}
          >
            <Text style={styles.linkButtonText} numberOfLines={1}>
              {isJa ? '🔗 コピー' : '🔗 복사'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  topBarTitle: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeIconButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeIconText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#090D1A',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerDate: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
  },
  userSection: {
    alignItems: 'center',
    marginTop: 1,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  userSajuPill: {
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  userSajuText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  syncWrap: {
    alignItems: 'center',
    marginVertical: 2,
  },
  syncCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    backgroundColor: 'rgba(5, 8, 18, 0.85)',
  },
  syncIcon: {
    fontSize: 14,
    marginBottom: -2,
  },
  syncValue: {
    fontWeight: '900',
    lineHeight: 28,
  },
  syncLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sliderSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    padding: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 5,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderHeaderLabel: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sliderHeaderFreq: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  rangeInputContainer: {
    width: '100%',
    paddingVertical: 2,
  },
  mobileSliderTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  mobileSliderFill: {
    height: '100%',
  },
  quickChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickChipEmoji: {
    fontSize: 10,
  },
  quickChipName: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  identity: {
    alignItems: 'center',
    gap: 2,
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  title: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  keywordBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
    padding: 7,
    borderWidth: 1,
    alignItems: 'center',
  },
  keywordTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  keywordBody: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
  },
  counselingBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  counselingBody: {
    color: '#CBD5E1',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerBrand: {
    color: '#475569',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  watermarkUrl: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  toastBanner: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 2,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  twitterButton: {
    flex: 1.1,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  twitterButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  linkButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  linkButtonText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '800',
  },
});
