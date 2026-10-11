import { useCallback, useEffect, useRef, useState } from 'react';
import type { SajuResult } from '../engine/types';
import type { PartnerProfile } from '../database/db';
import { calculateSaju } from '../engine/calculator';
import { formatSajuTerm } from '../utils/sajuTerms';

const GATEWAY_URL = 'https://saju-edge-gateway.cybersaju.workers.dev';
const REQUEST_TIMEOUT_MS = 9000;

export interface UseSajuAdviceParams {
  userProfile?: {
    birthDate?: string;
    birthTime?: string;
    gender?: string;
    dayMaster?: string;
    pillars?: any;
    elementsRatio?: any;
  } | null;
  saju?: SajuResult | null;
  selectedDate?: Date;
  category?: string;
  userInput?: string;
  partnerProfile?: PartnerProfile | null;
  partnerSaju?: SajuResult | null;
  lang?: 'kr' | 'jp' | 'ko' | 'ja';
  autoFetch?: boolean;
  fallbackText?: string;
}

export interface UseSajuAdviceResult {
  advice: string;
  headline: string;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  isAiGenerated: boolean;
  refetch: () => Promise<void>;
}

// 응답 캐시 (동일 파라미터 중복 호출 방지)
const adviceCache = new Map<string, { advice: string; isAi: boolean }>();

export function useSajuAdvice({
  userProfile,
  saju,
  selectedDate = new Date(),
  category = 'wealth',
  userInput = '',
  partnerProfile,
  partnerSaju,
  lang = 'kr',
  autoFetch = true,
  fallbackText = '',
}: UseSajuAdviceParams): UseSajuAdviceResult {
  const isJa = lang === 'jp' || lang === 'ja';
  const effectiveLang: 'kr' | 'jp' = isJa ? 'jp' : 'kr';
  const loadingMessage = isJa
    ? '天機を演算中...（神託を受信しています）'
    : '옥통자가 천기를 관조하는 중...';

  const [advice, setAdvice] = useState<string>(fallbackText);
  const [headline, setHeadline] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>(null);

  const targetDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const dayMaster = saju?.dayMaster ?? userProfile?.dayMaster ?? '戊';

  const cacheKey = JSON.stringify({
    dayMaster,
    targetDateStr,
    category,
    userInput: userInput.trim(),
    partnerId: partnerProfile?.id ?? partnerProfile?.alias ?? '',
    lang: effectiveLang,
  });

  const fetchAdvice = useCallback(async () => {
    // 이미 캐시가 있으면 즉시 반환
    if (adviceCache.has(cacheKey)) {
      const cached = adviceCache.get(cacheKey)!;
      setAdvice(cached.advice);
      setIsAiGenerated(cached.isAi);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      // 일진 계산
      let dailyGanji = '';
      try {
        const omen = calculateSaju(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate(),
          12,
          0,
          true
        );
        dailyGanji = `${omen.pillars.day.stem}${omen.pillars.day.branch}`;
      } catch {}

      const payload = {
        lang: effectiveLang,
        dayMaster,
        dailyGanji,
        pillars: saju?.pillars ?? userProfile?.pillars,
        elementsRatio: saju?.elementsRatio ?? userProfile?.elementsRatio,
        eventCategory: category,
        userLore: userInput.trim(),
        partnerInfo: partnerProfile
          ? {
              alias: partnerProfile.alias,
              relation: partnerProfile.relation,
              birthDate: partnerProfile.birthDate,
              gender: partnerProfile.gender,
              dayMaster: partnerSaju?.dayMaster,
            }
          : undefined,
      };

      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && typeof data.analysis === 'string' && data.analysis.trim()) {
        const formatted = formatSajuTerm(data.analysis.trim(), effectiveLang);
        setAdvice(formatted);
        setIsAiGenerated(!data.fallback);
        adviceCache.set(cacheKey, { advice: formatted, isAi: !data.fallback });
      } else if (fallbackText) {
        setAdvice(formatSajuTerm(fallbackText, effectiveLang));
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError(err?.message ?? 'Fetch error');
        if (fallbackText) {
          setAdvice(formatSajuTerm(fallbackText, effectiveLang));
        }
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [cacheKey, dayMaster, effectiveLang, fallbackText, partnerProfile, partnerSaju, saju, selectedDate, userProfile, userInput, category]);

  useEffect(() => {
    if (!autoFetch) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // userInput 변경 시 500ms 디바운스, 그 외 조건 변경 시 즉시 호출
    const delay = userInput ? 500 : 50;
    debounceTimerRef.current = setTimeout(() => {
      void fetchAdvice();
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [autoFetch, fetchAdvice, userInput]);

  // 첫 문장 추출하여 headline 생성
  useEffect(() => {
    if (!advice) {
      setHeadline('');
      return;
    }
    const lines = advice.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] ?? '';
    const cleanKicker = firstLine.length > 50 ? `${firstLine.slice(0, 48)}...` : firstLine;
    setHeadline(cleanKicker);
  }, [advice]);

  return {
    advice: advice || fallbackText,
    headline,
    isLoading,
    loadingMessage,
    error,
    isAiGenerated,
    refetch: fetchAdvice,
  };
}
