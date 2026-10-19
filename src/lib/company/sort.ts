import type { Company } from "@/types";

/** 시총 내림차순, 같으면 티커 오름차순. 원본 배열은 건드리지 않는다. */
export function sortByMarketCap(companies: readonly Company[]): Company[] {
  return [...companies].sort(
    (a, b) => b.marketCapUsd - a.marketCapUsd || a.ticker.localeCompare(b.ticker),
  );
}
