import { describe, expect, it } from "vitest";
import dataset from "@/data/companies.json";
import regionsData from "@/data/regions.json";
import type { CompanyDataset, Region } from "@/types";
import { projectLatLng } from "./project";
import {
  findStateAt,
  getBorderPositions,
  getUsStates,
  projectRing,
  toShapeXY,
} from "./usStates";

const states = getUsStates();
const byName = (name: string) => states.find((s) => s.name === name);

describe("getUsStates", () => {
  it("50개 주 + DC = 51개", () => {
    expect(states).toHaveLength(51);
  });

  it("알래스카·하와이 포함, 투영 밖 영토는 제외", () => {
    expect(byName("Alaska")).toBeDefined();
    expect(byName("Hawaii")).toBeDefined();
    expect(byName("Puerto Rico")).toBeUndefined();
    expect(byName("Guam")).toBeUndefined();
  });

  it("모든 고리는 3점 이상, 모든 좌표는 유한한 숫자", () => {
    for (const s of states) {
      for (const poly of s.polygons) {
        for (const ring of [poly.outer, ...poly.holes]) {
          expect(ring.length).toBeGreaterThanOrEqual(3);
          for (const p of ring) {
            expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
          }
        }
      }
    }
  });

  it("섬이 있는 주는 다각형이 여러 개", () => {
    expect(byName("Hawaii")!.polygons.length).toBeGreaterThan(1);
  });

  it("캐시: 두 번 불러도 같은 배열", () => {
    expect(getUsStates()).toBe(states);
  });
});

describe("findStateAt", () => {
  it("샌프란시스코는 캘리포니아", () => {
    expect(findStateAt(projectLatLng(37.7749, -122.4194)!)?.name).toBe("California");
  });

  it("지도 범위 밖(태평양 한가운데 좌표)은 null", () => {
    expect(findStateAt({ x: -200, z: 0 })).toBeNull();
  });

  it("데이터 검증: 샘플 기업 본사가 모두 적힌 주(state) 안에 있다", () => {
    const codeToName: Record<string, string> = {
      CA: "California",
      WA: "Washington",
      TX: "Texas",
      NY: "New York",
      GA: "Georgia",
      CO: "Colorado",
    };
    for (const c of (dataset as CompanyDataset).companies) {
      const state = findStateAt(projectLatLng(c.hq.lat, c.hq.lng)!);
      expect(state?.name, c.ticker).toBe(codeToName[c.hq.state]);
    }
  });

  it("데이터 검증: 지역 중심이 모두 육지 위", () => {
    for (const r of regionsData as Region[]) {
      expect(findStateAt(projectLatLng(r.lat, r.lng)!), r.id).not.toBeNull();
    }
  });
});

describe("projectRing", () => {
  it("닫는 중복 끝점을 뺀다", () => {
    const ring = [
      [-100, 40],
      [-99, 40],
      [-99, 41],
      [-100, 40],
    ];
    expect(projectRing(ring)).toHaveLength(3);
  });

  it("투영 밖 점은 버린다", () => {
    expect(projectRing([[127, 37], [-100, 40]])).toHaveLength(1);
  });
});

describe("toShapeXY", () => {
  it("x는 그대로, z는 부호 반전", () => {
    expect(toShapeXY({ x: 3, z: 5 })).toEqual([3, -5]);
  });
});

describe("getBorderPositions", () => {
  it("고리마다 점 개수만큼 선분, 선분당 6개 숫자", () => {
    const tri = {
      id: "x",
      name: "x",
      polygons: [{ outer: [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 0, z: 1 }], holes: [] }],
    };
    const pos = getBorderPositions([tri], 2);
    expect(pos).toHaveLength(3 * 6);
    // 마지막 선분은 첫 점으로 닫힌다
    expect(Array.from(pos.slice(12))).toEqual([0, 2, 1, 0, 2, 0]);
  });
});
