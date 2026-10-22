import { describe, expect, it } from "vitest";
import dataset from "@/data/companies.json";
import regions from "@/data/regions.json";
import { projectLatLng } from "@/lib/geo/project";
import { makeCompany } from "@/test/makeCompany";
import type { CompanyDataset, Region } from "@/types";
import { CITY_BLOCK_CELL, buildMapLayout, landSpots, pushClear, spiralCells } from "./cityBlock";
import { findStateAt } from "@/lib/geo/usStates";

const { companies } = dataset as CompanyDataset;
const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

describe("spiralCells", () => {
  it("가운데부터 나선으로, 같은 칸은 없다", () => {
    const cells = spiralCells(25);
    expect(cells[0]).toEqual([0, 0]);
    expect(new Set(cells.map((c) => c.join(","))).size).toBe(25);
    // 9칸이면 3×3 안에 꽉 찬다
    expect(spiralCells(9).every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1)).toBe(true);
  });
});

describe("buildMapLayout", () => {
  // 본사가 몇 백 m 거리인 댈러스 두 기업 + 큰 기업 하나
  const dallas: Region = { id: "dallas", label: "댈러스", lat: 32.85, lng: -96.95, radiusKm: 40 };
  const big = makeCompany({ ticker: "CAT", revenueTtmUsd: 60e9, hq: { city: "Irving", state: "TX", lat: 32.87, lng: -96.94 } });
  const t = makeCompany({ ticker: "T", revenueTtmUsd: 120e9, hq: { city: "Dallas", state: "TX", lat: 32.78, lng: -96.799 } });
  const txn = makeCompany({ ticker: "TXN", revenueTtmUsd: 17e9, hq: { city: "Dallas", state: "TX", lat: 32.781, lng: -96.802 } });

  it("같은 동네 기업도 칸 크기만큼 떨어진다 (겹치지 않음)", () => {
    const { positions } = buildMapLayout([big, t, txn], [dallas]);
    const ps = ["CAT", "T", "TXN"].map((k) => positions.get(k)!);
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        expect(dist(ps[i], ps[j])).toBeGreaterThanOrEqual(CITY_BLOCK_CELL - 1e-9);
      }
    }
  });

  it("모든 건물이 육지 위 (샘플 데이터)", () => {
    const { positions } = buildMapLayout(companies, regions as Region[]);
    for (const [ticker, p] of positions) expect(findStateAt(p), ticker).not.toBeNull();
  });

  it("매출 1위가 지역 가운데, 높이 기준과 상관없이 자리는 매출 순서로 고정", () => {
    const { positions } = buildMapLayout([big, t, txn], [dallas]);
    const center = projectLatLng(dallas.lat, dallas.lng)!;
    expect(dist(positions.get("T")!, center)).toBeCloseTo(0);
  });

  it("지역 밖 기업은 실제 본사 위치", () => {
    const nke = makeCompany({ ticker: "NKE", hq: { city: "Beaverton", state: "OR", lat: 45.49, lng: -122.8 } });
    const { positions } = buildMapLayout([nke], [dallas]);
    expect(positions.get("NKE")).toEqual(projectLatLng(45.49, -122.8));
  });

  it("이름표는 블록 남쪽 끝보다 아래 (건물을 가리지 않는다)", () => {
    const { positions, labelPositions } = buildMapLayout([big, t, txn], [dallas]);
    const label = labelPositions.get("dallas")!;
    for (const k of ["CAT", "T", "TXN"]) expect(label.z).toBeGreaterThan(positions.get(k)!.z);
  });

  it("샘플 데이터: 모든 기업 자리가 있고, 서로 칸 크기 이상 떨어져 있다", () => {
    const { positions } = buildMapLayout(companies, regions as Region[]);
    const ps = [...positions.values()];
    expect(ps).toHaveLength(companies.length);
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        expect(dist(ps[i], ps[j])).toBeGreaterThanOrEqual(CITY_BLOCK_CELL - 1e-9);
      }
    }
  });
});

describe("pushClear", () => {
  it("가까우면 반대쪽으로 칸 거리까지 밀고, 멀면 그대로", () => {
    const blocks = [{ x: 0, z: 0 }];
    const pushed = pushClear({ x: 0.5, z: 0 }, blocks, 1.6);
    expect(Math.hypot(pushed.x, pushed.z)).toBeGreaterThanOrEqual(1.6 - 1e-9);
    expect(pushClear({ x: 3, z: 0 }, blocks, 1.6)).toEqual({ x: 3, z: 0 });
  });

  it("같은 자리면 남쪽으로 (항상 같은 결과)", () => {
    const q = pushClear({ x: 0, z: 0 }, [{ x: 0, z: 0 }], 1.6);
    expect(q.x).toBeCloseTo(0);
    expect(q.z).toBeCloseTo(1.6);
  });

  it("블록 옆 기업은 결국 모든 건물과 칸 거리 이상", () => {
    const block = [-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => ({ x: i * 1.6, z: j * 1.6 })));
    const p = pushClear({ x: 0.9, z: 0.5 }, block, 1.6);
    for (const b of block) expect(Math.hypot(p.x - b.x, p.z - b.z)).toBeGreaterThanOrEqual(1.6 - 1e-9);
  });
});

describe("landSpots", () => {
  it("바다 칸(x < 0)은 건너뛰고 육지 칸만, 서로 칸 거리 이상", () => {
    const spots = landSpots({ x: 0, z: 0 }, 5, 1, [], (p) => p.x >= 0);
    expect(spots).toHaveLength(5);
    expect(spots.every((p) => p.x >= 0)).toBe(true);
    expect(spots[0]).toEqual({ x: 0, z: 0 });
  });

  it("이미 놓인 다른 지역 건물 근처는 피한다", () => {
    const spots = landSpots({ x: 0, z: 0 }, 2, 1, [{ x: 0, z: 0 }], () => true);
    for (const p of spots) expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(1 - 1e-9);
  });
});
