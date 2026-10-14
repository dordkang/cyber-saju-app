/**
 * [CYBER-SAJU] 9:16 SNS 바이럴 공유 카드 모달 (src/components/modals/ViralShareModal.tsx)
 * 
 * - 9:16 인스타그램 스토리 & LINE 스토리 완벽 규격 세로형 네온 포토카드
 * - 원클릭 3종 바이럴 액션:
 *   1) 📸 이미지 저장 (인스타/LINE 스토리용 PNG 다운로드 & Web Share API)
 *   2) 𝕏 (Twitter) 원클릭 인텐트 공유 (#사이버사주 #영혼의공명)
 *   3) 🔗 클립보드 링크 및 요약 복사
 * - kr / jp 완벽 분리, 일본어 모드 한국어 0% 보장
 * - 품격 있는 경어체 및 [이름] 님 / [名前]様 호칭 규칙 준수
 */

import React, { useState, useRef } from 'react';
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
import type { CelebrityData } from '../../data/celebrityResonance';
import { formatResonanceMessage } from '../../data/celebrityResonance';
import { playHaptic } from '../reels/haptics';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;
const CARD_RATIO = 9 / 16;
const WATERMARK_URL = 'cyber-saju-app.pages.dev';

export interface ViralShareModalProps {
  visible: boolean;
  onClose: () => void;
  celebrity: CelebrityData;
  syncRate: number;
  userName?: string | null;
  userDayMaster?: string;
  userElement?: string;
  lang?: 'kr' | 'jp';
}

function formatToday(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}.${mm}.${dd}`;
}

export function ViralShareModal({
  visible,
  onClose,
  celebrity,
  syncRate,
  userName,
  userDayMaster = '甲',
  userElement = '木',
  lang = 'kr',
}: ViralShareModalProps) {
  const { width, height } = useWindowDimensions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const isJa = lang === 'jp';

  if (!visible) return null;

  // 9:16 카드 크기 동적 계산 (화면 비율에 맞춰 최적화)
  const maxCardHeight = Math.min(620, Math.max(380, height * 0.72));
  const maxCardWidth = Math.min(360, Math.max(220, width - 36));
  const cardWidth = Math.min(maxCardWidth, maxCardHeight * CARD_RATIO);
  const cardHeight = cardWidth / CARD_RATIO;
  const scale = Math.min(1, Math.max(0.72, cardWidth / 330));
  const circleSize = Math.round(96 * scale);

  // 사용자 호칭
  const defaultUser = isJa ? 'ご縁者' : '인연자';
  const honorific = isJa ? '様' : ' 님';
  const userDisplayName = `${(userName && userName.trim()) || defaultUser}${honorific}`;

  // 셀럽 정보
  const celebName = isJa ? celebrity.name.jp : celebrity.name.kr;
  const celebTitle = isJa ? celebrity.title.jp : celebrity.title.kr;
  const celebTenGod = isJa ? celebrity.tenGod.jp : celebrity.tenGod.kr;
  const celebCoreKeyword = isJa ? celebrity.coreKeyword.jp : celebrity.coreKeyword.kr;
  const resonanceBody = formatResonanceMessage(
    isJa ? celebrity.resonanceMessage.jp : celebrity.resonanceMessage.kr,
    userName,
    lang
  );

  // 1) 📸 이미지 저장 액션 (인스타/LINE 스토리용)
  const handleSaveImage = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    void playHaptic('tap');

    try {
      if (IS_WEB) {
        const node = document.getElementById('viral-photo-card');
        if (!node) {
          Alert.alert(
            isJa ? '保存エラー' : '저장 실패',
            isJa ? 'カード要素の読み込みに失敗しました。' : '카드 요소를 찾을 수 없습니다.'
          );
          return;
        }

        const { toBlob, toPng } = await import('html-to-image');

        // 모바일 Web Share API 시도
        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
          try {
            const blob = await toBlob(node, {
              quality: 0.98,
              pixelRatio: 2.5,
            });
            if (blob) {
              const file = new File(
                [blob],
                `cyber-saju-${celebrity.id}-${syncRate}.png`,
                { type: 'image/png' }
              );
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: isJa
                    ? `サイバー四柱推命 // 魂の共鳴 [${celebName}]`
                    : `사이버 사주 // 영혼의 공명 [${celebName}]`,
                  text: isJa
                    ? `${userDisplayName}の魂の周波数 ${syncRate}% 同調レジェンド: ${celebName} (${celebTitle})`
                    : `${userDisplayName}의 영혼 주파수 ${syncRate}% 동조 레전드: ${celebName} (${celebTitle})`,
                });
                return;
              }
            }
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') return;
            console.warn('Web Share fallback to direct download:', shareErr);
          }
        }

        // PC 브라우저 또는 Share 미지원 시 PNG 직접 다운로드
        const dataUrl = await toPng(node, {
          quality: 0.98,
          pixelRatio: 2.5,
        });
        const link = document.createElement('a');
        link.download = `cyber-saju-resonance-${celebrity.id}-${syncRate}pct.png`;
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
      setIsCapturing(false);
    }
  };

  // 2) 𝕏 (Twitter) 공유 액션
  const handleTwitterShare = () => {
    void playHaptic('tap');
    const shareText = isJa
      ? `【サイバー四柱推命 // 魂の共鳴】\n${userDisplayName}の魂の周波数と${syncRate}%同調する歴史的レジェンドは【${celebName}】(${celebTitle})です。\n\n「${celebCoreKeyword}」\n\nあなたと共鳴する英雄を今すぐスキャン⚡\n`
      : `[사이버 사주 // 영혼의 공명]\n${userDisplayName}의 영혼 주파수와 ${syncRate}% 동조하는 역사적 레전드는 【${celebName}】(${celebTitle})입니다.\n\n"${celebCoreKeyword}"\n\n당신과 공명하는 영웅을 지금 스캔해 보세요⚡\n`;

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
      ? `[サイバー四柱推命 // 魂の共鳴]\n${userDisplayName} × ${celebName} (${syncRate}% SYNC)\n${celebCoreKeyword}\nhttps://${WATERMARK_URL}`
      : `[사이버 사주 // 영혼의 공명]\n${userDisplayName} × ${celebName} (${syncRate}% SYNC)\n${celebCoreKeyword}\nhttps://${WATERMARK_URL}`;

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
        {/* 모달 헤더 닫기 버튼 */}
        <View style={[styles.topBar, { width: cardWidth }]}>
          <Text style={styles.topBarTitle}>
            {isJa ? '⚡ 魂の共鳴カード 共有' : '⚡ 영혼의 공명 카드 공유'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeIconButton}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 9:16 인스타/LINE 스토리 전용 세로형 네온 포토카드 프리뷰 영역 */}
        <View
          // @ts-ignore
          id="viral-photo-card"
          style={[
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
              borderColor: celebrity.themeColor,
              shadowColor: celebrity.themeColor,
            },
            IS_WEB
              ? ({
                  boxShadow: `0 0 32px ${celebrity.glowColor}, inset 0 0 16px rgba(0,0,0,0.6)`,
                } as unknown as ViewStyle)
              : null,
          ]}
        >
          {/* 카드 내부 배경 데코 라인 */}
          <View style={styles.cyberGridOverlay} pointerEvents="none" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.cardScroll, { padding: Math.round(14 * scale) }]}
          >
            {/* 1. 상단 로고 & 일자 */}
            <View style={styles.header}>
              <View style={styles.headerBadge}>
                <Text style={[styles.headerLogo, { color: celebrity.themeColor }]}>
                  CYBER-SAJU // SOUL FREQUENCY MATRIX
                </Text>
              </View>
              <Text style={styles.headerDate}>{formatToday()}</Text>
            </View>

            {/* 2. 사용자 호칭 & 내 사주 오행 요약 */}
            <View style={styles.userSection}>
              <Text style={[styles.userNameText, KEEP_ALL]}>{userDisplayName}</Text>
              <View style={styles.userSajuPill}>
                <Text style={styles.userSajuText}>
                  {isJa
                    ? `本元 ${userDayMaster} (${userElement}の気) × 波動同調`
                    : `일간 ${userDayMaster} (${userElement} 기운) × 파동 동조`}
                </Text>
              </View>
            </View>

            {/* 3. 대형 네온 서클 게이지 (일치율) */}
            <View style={styles.syncWrap}>
              <View
                style={[
                  styles.syncCircle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    borderColor: celebrity.themeColor,
                  },
                  IS_WEB
                    ? ({
                        boxShadow: `0 0 24px ${celebrity.glowColor}`,
                      } as unknown as ViewStyle)
                    : null,
                ]}
              >
                <Text style={styles.syncIcon}>{celebrity.emojiIcon}</Text>
                <Text
                  style={[
                    styles.syncValue,
                    {
                      fontSize: Math.round(26 * scale),
                      color: celebrity.themeColor,
                      textShadowColor: celebrity.glowColor,
                    },
                  ]}
                >
                  {syncRate}%
                </Text>
                <Text style={styles.syncLabel}>SYNC MATRIX</Text>
              </View>
            </View>

            {/* 4. 매칭된 셀럽 이름 & 타이틀 & 십신 */}
            <View style={styles.celebSection}>
              <Text style={[styles.celebName, { fontSize: Math.round(20 * scale) }]}>
                {celebName}
              </Text>
              <Text style={styles.celebTitle} numberOfLines={1}>
                {celebTitle}
              </Text>
              <View
                style={[
                  styles.tenGodPill,
                  {
                    borderColor: celebrity.themeColor,
                    backgroundColor: `${celebrity.themeColor}18`,
                  },
                ]}
              >
                <Text style={[styles.tenGodText, { color: celebrity.themeColor }]}>
                  ⚡ {celebTenGod}
                </Text>
              </View>
            </View>

            {/* 5. 핵심 킬러 키워드 1줄 요약 */}
            <View style={[styles.coreKeywordBox, { borderColor: `${celebrity.themeColor}40` }]}>
              <Text style={[styles.coreKeywordTitle, { color: celebrity.themeColor }]}>
                {isJa ? '【核心レゾナンス】' : '【핵심 레조넌스】'}
              </Text>
              <Text style={[styles.coreKeywordText, KEEP_ALL]}>
                "{celebCoreKeyword}"
              </Text>
            </View>

            {/* 6. 본문 카운슬링 메시지 발췌 (미니멀) */}
            <View style={styles.proseBox}>
              <Text style={[styles.proseText, KEEP_ALL]} numberOfLines={4}>
                {resonanceBody}
              </Text>
            </View>

            {/* 7. 하단 워터마크 */}
            <View style={styles.footer}>
              <Text style={styles.footerBrand}>
                CYBER-SAJU // LOCAL EDGE NEURAL MATRIX
              </Text>
              <Text style={[styles.watermarkText, { color: celebrity.themeColor }]}>
                ⚡ {WATERMARK_URL}
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* 복사 완료 토스트 배너 */}
        {copiedToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>
              {isJa ? '✓ 結果とURLをクリップボードにコピーしました' : '✓ 결과 요약과 링크가 복사되었습니다'}
            </Text>
          </View>
        )}

        {/* 2) 원클릭 바이럴 액션 버튼 3종 */}
        <View style={[styles.actionRow, { width: cardWidth }]}>
          {/* 버튼 1: 📸 이미지 저장 (인스타/LINE 스토리용) */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.saveButton,
              { backgroundColor: celebrity.themeColor },
              IS_WEB
                ? ({
                    boxShadow: `0 0 16px ${celebrity.glowColor}`,
                  } as unknown as ViewStyle)
                : null,
            ]}
            onPress={handleSaveImage}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText} numberOfLines={1}>
              {isCapturing
                ? (isJa ? '📸 保存中...' : '📸 캡처 중...')
                : (isJa ? '📸 画像を保存 (ストーリー)' : '📸 이미지 저장 (스토리용)')}
            </Text>
          </TouchableOpacity>

          {/* 버튼 2: 𝕏 (Twitter) 공유 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.twitterButton]}
            onPress={handleTwitterShare}
            activeOpacity={0.8}
          >
            <Text style={styles.twitterButtonText} numberOfLines={1}>
              {isJa ? '𝕏 でシェア' : '𝕏 공유'}
            </Text>
          </TouchableOpacity>

          {/* 버튼 3: 🔗 링크 복사 */}
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
    fontSize: 13,
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
    position: 'relative',
  },
  cyberGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
  headerLogo: {
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
    marginTop: 2,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userSajuPill: {
    marginTop: 3,
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
  celebSection: {
    alignItems: 'center',
    gap: 3,
  },
  celebName: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  celebTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  tenGodPill: {
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  tenGodText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  coreKeywordBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  coreKeywordTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coreKeywordText: {
    color: '#F8FAFC',
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 15,
  },
  proseBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  proseText: {
    color: '#CBD5E1',
    fontSize: 9.5,
    lineHeight: 14.5,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerBrand: {
    color: '#475569',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  watermarkText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
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
