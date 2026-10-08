import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * 웹은 Vibration API로 폴백하고, 네이티브는 expo-haptics를 쓴다.
 * 실패해도 인터랙션을 막지 않는다.
 */
export async function playHaptic(kind: 'snap' | 'tap'): Promise<void> {
  try {
    if (kind === 'snap') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    return;
  } catch {
    // 웹·미지원 기기
  }
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(kind === 'snap' ? 22 : 10);
    }
  } catch {
    // 햅틱이 없어도 화면은 그대로 동작한다.
  }
}
