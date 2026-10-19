import { describe, expect, it } from "vitest";
import { getPositionInTier, getSizeTier } from "./tier";

const B = 1_000_000_000;
const M = 1_000_000;

describe("getSizeTier", () => {
  it.each([
    [680 * B, "mega"],
    [100 * B, "mega"],
    [99.9 * B, "large"],
    [10 * B, "large"],
    [9.9 * B, "mid"],
    [1 * B, "mid"],
    [999 * M, "small"],
    [0, "small"],
  ] as const)("%d → %s", (rev, tier) => {
    expect(getSizeTier(rev)).toBe(tier);
  });

  it("매출 정보가 없으면(null) small", () => {
    expect(getSizeTier(null)).toBe("small");
  });
});

describe("getPositionInTier", () => {
  it("등급 하한이면 0", () => {
    expect(getPositionInTier(100 * B)).toBe(0);
    expect(getPositionInTier(1 * B)).toBe(0);
  });

  it("범위 밖·null은 0~1로 자른다", () => {
    expect(getPositionInTier(0)).toBe(0);
    expect(getPositionInTier(null)).toBe(0);
    expect(getPositionInTier(5_000 * B)).toBe(1);
  });

  it("같은 등급 안에서 클수록 커진다", () => {
    expect(getPositionInTier(680 * B)).toBeGreaterThan(getPositionInTier(180 * B));
  });

  it("로그 스케일: mega 범위의 기하 중간값이면 0.5", () => {
    const mid = Math.sqrt(100 * B * 1_000 * B);
    expect(getPositionInTier(mid)).toBeCloseTo(0.5, 6);
  });
});
