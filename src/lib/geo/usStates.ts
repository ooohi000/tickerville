import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import statesTopology from "us-atlas/states-10m.json";
import type { WorldPoint } from "@/types";
import { isPointInPolygon } from "./polygon";
import { projectLatLng } from "./project";

/** 지도(땅) 두께. 건물은 이 높이 위에 선다 */
export const MAP_HEIGHT = 0.6;

export interface StatePolygon {
  outer: WorldPoint[];
  holes: WorldPoint[][];
}

export interface StateShape {
  /** FIPS 코드 ("06" = California) */
  id: string;
  name: string;
  /** 본토 + 섬들 */
  polygons: StatePolygon[];
}

/**
 * GeoJSON 고리 [lng, lat][] → 월드 좌표.
 * 투영 밖 점은 버리고, 닫는 중복 끝점은 뺀다 (three.js Shape는 자동으로 닫음).
 */
export function projectRing(ring: readonly Position[]): WorldPoint[] {
  const points: WorldPoint[] = [];
  for (const [lng, lat] of ring) {
    const p = projectLatLng(lat, lng);
    if (p) points.push(p);
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length > 1 && first.x === last.x && first.z === last.z) points.pop();
  return points;
}

type StateFeature = Feature<Polygon | MultiPolygon, { name: string }>;

/** topojson 주 경계 → 주별 월드 좌표 다각형. 투영 범위 밖(푸에르토리코 등)은 제외 */
export function buildStateShapes(topology: Topology): StateShape[] {
  const collection = feature(
    topology,
    topology.objects.states as GeometryCollection<{ name: string }>,
  );

  const shapes: StateShape[] = [];
  for (const f of collection.features as StateFeature[]) {
    const raw = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const polygons: StatePolygon[] = [];
    for (const [outerRing, ...holeRings] of raw) {
      const outer = projectRing(outerRing);
      if (outer.length < 3) continue;
      const holes = holeRings.map(projectRing).filter((h) => h.length >= 3);
      polygons.push({ outer, holes });
    }
    if (polygons.length > 0) {
      shapes.push({ id: String(f.id), name: f.properties.name, polygons });
    }
  }
  return shapes;
}

let cache: StateShape[] | null = null;

/** 미국 50개 주 + DC. 처음 한 번만 계산 */
export function getUsStates(): StateShape[] {
  cache ??= buildStateShapes(statesTopology as unknown as Topology);
  return cache;
}

/** 월드 좌표가 속한 주. 바다·국외면 null */
export function findStateAt(p: WorldPoint, states = getUsStates()): StateShape | null {
  return states.find((s) => s.polygons.some((poly) => isPointInPolygon(p, poly))) ?? null;
}

/**
 * three.js Shape용 2D 좌표 변환.
 * Shape는 xy 평면에 만들고 x축 -90° 회전해서 눕히는데, 그때 shape의 y가 월드의 -z가 된다.
 */
export function toShapeXY(p: WorldPoint): [number, number] {
  return [p.x, -p.z];
}

/**
 * 주 경계선을 LineSegments용 좌표 배열로. [x1,y,z1, x2,y,z2, ...]
 * 고리마다 마지막 점에서 첫 점으로 닫는다.
 */
export function getBorderPositions(states: readonly StateShape[], y: number): Float32Array {
  const out: number[] = [];
  const pushRing = (ring: readonly WorldPoint[]) => {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      out.push(a.x, y, a.z, b.x, y, b.z);
    }
  };
  for (const s of states) {
    for (const poly of s.polygons) {
      pushRing(poly.outer);
      poly.holes.forEach(pushRing);
    }
  }
  return new Float32Array(out);
}
