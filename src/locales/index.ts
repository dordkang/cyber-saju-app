import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { Locale, LocaleDictionary } from './types';
import { ko } from './ko';
import { ja } from './ja';

export * from './types';
export { ko } from './ko';
export { ja } from './ja';

export const DICTIONARY: Record<Locale, LocaleDictionary> = {
  ko,
  ja,
};

const STORAGE_KEY = 'cyber_saju_lang';

export function detectInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ko' || saved === 'ja') {
        return saved;
      }
      const nav =
        (typeof navigator !== 'undefined' &&
          (navigator.language || (navigator.languages && navigator.languages[0]))) ||
        '';
      if (nav.toLowerCase().startsWith('ja')) {
        return 'ja';
      }
    } catch {
      // ignore security/storage errors
    }
  }
  return 'ko';
}

let activeLocale: Locale = detectInitialLocale();
const listeners = new Set<(loc: Locale) => void>();

export function getLocale(): Locale {
  return activeLocale;
}

export function setLocale(next: Locale): void {
  if (activeLocale === next) return;
  activeLocale = next;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent('cyber_saju_lang_change', { detail: next }));
    } catch {
      // ignore
    }
  }
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch (e) {
      console.error(e);
    }
  });
}

export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
  isJa: boolean;
  t: LocaleDictionary;
} {
  const [locale, setLocal] = useState<Locale>(activeLocale);

  useEffect(() => {
    const handler = (next: Locale) => setLocal(next);
    listeners.add(handler);

    const onCustomEvent = (e: any) => {
      if (e?.detail && (e.detail === 'ko' || e.detail === 'ja')) {
        setLocal(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cyber_saju_lang_change', onCustomEvent);
    }

    return () => {
      listeners.delete(handler);
      if (typeof window !== 'undefined') {
        window.removeEventListener('cyber_saju_lang_change', onCustomEvent);
      }
    };
  }, []);

  return {
    locale,
    setLocale,
    isJa: locale === 'ja',
    t: DICTIONARY[locale] ?? DICTIONARY.ko,
  };
}

export function getDictionary(overrideLocale?: Locale): LocaleDictionary {
  const loc = overrideLocale || activeLocale;
  return DICTIONARY[loc] ?? DICTIONARY.ko;
}

export function t<K extends keyof LocaleDictionary>(
  key: K,
  overrideLocale?: Locale
): LocaleDictionary[K] {
  const loc = overrideLocale || activeLocale;
  const dict = DICTIONARY[loc] ?? DICTIONARY.ko;
  return dict[key];
}

/** 𝕏 (Twitter) Web Intent URL 생성 및 오픈 */
export function openTwitterShare({
  celebName,
  rate,
  locale = activeLocale,
  appUrl,
}: {
  celebName: string;
  rate: number;
  locale?: Locale;
  appUrl?: string;
}): void {
  const shareText = DICTIONARY[locale].twitterShareText(celebName, rate);
  const targetUrl =
    appUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://cyber-saju.web.app');

  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(targetUrl)}&hashtags=${encodeURIComponent(
    'サイバー四柱推命,魂の共鳴,CYBERSAJU'
  )}`;

  if (typeof window !== 'undefined') {
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  } else {
    void Linking.openURL(intentUrl);
  }
}
