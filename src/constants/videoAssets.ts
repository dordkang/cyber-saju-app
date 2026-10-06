import type { FiveElement } from '../engine/types';

const PEXELS_CDN = 'https://videos.pexels.com/video-files';

export interface ReelVideoAsset {
  /** 웹 최적화 MP4 주소 (Pexels 무료 CDN, HEAD 200 / video/mp4 확인 완료) */
  uri: string;
  /** 영상 로딩 전·실패 시 비디오 아래에 깔리는 오행 톤 배경색 */
  tint: string;
  /** 원본이 가로 영상이라 세로 화면에서 중앙 크롭(cover)되는 클립 여부 */
  landscape?: boolean;
}

function clip(id: number, file: string): string {
  return `${PEXELS_CDN}/${id}/${id}-${file}.mp4`;
}

/** 기본: 따뜻한 카페 / 일상 감성 (세로 720x1280, 약 1.3MB라 즉시 재생). */
export const DEFAULT_REEL_VIDEO: ReelVideoAsset = {
  uri: clip(13736547, 'hd_720_1280_24fps'),
  tint: '#1B1410',
};

/**
 * 오행별 감성 라이프스타일 클립.
 * 목: 숲속 새벽빛 / 화: 벽난로 불빛 / 토: 찻잔에 차 따르기 / 금: 도시의 밤 / 수: 해안 파도.
 */
export const ELEMENT_REEL_VIDEO: Record<FiveElement, ReelVideoAsset> = {
  Wood: { uri: clip(10978942, 'hd_1920_1080_30fps'), tint: '#0F1A12', landscape: true },
  Fire: { uri: clip(6507522, 'hd_720_1280_25fps'), tint: '#1D0F0A' },
  Earth: { uri: clip(6955735, 'hd_720_1280_30fps'), tint: '#1A140C' },
  Metal: { uri: clip(18830025, 'sd_540_960_30fps'), tint: '#10141C' },
  Water: { uri: clip(15356530, 'hd_1920_1080_60fps'), tint: '#0B1620', landscape: true },
};

export function getElementReelVideo(element?: FiveElement | null): ReelVideoAsset {
  if (!element) return DEFAULT_REEL_VIDEO;
  return ELEMENT_REEL_VIDEO[element] ?? DEFAULT_REEL_VIDEO;
}
