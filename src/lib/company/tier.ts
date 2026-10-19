import type { SizeTier } from "@/types";

/**
 * 등급별 [하한, 상한) 범위. 지표마다 다르다 (sizeMetric.ts의 SIZE_METRICS).
 * small 하한과 mega 상한은 높이 보정용 기준점일 뿐, 범위 밖 값도 해당 등급으로 본다.
 */
export type TierRanges = Readonly<Record<SizeTier, readonly [number, number]>>;

/** 큰 등급부터 검사하는 순서 */
const TIERS_DESC: readonly SizeTier[] = ["mega", "large", "mid", "small"];

/** 값 → 규모 등급. null(공시 없음)·음수(적자)는 small */
export function getSizeTier(value: number | null, ranges: TierRanges): SizeTier {
  const v = value ?? 0;
  for (const tier of TIERS_DESC) {
    if (v >= ranges[tier][0]) return tier;
  }
  return "small";
}

/**
 * 등급 안에서의 위치 0~1 (로그 스케일).
 * 같은 mega라도 큰 차이를 구분하기 위해 쓴다. 범위 밖·null은 0 또는 1로 자른다.
 */
export function getPositionInTier(value: number | null, ranges: TierRanges): number {
  const v = value ?? 0;
  const [min, max] = ranges[getSizeTier(v, ranges)];
  if (v <= min || min <= 0) return 0;
  if (v >= max) return 1;
  return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
}
