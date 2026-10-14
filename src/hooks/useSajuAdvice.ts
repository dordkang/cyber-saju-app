import { useCallback, useEffect, useRef, useState } from 'react';
import type { SajuResult } from '../engine/types';
import type { PartnerProfile } from '../database/db';
import { calculateSaju } from '../engine/calculator';
import { formatSajuTerm } from '../utils/sajuTerms';
import { getActiveLanguage } from '../utils/langManager';

const GATEWAY_URL = 'https://saju-edge-gateway.cybersaju.workers.dev';
const REQUEST_TIMEOUT_MS = 9000;

export interface CurrentDaewoonInfo {
  ageRange: string;
  ganji: string;
  stemGod: string;
  branchGod: string;
}

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
  voiceStyle?: string;
  currentDaewoon?: CurrentDaewoonInfo | null;
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
  lang,
  autoFetch = true,
  fallbackText = '',
  voiceStyle,
  currentDaewoon,
}: UseSajuAdviceParams): UseSajuAdviceResult {
  const activeLang = getActiveLanguage();
  const effectiveLang: 'kr' | 'jp' = (lang === 'jp' || lang === 'ja')
    ? 'jp'
    : (lang === 'kr' || lang === 'ko')
      ? 'kr'
      : activeLang;
  const isJa = effectiveLang === 'jp';

  // 모든 AI 호출의 기본 화법은 '명리 심리 카운슬러 (사이버 신동 - 정중 경어체)' 단일 모드로 고정
  const effectiveVoiceStyle = 'shaman';

  const loadingMessage = isJa
    ? '神童が天機を演算中...'
    : '사이버 신동이 천기를 연산 중...';

  const [advice, setAdvice] = useState<string>(fallbackText);
  const [headline, setHeadline] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>(null);

  const targetDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const dayMaster = saju?.dayMaster ?? userProfile?.dayMaster ?? '戊';

  const storedUserName = typeof localStorage !== 'undefined' ? (localStorage.getItem('cyber_saju_user_name') || '') : '';

  const cacheKey = JSON.stringify({
    userName: storedUserName,
    dayMaster,
    targetDateStr,
    category,
    userInput: userInput.trim(),
    partnerId: partnerProfile?.id ?? partnerProfile?.alias ?? '',
    lang: effectiveLang,
    voiceStyle: effectiveVoiceStyle,
    daewoon: currentDaewoon ? `${currentDaewoon.ganji}_${currentDaewoon.ageRange}` : '',
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
        userName: storedUserName,
        lang: effectiveLang,
        dayMaster,
        dailyGanji,
        pillars: saju?.pillars ?? userProfile?.pillars,
        elementsRatio: saju?.elementsRatio ?? userProfile?.elementsRatio,
        eventCategory: category,
        userLore: userInput.trim(),
        voiceStyle: effectiveVoiceStyle,
        agentType: 'DOKSA',
        currentDaewoon: currentDaewoon ?? undefined,
        currentDaewoonDirective: currentDaewoon
          ? (effectiveLang === 'jp'
              ? `【現在通過中の10年大運: ${currentDaewoon.ganji} (${currentDaewoon.ageRange}) / 通変星: ${currentDaewoon.stemGod}·${currentDaewoon.branchGod}】\n${storedUserName ? `${storedUserName}様` : 'ご縁者様'}の命式元局とともに大運の流れを必ず考慮してください。事業、金運、人生の変曲点、転職などを問う場合、「今通過していらっしゃる${currentDaewoon.ganji}大運の気運がこうであるから…」と大運の大きな潮流を紐解き、温かく現実的な処方箋を授けてください。`
              : `[현재 지나고 있는 10년 대운: ${currentDaewoon.ganji} (${currentDaewoon.ageRange}) / 십신: ${currentDaewoon.stemGod}·${currentDaewoon.branchGod}]\n${storedUserName ? `${storedUserName} 님` : '인연자 님'}의 사주 원국과 함께 이 대운을 반드시 고려하십시오. 사업, 돈, 변곡점, 이직 등을 짚을 때 '${storedUserName ? `${storedUserName} 님` : '인연자 님'}께서 지금 지나고 계신 ${currentDaewoon.ganji} 대운의 기운이 이러하니...'라며 대운의 큰 흐름을 풀어주고 따뜻하고 현실적인 명리 처방전을 제시해 주십시오.`)
          : undefined,
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
  }, [cacheKey, dayMaster, effectiveLang, effectiveVoiceStyle, fallbackText, partnerProfile, partnerSaju, saju, selectedDate, userProfile, userInput, category, currentDaewoon]);

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

  // 간결한 작전 타이틀로 headline 설정 (본문 첫 문장 중복 노출 제거)
  useEffect(() => {
    setHeadline(effectiveLang === 'jp' ? '【明日の作戦指針】神童の一刀両断' : '【내일의 작전 지침】옥동자 일도양단');
  }, [effectiveLang]);

  // 언어 변경 시 또는 fallbackText 갱신 시 상태 동기화 및 구 캐시 오염 차단
  const prevLangRef = useRef(effectiveLang);
  useEffect(() => {
    if (prevLangRef.current !== effectiveLang) {
      prevLangRef.current = effectiveLang;
      setAdvice(fallbackText);
      setIsAiGenerated(false);
    }
  }, [effectiveLang, fallbackText]);

  useEffect(() => {
    if (!isAiGenerated) {
      setAdvice(fallbackText);
    } else if (effectiveLang === 'jp' && /[가-힣]/.test(advice)) {
      setAdvice(fallbackText);
      setIsAiGenerated(false);
    }
  }, [fallbackText, isAiGenerated, effectiveLang, advice]);

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
