/**
 * 첫 화면 구도: 미국 본토(+ 알래스카·하와이 삽입 지도)가 화면 비율과 상관없이 한 화면에 들어오게
 * 카메라 거리를 계산한다. 세로로 긴 화면(휴대폰)일수록 좌우가 좁아서 더 멀리 뺀다.
 */
export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** 투영 좌표로 잰 본토 끝 (서: 캘리포니아 x≈−49, 동: 메인 x≈51, 북: 워싱턴 z≈−33, 남: 키웨스트 z≈33) + 여유 */
export const MAP_BOUNDS: MapBounds = { minX: -51, maxX: 53, minZ: -35, maxZ: 36 };

export interface FitViewOptions {
  /** 화면 가로 ÷ 세로 */
  aspect: number;
  /** 카메라 세로 시야각(도) — Canvas camera.fov */
  fovDeg: number;
  /** 땅에서 올려다본 카메라 각도(도). 90이면 바로 위 */
  pitchDeg?: number;
  /** 가장자리 여백 배율 */
  margin?: number;
  bounds?: MapBounds;
}

export interface FitView {
  target: [number, number, number];
  position: [number, number, number];
  distance: number;
}

/**
 * 원근 때문에 카메라에 가까운 아래쪽 가장자리가 가장 크게 보인다 → 그 가장자리가 들어가는 거리로 맞춘다.
 * 위아래: 가까운 가장자리(중심에서 halfD 앞)가 세로 시야 안에 → d ≥ halfD·(sinθ/t + cosθ)
 * 좌우: 가까운 가장자리에서 좌우 끝이 가로 시야 안에 → d ≥ halfW/(t·aspect) + halfD·cosθ
 * (t = tan(세로 시야각/2), θ = 카메라 각도)
 */
export function fitMapView({
  aspect,
  fovDeg,
  pitchDeg = 50,
  margin = 1.06,
  bounds = MAP_BOUNDS,
}: FitViewOptions): FitView {
  const t = Math.tan(((fovDeg / 2) * Math.PI) / 180);
  const theta = (pitchDeg * Math.PI) / 180;
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  const halfW = (bounds.maxX - bounds.minX) / 2;
  const halfD = (bounds.maxZ - bounds.minZ) / 2;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  const safeAspect = Math.max(aspect, 0.2);
  const forDepth = halfD * (sin / t + cos);
  const forWidth = halfW / (t * safeAspect) + halfD * cos;
  const distance = Math.max(forDepth, forWidth) * margin;

  return {
    target: [cx, 0, cz],
    // 남쪽 하늘에서 북쪽을 내려다본다 (z+ = 남쪽)
    position: [cx, distance * sin, cz + distance * cos],
    distance,
  };
}
