import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useLocale, type Locale } from '../locales';
import { playHaptic } from './reels/haptics';

const IS_WEB = Platform.OS === 'web';

export interface LanguageSwitcherProps {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style, compact = false }) => {
  const { locale, setLocale } = useLocale();

  const handleSelect = (next: Locale) => {
    if (next === locale) return;
    void playHaptic('tap');
    setLocale(next);
  };

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        style,
      ]}
      accessibilityRole="radiogroup"
      accessibilityLabel="언어 선택 / 言語選択"
    >
      <Pressable
        onPress={() => handleSelect('ko')}
        style={[
          styles.pill,
          compact && styles.pillCompact,
          locale === 'ko' && styles.pillActiveKo,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: locale === 'ko' }}
        accessibilityLabel="한국어"
      >
        <Text style={[styles.flag, compact && styles.flagCompact]}>🇰🇷</Text>
        <Text
          style={[
            styles.label,
            compact && styles.labelCompact,
            locale === 'ko' ? styles.labelActiveKo : styles.labelInactive,
          ]}
        >
          KR
        </Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        onPress={() => handleSelect('ja')}
        style={[
          styles.pill,
          compact && styles.pillCompact,
          locale === 'ja' && styles.pillActiveJa,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: locale === 'ja' }}
        accessibilityLabel="日本語"
      >
        <Text style={[styles.flag, compact && styles.flagCompact]}>🇯🇵</Text>
        <Text
          style={[
            styles.label,
            compact && styles.labelCompact,
            locale === 'ja' ? styles.labelActiveJa : styles.labelInactive,
          ]}
        >
          JP
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 24, 0.88)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.32)',
    paddingHorizontal: 3,
    paddingVertical: 2,
    ...(IS_WEB
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0 16px rgba(0, 240, 255, 0.12), inset 0 0 8px rgba(0, 240, 255, 0.05)',
        } as unknown as ViewStyle)
      : null),
  },
  containerCompact: {
    paddingHorizontal: 2,
    paddingVertical: 1.5,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    marginHorizontal: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
  },
  pillCompact: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  pillActiveKo: {
    backgroundColor: 'rgba(255, 42, 75, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 75, 0.65)',
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 10px rgba(255, 42, 75, 0.35)',
        } as unknown as ViewStyle)
      : null),
  },
  pillActiveJa: {
    backgroundColor: 'rgba(0, 240, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.65)',
    ...(IS_WEB
      ? ({
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.35)',
        } as unknown as ViewStyle)
      : null),
  },
  flag: {
    fontSize: 10.5,
  },
  flagCompact: {
    fontSize: 9.5,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  labelCompact: {
    fontSize: 9,
  },
  labelActiveKo: {
    color: '#FF4D6D',
  },
  labelActiveJa: {
    color: '#00F0FF',
  },
  labelInactive: {
    color: '#7E8B9B',
  },
});
