import type { WorldPoint } from "@/types";

/** 점이 닫힌 고리(ring) 안에 있는지 — ray casting. 고리 끝점 중복 여부와 무관 */
export function isPointInRing(p: WorldPoint, ring: readonly WorldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    const crosses = a.z > p.z !== b.z > p.z;
    if (crosses && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/** 바깥 고리 안이고 구멍(hole)들 밖이면 true */
export function isPointInPolygon(
  p: WorldPoint,
  polygon: { outer: readonly WorldPoint[]; holes: readonly (readonly WorldPoint[])[] },
): boolean {
  return isPointInRing(p, polygon.outer) && !polygon.holes.some((h) => isPointInRing(p, h));
}
