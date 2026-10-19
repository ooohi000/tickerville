import type { MarketCapTier } from "@/types";

const B = 1_000_000_000;

/** 등급 하한선 (달러). 큰 등급부터 검사한다. */
export const TIER_THRESHOLDS: ReadonlyArray<[MarketCapTier, number]> = [
  ["mega", 200 * B],
  ["large", 10 * B],
  ["mid", 2 * B],
];

export function getMarketCapTier(marketCapUsd: number): MarketCapTier {
  for (const [tier, min] of TIER_THRESHOLDS) {
    if (marketCapUsd >= min) return tier;
  }
  return "small";
}
