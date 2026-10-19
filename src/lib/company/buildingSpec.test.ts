import { describe, expect, it } from "vitest";
import type { MarketCapTier } from "@/types";
import {
  BUILDING_SPECS,
  FLOOR_HEIGHT,
  LABEL_GAP,
  MAX_IN_TIER_HEIGHT_FACTOR,
  getBuildingDimensions,
} from "./buildingSpec";
import { TIER_RANGES } from "./tier";

const B = 1_000_000_000;
const ORDER: MarketCapTier[] = ["small", "mid", "large", "mega"];

describe("BUILDING_SPECS", () => {
  it("등급이 오를수록 층수·바닥 크기가 커진다", () => {
    for (let i = 1; i < ORDER.length; i++) {
      const prev = BUILDING_SPECS[ORDER[i - 1]];
      const cur = BUILDING_SPECS[ORDER[i]];
      expect(cur.floors).toBeGreaterThan(prev.floors);
      expect(cur.footprint).toBeGreaterThan(prev.footprint);
    }
  });

  it("등급마다 지붕 모양이 다르다", () => {
    const roofs = ORDER.map((t) => BUILDING_SPECS[t].roof);
    expect(new Set(roofs).size).toBe(ORDER.length);
  });

  it("높이 보정을 최대로 받아도 다음 등급 기본 높이를 넘지 않는다", () => {
    for (let i = 1; i < ORDER.length; i++) {
      const prevMax = BUILDING_SPECS[ORDER[i - 1]].floors * MAX_IN_TIER_HEIGHT_FACTOR;
      expect(prevMax).toBeLessThanOrEqual(BUILDING_SPECS[ORDER[i]].floors);
    }
  });
});

describe("getBuildingDimensions", () => {
  it("등급 하한이면 기본 층수 그대로", () => {
    const d = getBuildingDimensions(TIER_RANGES.mega[0]);
    expect(d.tier).toBe("mega");
    expect(d.bodyHeight).toBeCloseTo(BUILDING_SPECS.mega.floors * FLOOR_HEIGHT);
  });

  it("등급 상한 이상이면 최대 보정", () => {
    const d = getBuildingDimensions(10_000 * B);
    expect(d.bodyHeight).toBeCloseTo(
      BUILDING_SPECS.mega.floors * FLOOR_HEIGHT * MAX_IN_TIER_HEIGHT_FACTOR,
    );
  });

  it("같은 등급이면 시총이 클수록 높고, 모양은 같다", () => {
    const ko = getBuildingDimensions(300 * B);
    const nvda = getBuildingDimensions(4_000 * B);
    expect(nvda.bodyHeight).toBeGreaterThan(ko.bodyHeight);
    expect(nvda.roof).toBe(ko.roof);
    expect(nvda.width).toBe(ko.width);
  });

  it("전체 높이 = 몸통 + 지붕, 라벨은 그 위", () => {
    const d = getBuildingDimensions(50 * B);
    expect(d.totalHeight).toBeCloseTo(d.bodyHeight + d.roofHeight);
    expect(d.labelY).toBeCloseTo(d.totalHeight + LABEL_GAP);
  });

  it("시총 0도 안전하게 small", () => {
    const d = getBuildingDimensions(0);
    expect(d.tier).toBe("small");
    expect(d.bodyHeight).toBeGreaterThan(0);
  });
});
