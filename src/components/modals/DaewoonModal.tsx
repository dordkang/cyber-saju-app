/**
 * 일생 대운 모달 프록시 및 관심사/현실 프리셋 정의
 */

export {
  LifeTimelineModal as DaewoonModal,
  REALITY_PRESETS,
  DAEUN_INTEREST_FOCUS_MAP,
  translateRealityToJa,
} from '../LifeTimelineModal';

export type {
  LifeTimelineModalProps as DaewoonModalProps,
  RealityPreset,
} from '../LifeTimelineModal';

/**
 * 08번 밀실 상담 섹터 강제 이동 브리지 헬퍼 (전역 커스텀 이벤트 발사 방식)
 */
export function handleJumpToChamber(
  onClose?: () => void,
  onNavigateToChamber?: () => void,
  e?: any
): void {
  e?.preventDefault?.();
  e?.stopPropagation?.();

  // 1. 모달 먼저 닫기
  onNavigateToChamber?.();
  onClose?.();

  // 2. 릴스 컨테이너에 08번 섹터(인덱스 7)로 이동할 것을 알리는 전역 이벤트 발사
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      // 방법 0: 전역 인덱스 제어 함수 호출 (State-based Index Jump)
      if ((window as any).jumpToReelIndex) {
        (window as any).jumpToReelIndex(7);
      }

      // 방법 A: 전역 함수 호출
      if ((window as any).scrollToSection) {
        (window as any).scrollToSection(7);
      } else if ((window as any).jumpToSection) {
        (window as any).jumpToSection(7);
      }

      // 방법 B: 커스텀 이벤트 디스패치
      window.dispatchEvent(new CustomEvent('cyber-saju-jump', { detail: { index: 7 } }));
      window.dispatchEvent(new CustomEvent('cyber_saju_scroll_to_section', { detail: 7 }));

      // 방법 C: DOM 강제 점프 폴백
      if (typeof document !== 'undefined') {
        const chamberEl =
          document.getElementById('section-chamber') ||
          (document.querySelectorAll('.card-section, section')[7] as HTMLElement | undefined) ||
          document.querySelector('[data-section="08"], .shaman-chamber-card');
        if (chamberEl) {
          chamberEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }, 100);
}
