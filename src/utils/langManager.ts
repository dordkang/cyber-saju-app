/**
 * [CYBER-SAJU] 언어 우선순위 강제 락 매니저 (src/utils/langManager.ts)
 * 
 * 언어 판독 우선순위:
 * 1순위: 웹 설정에서 수동으로 바꾼 값 (localStorage 'cyber_saju_lang')
 * 2순위: 최초 접속 시 OS/브라우저 언어 자동 감지 (navigator.language)
 */

export type ActiveLanguage = 'kr' | 'jp';

export const STORAGE_KEY_LANG = 'cyber_saju_lang';

/**
 * 1순위: 웹 수동 설정 (localStorage)
 * 2순위: OS / 브라우저 자동 감지 (navigator.language)
 * 기본값: 'kr'
 */
export function getActiveLanguage(): ActiveLanguage {
  // 1순위: 웹 설정에서 수동으로 바꾼 값 (localStorage)
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const manualLang = localStorage.getItem(STORAGE_KEY_LANG);
      if (manualLang === 'kr' || manualLang === 'jp') {
        return manualLang;
      }
      // 하위 호환성 매핑 ('ja' -> 'jp', 'ko' -> 'kr')
      if (manualLang === 'ja') {
        return 'jp';
      }
      if (manualLang === 'ko') {
        return 'kr';
      }
    } catch {
      // 보안 또는 저장소 접근 예외 무시
    }
  }

  // 2순위: 최초 접속 시 OS/브라우저 언어 자동 감지
  const browserLang =
    (typeof navigator !== 'undefined' &&
      (navigator.language || (navigator as any).userLanguage || (navigator.languages && navigator.languages[0]))) ||
    'ko';

  if (browserLang.toLowerCase().startsWith('ja')) {
    return 'jp';
  }

  return 'kr'; // 기본값
}

/**
 * 언어 수동 변경 및 저장
 */
export function setActiveLanguage(lang: 'kr' | 'jp' | 'ko' | 'ja'): void {
  const normalized: ActiveLanguage = (lang === 'jp' || lang === 'ja') ? 'jp' : 'kr';
  const localeVal = normalized === 'jp' ? 'ja' : 'ko';

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, normalized);
      window.dispatchEvent(new CustomEvent('cyber_saju_lang_change', { detail: localeVal }));
    } catch {
      // ignore
    }
  }
}
