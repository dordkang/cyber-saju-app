/**
 * [CYBER-SAJU] 3D 네온 홀로그램 숨결 & 응원 파동(Pulse & Nod Animation) 모션 렌더러
 * (src/components/resonance/CelebrityAvatarHologram.tsx)
 * 
 * - 60fps 최적화 모바일 & 웹 인터랙티브 아바타
 * - <video preload="none" loop muted playsInline> 지연 로딩 구조 지원 (비디오 에셋 있을 시 부드럽게 재생)
 * - 로컬 비디오 에셋 부재 시에도 '3D 네온 홀로그램 숨결 & 응원 파동(Pulse & Nod Animation)' 이펙트 기본 가동
 * - 3초 주기 숨결 펄스 및 터치/클릭 시 반응형 끄덕임(Nod) & 햅틱 피드백
 * - 셀럽 고유 테마 컬러(#00F5D4, #FF2A4B, #FFB800 등)와 동적 연동되는 사이버 네온 오라
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import type { CelebrityData } from '../../data/celebrityResonance';
import { playHaptic } from '../reels/haptics';

const IS_WEB = Platform.OS === 'web';

export interface CelebrityAvatarHologramProps {
  celebrity: CelebrityData;
  size?: number;
  videoUrl?: string | null;
  onTap?: () => void;
  style?: ViewStyle;
}

export const CelebrityAvatarHologram = memo(function CelebrityAvatarHologram({
  celebrity,
  size = 110,
  videoUrl,
  onTap,
  style,
}: CelebrityAvatarHologramProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // 3초 주기 숨결/끄덕임(Pulse & Nod) 애니메이션 값 (0 -> 1 -> 0)
  const breathAnim = useRef(new Animated.Value(0)).current;
  // 터치 시 일시적 끄덕임(Nod Reaction)
  const nodAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 3초 (3000ms) 루프 애니메이션
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [breathAnim]);

  const handlePress = () => {
    void playHaptic('tap');
    // 반응형 3D 끄덕임(Nod) 즉각 트리거
    Animated.sequence([
      Animated.timing(nodAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(nodAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start();

    onTap?.();
  };

  // 3D 회전 및 펄스 스케일 변환
  const scale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.04],
  });

  const translateY = Animated.add(
    breathAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -4],
    }),
    nodAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8], // 끄덕임 누름
    })
  );

  const rotateZ = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-1deg', '1deg', '-1deg'],
  });

  const auraOpacity = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  const waveScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  const waveOpacity = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.2, 0],
  });

  const halfSize = size / 2;

  return (
    <Pressable onPress={handlePress} style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* 1. 외곽 응원 파동 펄스 링 (Wave Ripple) */}
      <Animated.View
        style={[
          styles.waveRing,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            borderColor: celebrity.themeColor,
            opacity: waveOpacity,
            transform: [{ scale: waveScale }],
          },
        ]}
      />

      {/* 2. 네온 글로우 오라 배경 */}
      <Animated.View
        style={[
          styles.glowAura,
          {
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            backgroundColor: celebrity.glowColor,
            opacity: auraOpacity,
          },
        ]}
      />

      {/* 3. 3D 홀로그램 아바타 컨테이너 */}
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            borderColor: celebrity.themeColor,
            transform: [{ scale }, { translateY }, { rotate: rotateZ }],
          },
          IS_WEB
            ? ({
                boxShadow: `0 0 24px ${celebrity.glowColor}, inset 0 0 16px rgba(0,0,0,0.45)`,
              } as unknown as ViewStyle)
            : null,
        ]}
      >
        {/* 비디오 에셋이 제공되었을 때 (지연 로딩 지원) */}
        {videoUrl && !videoError ? (
          <View style={StyleSheet.absoluteFill}>
            <video
              src={videoUrl}
              preload="none"
              loop
              muted
              playsInline
              autoPlay
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setVideoError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: halfSize,
                opacity: videoLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
              }}
            />
          </View>
        ) : null}

        {/* 로컬 비디오가 없거나 로딩 중일 때: 3D 네온 홀로그램 렌더러 */}
        {(!videoUrl || !videoLoaded || videoError) && (
          <View style={[styles.hologramContent, { backgroundColor: `${celebrity.themeColor}18` }]}>
            {/* 홀로그램 주파수 스캔라인 이펙트 */}
            <View style={styles.scanlineOverlay} />

            {/* 메인 이모지 아바타 */}
            <Text style={[styles.avatarEmoji, { fontSize: Math.round(size * 0.44) }]}>
              {celebrity.emojiIcon}
            </Text>

            {/* 홀로그램 하단 십신 미니 태그 */}
            <View
              style={[
                styles.miniStemTag,
                {
                  borderColor: celebrity.themeColor,
                  backgroundColor: 'rgba(10, 5, 7, 0.85)',
                },
              ]}
            >
              <Text style={[styles.miniStemText, { color: celebrity.themeColor }]}>
                {celebrity.element} · 3s NOD
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  waveRing: {
    position: 'absolute',
    borderWidth: 1.5,
    pointerEvents: 'none',
  },
  glowAura: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  avatarContainer: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0c0608',
  },
  hologramContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanlineOverlay: {
    ...(StyleSheet.absoluteFill as any),
    opacity: 0.18,
    ...(IS_WEB
      ? ({
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)',
        } as unknown as ViewStyle)
      : null),
  },
  avatarEmoji: {
    textAlign: 'center',
    zIndex: 2,
  },
  miniStemTag: {
    position: 'absolute',
    bottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 3,
  },
  miniStemText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
