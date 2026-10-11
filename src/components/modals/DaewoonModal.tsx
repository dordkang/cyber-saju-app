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
export function handleJumpToChamber(
  onClose?: () => void,
  onNavigateToChamber?: () => void,
  e?: any
): void {
  e?.preventDefault?.();
  e?.stopPropagation?.();

  onNavigateToChamber?.();

  // 1. 먼저 스크롤을 08번 밀실로 강제 이동 시도
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const chamberEl =
      document.getElementById('section-chamber') ||
      document.querySelector('[data-section="08"], .shaman-chamber-card') ||
      (document.querySelectorAll('.card-section')[7] as HTMLElement | undefined);

    if (chamberEl) {
      chamberEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if ((window as any).scrollToSection) {
      (window as any).scrollToSection(7);
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    if ((window as any).scrollToSection) {
      (window as any).scrollToSection(7);
    }
    window.dispatchEvent(new CustomEvent('cyber_saju_scroll_to_section', { detail: 7 }));
  }

  // 2. 약간의 지연 후 모달 닫기 (시각적 부드러움 및 DOM 충돌 방지)
  setTimeout(() => {
    onClose?.();
  }, 150);
}
