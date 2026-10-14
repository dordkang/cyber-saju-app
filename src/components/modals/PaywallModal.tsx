/**
 * [CYBER-SAJU] 하이브리드 수익화 페이월 모달
 * (src/components/modals/PaywallModal.tsx)
 * 
 * - 딥 크림슨 (#140207, #FF2A4B) & 네온 골드 (#FFB800) 사이버 테마
 * - 플랜 A: 월간 무제한 VIP 천기 패스 (월 9,900원 / 月額 980円)
 * - 플랜 B: 일회성 긴급 복채 충전 5회권 (2,900원 / 300円)
 * - Stripe 결제 URL 연동 및 런칭/테스트 프리패스 활성화 지원
 * - 언어 락 (kr / jp) 완벽 분리 및 사용자 호칭 규칙 준수
 */

import React, { useState } from 'react';
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
import { activateVipPass, addBonusCredits } from '../../utils/streamAndVip';
import { playHaptic } from '../reels/haptics';
import { getActiveLanguage } from '../../utils/langManager';

const IS_WEB = Platform.OS === 'web';
const KEEP_ALL = { wordBreak: 'keep-all' } as unknown as TextStyle;

const LUXURY_GLASS = (
  IS_WEB
    ? {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65)',
      }
    : null
) as unknown as ViewStyle | null;

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string | null;
  lang?: 'kr' | 'jp';
  onSuccess?: () => void;
}

export function PaywallModal({
  visible,
  onClose,
  userName,
  lang,
  onSuccess,
}: PaywallModalProps) {
  const { width } = useWindowDimensions();
  const currentLang = lang || (getActiveLanguage() === 'jp' ? 'jp' : 'kr');
  const isJa = currentLang === 'jp';

  const [isProcessing, setIsProcessing] = useState(false);

  if (!visible) return null;

  const cardWidth = Math.min(420, width - 32);

  // 사용자 호칭
  const defaultUser = isJa ? 'ご縁者' : '인연자';
  const honorific = isJa ? '様' : ' 님';
  const userDisplayName = `${(userName && userName.trim()) || defaultUser}${honorific}`;

  // 환경변수 Stripe Checkout URL
  const envObj = (typeof globalThis !== 'undefined' && (globalThis as any).process?.env)
    ? (globalThis as any).process.env
    : null;
  const STRIPE_VIP_URL = (envObj?.EXPO_PUBLIC_STRIPE_VIP_URL as string | undefined) || undefined;
  const STRIPE_COIN_URL = (envObj?.EXPO_PUBLIC_STRIPE_COIN_URL as string | undefined) || undefined;

  // 플랜 A: 월간 무제한 VIP 패스 결제
  const handleSelectVipPlan = () => {
    void playHaptic('snap');
    setIsProcessing(true);

    if (STRIPE_VIP_URL && typeof window !== 'undefined') {
      window.open(STRIPE_VIP_URL, '_blank', 'noopener,noreferrer');
      setIsProcessing(false);
      return;
    }

    // 런칭 초기 및 테스트 환경 프리패스 즉시 활성화
    setTimeout(() => {
      activateVipPass();
      setIsProcessing(false);
      Alert.alert(
        isJa ? '👑 VIP無制限パス 解放完了' : '👑 VIP 무제한 천기 패스 해금 완료',
        isJa
          ? `${userDisplayName}、30日間の天機密室・無制限アクセス権が有効化されました。心ゆくまで運命の深淵をお尋ねください。`
          : `${userDisplayName}, 30일간의 천기 밀실 무제한 질문권이 성공적으로 활성화되었습니다. 이제 제한 없이 운명의 문을 두드려 보십시오.`,
        [
          {
            text: isJa ? '確認' : '확인',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    }, 350);
  };

  // 플랜 B: 긴급 복채 5회권 충전
  const handleSelectCoinsPlan = () => {
    void playHaptic('snap');
    setIsProcessing(true);

    if (STRIPE_COIN_URL && typeof window !== 'undefined') {
      window.open(STRIPE_COIN_URL, '_blank', 'noopener,noreferrer');
      setIsProcessing(false);
      return;
    }

    // 런칭 초기 및 테스트 환경 즉시 충전 처리
    setTimeout(() => {
      addBonusCredits(5);
      setIsProcessing(false);
      Alert.alert(
        isJa ? '🪙 神託チャージ完了' : '🪙 복채 5회 충전 완료',
        isJa
          ? `${userDisplayName}、神託の追加質問チケット（5回分）がチャージされました。直ちに密室で対話を再開いただけます。`
          : `${userDisplayName}, 오늘의 추가 질문권(5회)이 즉시 충전되었습니다. 지금 바로 밀실에서 점사를 이어가 보십시오.`,
        [
          {
            text: isJa ? '確認' : '확인',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    }, 350);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, LUXURY_GLASS, { width: cardWidth }]}>
          {/* 상단 닫기 바 */}
          <View style={styles.topRow}>
            <View style={styles.topBadge}>
              <Text style={styles.topBadgeText}>CYBER SAJU // MONETIZATION GATE</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 1. 헤더 및 공감 카운슬링 문구 */}
            <View style={styles.headerBox}>
              <Text style={styles.headerTitle}>
                {isJa
                  ? '⚡ 天機密室 無制限解放 ＆ 神託チャージ'
                  : '⚡ 천기 밀실 무제한 해금 & 복채 충전'}
              </Text>
              <Text style={[styles.headerSubtitle, KEEP_ALL]}>
                {isJa
                  ? `${userDisplayName}、本日分の無料神託（5回）がすべて消費されました。さらなる運命の指針が必要な場合は、専用パスにて制限なく対話をお続けください。`
                  : `${userDisplayName}, 오늘 허용된 5번의 무료 신탁이 모두 소진되었습니다. 더 깊은 운명의 해답이 필요하시다면 전용 패스를 통해 제한 없이 대화를 이어가 보십시오.`}
              </Text>
            </View>

            {/* 2. 플랜 A: 월간 무제한 VIP 천기 패스 (BEST / 추천) */}
            <View
              style={[
                styles.planCard,
                styles.vipPlanCard,
                IS_WEB
                  ? ({
                      boxShadow: '0 0 24px rgba(255, 184, 0, 0.28), inset 0 0 16px rgba(255, 184, 0, 0.08)',
                    } as unknown as ViewStyle)
                  : null,
              ]}
            >
              {/* BEST 추천 배지 */}
              <View style={styles.bestPillWrap}>
                <View style={styles.bestPill}>
                  <Text style={styles.bestPillText}>
                    {isJa ? '★ BEST / おすすめ' : '★ BEST / 강력 추천'}
                  </Text>
                </View>
              </View>

              <View style={styles.planHeaderRow}>
                <Text style={styles.vipPlanTitle}>
                  {isJa ? '👑 月間無制限 VIP天機パス' : '👑 월간 무제한 VIP 천기 패스'}
                </Text>
                <Text style={styles.vipPriceTag}>
                  {isJa ? '月額 980円' : '월 9,900원'}
                </Text>
              </View>

              <Text style={styles.vipDailyCalc}>
                {isJa ? '(1日あたり約32円)' : '(하루 330원꼴)'}
              </Text>

              {/* 혜택 목록 */}
              <View style={styles.perksBox}>
                <View style={styles.perkRow}>
                  <Text style={styles.perkBullet}>✔</Text>
                  <Text style={[styles.perkText, KEEP_ALL]}>
                    {isJa
                      ? '30日間 1:1密室相談 無制限質問'
                      : '30일간 1:1 밀실 상담 무제한 질문'}
                  </Text>
                </View>
                <View style={styles.perkRow}>
                  <Text style={styles.perkBullet}>✔</Text>
                  <Text style={[styles.perkText, KEEP_ALL]}>
                    {isJa
                      ? '生涯大運の深層解断 無制限閲覧'
                      : '생애 대운 심층 해단 무제한 열람'}
                  </Text>
                </View>
                <View style={styles.perkRow}>
                  <Text style={styles.perkBullet}>✔</Text>
                  <Text style={[styles.perkText, KEEP_ALL]}>
                    {isJa ? '広告完全非表示' : '광고 전면 제거'}
                  </Text>
                </View>
              </View>

              {/* 플랜 A CTA 버튼 */}
              <TouchableOpacity
                style={[
                  styles.vipCtaBtn,
                  IS_WEB
                    ? ({
                        boxShadow: '0 0 16px rgba(255, 184, 0, 0.45)',
                      } as unknown as ViewStyle)
                    : null,
                ]}
                onPress={handleSelectVipPlan}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <Text style={styles.vipCtaBtnText}>
                  {isJa
                    ? '👑 月額980円で無制限パスを解放する ↗'
                    : '👑 월 9,900원으로 무제한 천기 열기 ↗'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. 플랜 B: 일회성 긴급 복채 충전 (5회 추가권) */}
            <View style={[styles.planCard, styles.coinsPlanCard]}>
              <View style={styles.planHeaderRow}>
                <Text style={styles.coinPlanTitle}>
                  {isJa ? '🪙 都度緊急 神託チャージ (5回)' : '🪙 일회성 긴급 복채 충전 (5회)'}
                </Text>
                <Text style={styles.coinPriceTag}>
                  {isJa ? '都度 300円' : '1회 2,900원'}
                </Text>
              </View>

              <Text style={[styles.coinDescText, KEEP_ALL]}>
                {isJa
                  ? 'サブスク不要・今すぐ使える追加質問チケット5回分'
                  : '구독 부담 없이 오늘 즉시 5회 추가 질문권 수혈'}
              </Text>

              {/* 플랜 B CTA 버튼 */}
              <TouchableOpacity
                style={styles.coinCtaBtn}
                onPress={handleSelectCoinsPlan}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <Text style={styles.coinCtaBtnText}>
                  {isJa
                    ? '🪙 追加神託チケット(5回)をチャージ'
                    : '🪙 복채 5회권 즉시 충전하기'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 하단 보증 배지 */}
            <View style={styles.footerInfo}>
              <Text style={styles.footerInfoText}>
                {isJa
                  ? '🔒 安全な決済システム · いつでも解約可能 · 即時反映'
                  : '🔒 안전한 보안 결제 · 언제든 자유로운 구독 해지 · 즉시 적용'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 6, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  modalCard: {
    maxHeight: '92%',
    backgroundColor: '#0E0407',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#7F1D1D',
    padding: 16,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 42, 75, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 42, 75, 0.3)',
  },
  topBadgeText: {
    color: '#FF2A4B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollBody: {
    gap: 14,
    paddingBottom: 6,
  },
  headerBox: {
    gap: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    color: '#E2E8F0',
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },

  /* 플랜 공통 */
  planCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* 플랜 A: VIP */
  vipPlanCard: {
    backgroundColor: 'rgba(28, 14, 5, 0.75)',
    borderColor: '#FFB800',
  },
  bestPillWrap: {
    alignSelf: 'flex-start',
    marginBottom: -2,
  },
  bestPill: {
    backgroundColor: '#FFB800',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  bestPillText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vipPlanTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
  },
  vipPriceTag: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },
  vipDailyCalc: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: -4,
  },
  perksBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    padding: 8,
    gap: 5,
    marginVertical: 2,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkBullet: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '900',
  },
  perkText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
  },
  vipCtaBtn: {
    backgroundColor: '#FFB800',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  vipCtaBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  /* 플랜 B: 코인/복채 */
  coinsPlanCard: {
    backgroundColor: 'rgba(20, 8, 12, 0.6)',
    borderColor: 'rgba(255, 42, 75, 0.35)',
  },
  coinPlanTitle: {
    color: '#FF2A4B',
    fontSize: 13,
    fontWeight: '800',
  },
  coinPriceTag: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  coinDescText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  coinCtaBtn: {
    backgroundColor: 'rgba(255, 42, 75, 0.2)',
    borderWidth: 1,
    borderColor: '#FF2A4B',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  coinCtaBtnText: {
    color: '#FF2A4B',
    fontSize: 11.5,
    fontWeight: '800',
  },

  footerInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  footerInfoText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
  },
});
