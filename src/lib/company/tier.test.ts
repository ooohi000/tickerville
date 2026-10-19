import { describe, expect, it } from "vitest";
import { getMarketCapTier } from "./tier";

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
