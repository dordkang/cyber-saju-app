import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { useLocale } from '../../locales';

export interface ExitConfirmModalProps {
  visible: boolean;
  onStay: () => void;
  onExit: () => void;
}

const IS_WEB = Platform.OS === 'web';

const MODAL_BACKDROP_BLUR: ViewStyle | null = IS_WEB
  ? ({
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    } as unknown as ViewStyle)
  : null;

const NEON_POPUP_SHADOW: ViewStyle | null = IS_WEB
  ? ({
      boxShadow: '0 0 32px rgba(255, 30, 56, 0.45), inset 0 0 16px rgba(255, 30, 56, 0.15)',
    } as unknown as ViewStyle)
  : null;

const NEON_BUTTON_GLOW: ViewStyle | null = IS_WEB
  ? ({
      boxShadow: '0 0 18px rgba(255, 30, 56, 0.65)',
    } as unknown as ViewStyle)
  : null;

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  visible,
  onStay,
  onExit,
}) => {
  const { isJa } = useLocale();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onStay}
    >
      <View style={[styles.backdrop, MODAL_BACKDROP_BLUR]}>
        <Pressable
          style={styles.backdropDismiss}
          onPress={onStay}
          accessibilityLabel={isJa ? '閉じる' : '닫기'}
        />
        <View style={[styles.card, NEON_POPUP_SHADOW]}>
          {/* 상단 네온 엠블럼 */}
          <View style={styles.emblemContainer}>
            <View style={styles.emblemRing}>
              <Text style={styles.emblemIcon}>⚡</Text>
            </View>
          </View>

          {/* 타이틀 */}
          <Text style={styles.title}>
            {isJa ? '『サイバー四柱推命』を終了しますか？' : '사이버 사주를 종료하시겠습니까?'}
          </Text>

          {/* 설명 문구 */}
          <Text style={styles.description}>
            {isJa
              ? 'ページを離れると、確認中の天機神託データが初期化される可能性があります。'
              : '현재 화면을 벗어나면 확인 중이던 천기 신탁 내용이 초기화될 수 있습니다.'}
          </Text>

          {/* 버튼 영역 */}
          <View style={styles.buttonGroup}>
            {/* 버튼 1 (계속 머무르기 / 기본 포커스) */}
            <Pressable
              onPress={onStay}
              accessibilityRole="button"
              accessibilityLabel={isJa ? '留まる' : '계속 머무르기'}
              style={({ pressed }) => [
                styles.stayButton,
                NEON_BUTTON_GLOW,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.stayButtonText}>
                {isJa ? '留まる' : '계속 머무르기'}
              </Text>
            </Pressable>

            {/* 버튼 2 (종료하고 나가기) */}
            <Pressable
              onPress={onExit}
              accessibilityRole="button"
              accessibilityLabel={isJa ? '終了する' : '종료하고 나가기'}
              style={({ pressed }) => [
                styles.exitButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.exitButtonText}>
                {isJa ? '終了する' : '종료하고 나가기'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 0, 2, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#180408',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ff1e38',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    zIndex: 1,
  },
  emblemContainer: {
    marginBottom: 16,
  },
  emblemRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 30, 56, 0.12)',
    borderWidth: 1.5,
    borderColor: '#ff1e38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemIcon: {
    fontSize: 26,
    color: '#ff3355',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
    wordBreak: 'keep-all',
  },
  description: {
    color: '#d6a8b2',
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
    wordBreak: 'keep-all',
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  stayButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ff1e38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stayButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  exitButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#a88992',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});
