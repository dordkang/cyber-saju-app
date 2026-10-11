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
  const executeJump = () => {
    onNavigateToChamber?.();
    if (typeof window !== 'undefined') {
      if ((window as any).scrollToSection) {
        (window as any).scrollToSection(7);
      }
      const target =
        document.getElementById('section-chamber') ||
        document.querySelector('[data-section="08"]');
      if (target) {
        try {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {}
      }
      window.dispatchEvent(new CustomEvent('cyber_saju_scroll_to_section', { detail: 7 }));
    }
  };
  setTimeout(executeJump, 50);
  setTimeout(executeJump, 180);
}
