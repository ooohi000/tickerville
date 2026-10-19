import type { MarketCapTier } from "@/types";

const B = 1_000_000_000;

/**
 * 등급별 시총 범위 [하한, 상한) (달러). 등급 판정과 건물 높이 보정이 같이 쓴다.
 * small 하한과 mega 상한은 높이 보정용 기준점일 뿐, 범위 밖 값도 해당 등급으로 본다.
 */
export const TIER_RANGES: Readonly<Record<MarketCapTier, readonly [number, number]>> = {
  small: [0.3 * B, 2 * B],
  mid: [2 * B, 10 * B],
  large: [10 * B, 200 * B],
  mega: [200 * B, 5_000 * B],
};

/** 큰 등급부터 검사하는 순서 */
const TIERS_DESC: readonly MarketCapTier[] = ["mega", "large", "mid", "small"];

export function getMarketCapTier(marketCapUsd: number): MarketCapTier {
  for (const tier of TIERS_DESC) {
    if (marketCapUsd >= TIER_RANGES[tier][0]) return tier;
  }
  return "small";
}

/**
 * 등급 안에서의 위치 0~1 (로그 스케일).
 * 같은 mega라도 $300B와 $4T를 구분하기 위해 쓴다. 범위 밖은 0 또는 1로 자른다.
 */
export function getPositionInTier(marketCapUsd: number): number {
  const [min, max] = TIER_RANGES[getMarketCapTier(marketCapUsd)];
  if (marketCapUsd <= min) return 0;
  if (marketCapUsd >= max) return 1;
  return (Math.log(marketCapUsd) - Math.log(min)) / (Math.log(max) - Math.log(min));
}
