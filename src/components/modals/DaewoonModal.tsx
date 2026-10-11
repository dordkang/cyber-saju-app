/**
 * 일생 대운 모달 프록시 및 관심사/현실 프리셋 정의
 */

export {
  LifeTimelineModal as DaewoonModal,
  REALITY_PRESETS,
  DAEUN_INTEREST_FOCUS_MAP,
} from '../LifeTimelineModal';

export type {
  LifeTimelineModalProps as DaewoonModalProps,
  RealityPreset,
} from '../LifeTimelineModal';

/**
 * 08번 밀실 상담 섹터 강제 이동 브리지 헬퍼
 */
export function handleJumpToChamber(onClose?: () => void, onNavigateToChamber?: () => void): void {
  onClose?.();
  setTimeout(() => {
    onNavigateToChamber?.();
    if (typeof window !== 'undefined' && (window as any).scrollToSection) {
      (window as any).scrollToSection(7); // 08번 밀실 (인덱스 7)
    } else if (typeof document !== 'undefined') {
      const chamberEl =
        document.getElementById('section-chamber') ||
        (document.querySelectorAll('.card-section')[7] as HTMLElement | undefined);
      if (chamberEl) {
        chamberEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, 80);
}
