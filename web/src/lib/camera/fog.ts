/**
 * 안개 범위를 카메라 거리에 맞춘다. 지도(보는 점 근처)는 맑게, 그 너머 먼 바다만 하늘색으로 섞인다.
 * 예전 고정값(110~260)은 카메라 거리 약 99 기준이었다 → 비율 1.1배 ~ 2.6배를 그대로 쓴다.
 * 첫 화면 거리가 화면 비율마다 달라져서(휴대폰 세로는 200 넘게) 고정값이면 지도가 안개에 묻힌다.
 */
export const FOG_NEAR_FACTOR = 1.1;
export const FOG_FAR_FACTOR = 2.6;

export function getFogRange(cameraDistance: number): { near: number; far: number } {
  const d = Math.max(1, cameraDistance);
  return { near: d * FOG_NEAR_FACTOR, far: d * FOG_FAR_FACTOR };
}
