import { describe, expect, it } from "vitest";
import { makeCompany } from "@/test/makeCompany";
import type { SizeTier } from "@/types";
import { DEFAULT_SIZE_METRIC, SIZE_METRICS, SIZE_METRIC_ORDER, getSizeValue } from "./sizeMetric";

const ORDER: SizeTier[] = ["small", "mid", "large", "mega"];

describe("SIZE_METRICS", () => {
  it("토글 순서에 모든 지표가 한 번씩", () => {
    expect([...SIZE_METRIC_ORDER].sort()).toEqual(Object.keys(SIZE_METRICS).sort());
    expect(SIZE_METRIC_ORDER).toContain(DEFAULT_SIZE_METRIC);
  });

  it.each(SIZE_METRIC_ORDER)("%s: 등급 범위가 빈틈없이 이어지고 커진다", (id) => {
    const r = SIZE_METRICS[id].ranges;
    for (let i = 0; i < ORDER.length; i++) {
      const [min, max] = r[ORDER[i]];
      expect(max).toBeGreaterThan(min);
      expect(min).toBeGreaterThan(0);
      if (i > 0) expect(min).toBe(r[ORDER[i - 1]][1]);
    }
  });

  it("공시상 시총은 오래된 값이라는 안내가 있다", () => {
    expect(SIZE_METRICS.publicFloat.note).not.toBeNull();
  });
});

describe("getSizeValue", () => {
  const c = makeCompany({
    ticker: "X",
    revenueTtmUsd: 1,
    netIncomeTtmUsd: 2,
    totalAssetsUsd: 3,
    publicFloatUsd: 4,
  });

  it.each([
    ["revenue", 1],
    ["netIncome", 2],
    ["totalAssets", 3],
    ["publicFloat", 4],
  ] as const)("%s → %d", (id, v) => {
    expect(getSizeValue(c, id)).toBe(v);
  });
});
