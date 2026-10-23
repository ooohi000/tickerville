import { sortBySize } from "@/lib/company/sort";
import { projectLatLng } from "@/lib/geo/project";
import { findStateAt } from "@/lib/geo/usStates";
import type { Company, Region, WorldPoint } from "@/types";
import { assignRegions } from "./assignRegions";

/**
 * 지역 안 기업은 정확한 위경도 대신 "도시 블록"에 줄 세운다 (부루마블 도시 칸).
 * 이 지도에서 중요한 건 번지가 아니라 지역이라서, 같은 동네 본사(AT&T·텍사스 인스트루먼트처럼 수백 m)가
 * 겹치지 않는 게 더 중요하다. 정확한 주소는 상세 패널에 있다.
 *
 * - 자리는 매출 순서로 한 번만 정한다 (높이 기준 토글을 바꿔도 자리는 고정, 높이만 변한다)
 * - 가장 큰 기업이 블록 가운데, 나머지는 나선 순서로 바깥 칸을 채운다
 * - 칸 크기 = 가장 큰 건물 폭(1.0) + 여유 → 계산상 겹침이 생기지 않는다
 * - 바다·호수 칸은 건너뛴다 (해안 도시 블록은 내륙 쪽으로 자란다)
 * - 지역에 속하지 않은 기업은 실제 본사 위치 그대로
 */
export const CITY_BLOCK_CELL = 1.6;
/** 자리를 정하는 기준 (토글과 무관하게 고정) */
export const CITY_BLOCK_ORDER_METRIC = "revenue" as const;

/** 가운데에서 시작하는 정사각 나선 칸 (col, row). row + = 남쪽 */
export function spiralCells(count: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  let x = 0;
  let y = 0;
  let dx = 0;
  let dy = -1;
  for (let i = 0; i < count; i++) {
    cells.push([x, y]);
    if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
      [dx, dy] = [-dy, dx];
    }
    x += dx;
    y += dy;
  }
  return cells;
}

export interface MapLayout {
  /** 티커 → 건물 자리 (지도 밖이면 없음) */
  positions: Map<string, WorldPoint>;
  /** 지역 id → 이름표 자리 (블록 남쪽 끝 바로 아래, 건물을 가리지 않게) */
  labelPositions: Map<string, WorldPoint>;
}

export function buildMapLayout(
  companies: readonly Company[],
  regions: readonly Region[],
  cell = CITY_BLOCK_CELL,
  isLand: (p: WorldPoint) => boolean = (p) => findStateAt(p) !== null,
): MapLayout {
  const positions = new Map<string, WorldPoint>();
  const labelPositions = new Map<string, WorldPoint>();
  const { groups, standalone } = assignRegions(companies, regions, { sizeMetric: CITY_BLOCK_ORDER_METRIC });

  // 지역 순서대로 칸을 채운다. 바다·호수 칸과 이미 쓴 자리 근처는 건너뛴다 (블록이 해안선을 따라 육지에만 선다)
  const placed: WorldPoint[] = [];
  for (const group of groups) {
    const center = projectLatLng(group.region.lat, group.region.lng);
    if (!center) continue;
    const members = sortBySize(group.companies, CITY_BLOCK_ORDER_METRIC);
    const spots = landSpots(center, members.length, cell, placed, isLand);
    members.forEach((c, i) => {
      positions.set(c.ticker, spots[i]);
      placed.push(spots[i]);
    });
    const south = Math.max(...spots.map((p) => p.z));
    const label = { x: center.x, z: south + cell * 0.9 };
    labelPositions.set(group.region.id, label);
  }

  // 혼자 있는 기업이 근처 블록과 겹치면 (필라델피아 컴캐스트 ↔ 뉴욕 블록) 블록 바깥으로 밀어낸다
  for (const c of standalone) {
    const p = projectLatLng(c.hq.lat, c.hq.lng);
    if (!p) continue;
    const moved = pushClear(p, placed, cell);
    positions.set(c.ticker, moved);
    placed.push(moved);
  }
  return { positions, labelPositions };
}

/**
 * p 가 다른 건물과 cell 보다 가까우면, p 둘레를 넓혀 가며 (반 칸씩, 16방향) 모든 건물과 cell 이상 떨어진
 * 가장 가까운 자리를 찾는다. 같은 거리면 남쪽(+z)부터 시계 방향 순서라 항상 같은 결과. 이미 비어 있으면 그대로.
 */
export function pushClear(p: WorldPoint, others: readonly WorldPoint[], cell: number): WorldPoint {
  const clear = (q: WorldPoint) => others.every((o) => Math.hypot(q.x - o.x, q.z - o.z) >= cell - 1e-9);
  if (clear(p)) return { ...p };
  const DIRECTIONS = 16;
  for (let ring = 1; ring <= 40; ring++) {
    const r = (ring * cell) / 2;
    for (let k = 0; k < DIRECTIONS; k++) {
      const a = (k / DIRECTIONS) * Math.PI * 2;
      const q = { x: p.x - Math.sin(a) * r, z: p.z + Math.cos(a) * r };
      if (clear(q)) return q;
    }
  }
  return { ...p };
}

/**
 * 지역 중심에서 나선 순서로 칸을 보며 육지이고 이미 놓인 건물과 칸 거리 이상인 자리 count 개.
 * 중심 자체가 바다여도 가까운 육지부터 찬다. 육지 칸이 모자라면 (있을 수 없지만) 나선 끝까지 본 뒤 남은 칸을 그대로 쓴다.
 */
export function landSpots(
  center: WorldPoint,
  count: number,
  cell: number,
  placed: readonly WorldPoint[],
  isLand: (p: WorldPoint) => boolean,
): WorldPoint[] {
  const spots: WorldPoint[] = [];
  const candidates = spiralCells(Math.max(49, count * 9)).map(([col, row]) => ({
    x: center.x + col * cell,
    z: center.z + row * cell,
  }));
  const free = (q: WorldPoint) =>
    [...placed, ...spots].every((o) => Math.hypot(q.x - o.x, q.z - o.z) >= cell - 1e-9);
  for (const q of candidates) {
    if (spots.length === count) break;
    if (isLand(q) && free(q)) spots.push(q);
  }
  for (const q of candidates) {
    if (spots.length === count) break;
    if (free(q)) spots.push(q);
  }
  return spots;
}

/** 지역 건물들의 가운데 (지역 이름표를 누르면 카메라가 여기로). 자리를 아무것도 모르면 null */
export function getBlockCenter(positions: ReadonlyMap<string, WorldPoint>, tickers: readonly string[]): WorldPoint | null {
  let x = 0;
  let z = 0;
  let n = 0;
  for (const t of tickers) {
    const p = positions.get(t);
    if (!p) continue;
    x += p.x;
    z += p.z;
    n++;
  }
  return n === 0 ? null : { x: x / n, z: z / n };
}
