import { describe, expect, it } from "vitest";
import { SIZE_METRICS } from "./sizeMetric";
import { getPositionInTier, getSizeTier } from "./tier";

const B = 1_000_000_000;
const M = 1_000_000;
const revenue = SIZE_METRICS.revenue.ranges;

describe("getSizeTier (매출 기준)", () => {
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
    expect(getSizeTier(rev, revenue)).toBe(tier);
  });

  it("값이 없거나(null) 음수(적자)면 small", () => {
    expect(getSizeTier(null, revenue)).toBe("small");
    expect(getSizeTier(-5 * B, SIZE_METRICS.netIncome.ranges)).toBe("small");
  });

  it("지표마다 경계가 다르다: 자산 $400B는 large, 매출 $400B는 mega", () => {
    expect(getSizeTier(400 * B, SIZE_METRICS.totalAssets.ranges)).toBe("large");
    expect(getSizeTier(400 * B, revenue)).toBe("mega");
  });
});

describe("getPositionInTier", () => {
  it("등급 하한이면 0", () => {
    expect(getPositionInTier(100 * B, revenue)).toBe(0);
    expect(getPositionInTier(1 * B, revenue)).toBe(0);
  });

  it("범위 밖·null·음수는 0~1로 자른다", () => {
    expect(getPositionInTier(0, revenue)).toBe(0);
    expect(getPositionInTier(null, revenue)).toBe(0);
    expect(getPositionInTier(-1, revenue)).toBe(0);
    expect(getPositionInTier(5_000 * B, revenue)).toBe(1);
  });

  it("같은 등급 안에서 클수록 커진다", () => {
    expect(getPositionInTier(680 * B, revenue)).toBeGreaterThan(getPositionInTier(180 * B, revenue));
  });

  it("로그 스케일: 기하 중간값이면 0.5", () => {
    const mid = Math.sqrt(100 * B * 1_000 * B);
    expect(getPositionInTier(mid, revenue)).toBeCloseTo(0.5, 6);
  });
});
