import type { SizeTier } from "@/types";

const B = 1_000_000_000;
const M = 1_000_000;

/**
 * 등급별 매출(최근 4분기, 달러) 범위 [하한, 상한). 등급 판정과 건물 높이 보정이 같이 쓴다.
 * small 하한과 mega 상한은 높이 보정용 기준점일 뿐, 범위 밖 값도 해당 등급으로 본다.
 */
export const TIER_RANGES: Readonly<Record<SizeTier, readonly [number, number]>> = {
  small: [50 * M, 1 * B],
  mid: [1 * B, 10 * B],
  large: [10 * B, 100 * B],
  mega: [100 * B, 1_000 * B],
};

/** 큰 등급부터 검사하는 순서 */
const TIERS_DESC: readonly SizeTier[] = ["mega", "large", "mid", "small"];

/** 매출 → 규모 등급. null(공시 없음)은 small */
export function getSizeTier(revenueTtmUsd: number | null): SizeTier {
  const v = revenueTtmUsd ?? 0;
  for (const tier of TIERS_DESC) {
    if (v >= TIER_RANGES[tier][0]) return tier;
  }
  return "small";
}

/**
 * 등급 안에서의 위치 0~1 (로그 스케일).
 * 같은 mega라도 $100B와 $600B를 구분하기 위해 쓴다. 범위 밖·null은 0 또는 1로 자른다.
 */
export function getPositionInTier(revenueTtmUsd: number | null): number {
  const v = revenueTtmUsd ?? 0;
  const [min, max] = TIER_RANGES[getSizeTier(v)];
  if (v <= min) return 0;
  if (v >= max) return 1;
  return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
}
