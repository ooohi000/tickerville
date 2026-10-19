import { geoAlbersUsa } from "d3-geo";
import type { WorldPoint } from "@/types";

/** 본토 폭이 약 100 월드 단위가 되도록 맞춘 배율 (docs/spec.md 참고) */
export const MAP_SCALE = 140;

/**
 * 지도 메시와 건물이 같은 투영을 써야 위치가 맞는다.
 * 지도 쪽에서도 반드시 이 함수로 투영을 받아 쓴다.
 */
export function createUsProjection() {
  return geoAlbersUsa().scale(MAP_SCALE).translate([0, 0]);
}

const projection = createUsProjection();

/**
 * 위경도 → three.js 월드 좌표 (xz 평면).
 * 미국 영역 밖이면 null.
 */
export function projectLatLng(lat: number, lng: number): WorldPoint | null {
  const p = projection([lng, lat]);
  if (!p) return null;
  const [x, y] = p;
  // d3는 화면 좌표라 y가 아래(+) = 남쪽. 그대로 z로 쓰면 z+가 남쪽이 된다.
  return { x, z: y };
}
