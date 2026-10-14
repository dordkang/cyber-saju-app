/**
 * [CYBER-SAJU] 실시간 AI 스트리밍(타자기 연출) 엔진 및 VIP/복채 상태 관리 유틸
 * (src/utils/streamAndVip.ts)
 * 
 * 1) VIP 무제한 패스 및 잔여 횟수 관리 (isVipMember, activateVipPass, addBonusCredits)
 * 2) 모바일 60fps 부드러운 타자기 연출 훅 (useTypewriterStream) + 탭 시 즉시 전체 완성 (Skip)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const VIP_STORAGE_KEY = 'cyber_saju_vip_active';
export const VIP_EVENT_NAME = 'cyber-saju-vip-updated';
export const CREDITS_EVENT_NAME = 'cyber-saju-credits-updated';

/**
 * VIP 무제한 패스 활성화 여부 확인
 */
export function isVipMember(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(VIP_STORAGE_KEY) === 'true';
    }
  } catch {}
  return false;
}

/**
 * VIP 무제한 패스 활성화
 */
export function activateVipPass(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VIP_STORAGE_KEY, 'true');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(VIP_EVENT_NAME, { detail: { isVip: true } }));
    }
  } catch (err) {
    console.error('Failed to activate VIP pass:', err);
  }
}

/**
 * VIP 무제한 패스 비활성화 (테스트/초기화용)
 */
export function deactivateVipPass(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(VIP_STORAGE_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(VIP_EVENT_NAME, { detail: { isVip: false } }));
    }
  } catch {}
}

/**
 * 당일 밀실 상담 사용 횟수 차감(복채 충전 / 추가 질문권 지급)
 * @param count 지급할 추가 질문 횟수 (기본 5회)
 */
export function addBonusCredits(count: number = 5): void {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const key = `cyber_saju_chamber_count_${todayStr}`;
    if (typeof localStorage !== 'undefined') {
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      const next = Math.max(0, current - count);
      localStorage.setItem(key, String(next));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CREDITS_EVENT_NAME, { detail: { added: count } }));
    }
  } catch (err) {
    console.error('Failed to add bonus credits:', err);
  }
}

/**
 * VIP 및 크레딧 상태 변경 감지 리스너 등록
 */
export function listenVipAndCredits(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener(VIP_EVENT_NAME, handler);
  window.addEventListener(CREDITS_EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(VIP_EVENT_NAME, handler);
    window.removeEventListener(CREDITS_EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

export interface TypewriterOptions {
  speed?: number; // ms per tick (default: 20ms)
  charsPerTick?: number; // characters per tick (default: 2)
  enabled?: boolean;
}

export interface TypewriterResult {
  displayedText: string;
  isStreaming: boolean;
  skip: () => void;
}

/**
 * 모바일 60fps 동기화 실시간 텍스트 타자기 연출 훅
 * - 전문(fullText) 수신 시 자연스럽게 눈앞에 글자가 찍히듯 출력
 * - 영역 탭 시 즉시 전문 완성 (skip)
 */
export function useTypewriterStream(
  fullText: string,
  options?: TypewriterOptions
): TypewriterResult {
  const { speed = 20, charsPerTick = 2, enabled = true } = options || {};

  const [displayedLength, setDisplayedLength] = useState<number>(() => {
    return enabled ? 0 : fullText.length;
  });
  const [isStreaming, setIsStreaming] = useState<boolean>(() => {
    return enabled && fullText.length > 0;
  });

  const fullTextRef = useRef(fullText);
  fullTextRef.current = fullText;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // fullText가 새로 들어오거나 변경될 때 스트리밍 초기화
  useEffect(() => {
    if (!enabled || !fullText) {
      setDisplayedLength(fullText.length);
      setIsStreaming(false);
      return;
    }

    setDisplayedLength(0);
    setIsStreaming(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = prev + charsPerTick;
        if (next >= fullText.length) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsStreaming(false);
          return fullText.length;
        }
        return next;
      });
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, enabled, speed, charsPerTick]);

  // 사용자가 탭했을 때 즉시 완성
  const skip = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDisplayedLength(fullTextRef.current.length);
    setIsStreaming(false);
  }, []);

  const displayedText = fullText.slice(0, displayedLength);

  return {
    displayedText,
    isStreaming,
    skip,
  };
}
