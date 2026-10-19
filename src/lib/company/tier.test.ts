import { describe, expect, it } from "vitest";
import { getMarketCapTier, getPositionInTier } from "./tier";

const B = 1_000_000_000;

describe("getMarketCapTier", () => {
  it.each([
    [3_500 * B, "mega"],
    [200 * B, "mega"],
    [199.9 * B, "large"],
    [10 * B, "large"],
    [9.9 * B, "mid"],
    [2 * B, "mid"],
    [1.9 * B, "small"],
    [0, "small"],
  ] as const)("%d → %s", (cap, tier) => {
    expect(getMarketCapTier(cap)).toBe(tier);
  });
});

describe("getPositionInTier", () => {
  it("등급 하한이면 0", () => {
    expect(getPositionInTier(200 * B)).toBe(0);
    expect(getPositionInTier(2 * B)).toBe(0);
  });

  it("범위 밖은 0~1로 자른다", () => {
    expect(getPositionInTier(0)).toBe(0);
    expect(getPositionInTier(10_000 * B)).toBe(1);
  });

  it("같은 등급 안에서 클수록 커진다", () => {
    const kosize = getPositionInTier(300 * B);
    const nvda = getPositionInTier(4_000 * B);
    expect(nvda).toBeGreaterThan(kosize);
    expect(nvda).toBeLessThanOrEqual(1);
  });

  it("로그 스케일: mega 범위의 기하 중간값이면 0.5", () => {
    const mid = Math.sqrt(200 * B * 5_000 * B);
    expect(getPositionInTier(mid)).toBeCloseTo(0.5, 6);
  });
});
