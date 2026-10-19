/**
 * 상대 거래량(RVOL) → 건물 주변 땅 원판(열기) 표현값.
 * 로그 스케일이라 0.5배와 2배가 1.0을 기준으로 대칭이 된다.
 */

/** 이 값 이하면 원판 없음 (한산) */
export const RVOL_MIN = 0.5;
/** 이 값 이상이면 최대 강도 (뉴스·이벤트급 거래) */
export const RVOL_MAX = 4;

/** 원판 반지름 범위 (월드 단위). 집에서 조정 */
export const HEAT_MIN_RADIUS = 0.8;
export const HEAT_MAX_RADIUS = 2.4;
/** 최대 강도일 때 불투명도 */
export const HEAT_MAX_OPACITY = 0.75;
/** 단일 색상, 진하기는 불투명도·크기로 표현. 집에서 조정 */
export const HEAT_COLOR = "#ff6b35";

export interface VolumeHeat {
  /** 0~1. 0이면 원판을 그리지 않는다 */
  intensity: number;
  radius: number;
  opacity: number;
  color: string;
}

/** RVOL → 강도 0~1 (log2 기준). 0.5 → 0, 1.0 → 1/3, 2.0 → 2/3, 4.0 → 1 */
export function getVolumeIntensity(relativeVolume: number): number {
  if (!Number.isFinite(relativeVolume) || relativeVolume <= RVOL_MIN) return 0;
  if (relativeVolume >= RVOL_MAX) return 1;
  return (
    (Math.log2(relativeVolume) - Math.log2(RVOL_MIN)) /
    (Math.log2(RVOL_MAX) - Math.log2(RVOL_MIN))
  );
}

export function getVolumeHeat(relativeVolume: number): VolumeHeat {
  const intensity = getVolumeIntensity(relativeVolume);
  return {
    intensity,
    radius: HEAT_MIN_RADIUS + intensity * (HEAT_MAX_RADIUS - HEAT_MIN_RADIUS),
    opacity: intensity * HEAT_MAX_OPACITY,
    color: HEAT_COLOR,
  };
}
