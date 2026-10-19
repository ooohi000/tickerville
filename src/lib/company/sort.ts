import type { Company } from "@/types";

/** 매출 내림차순(null은 맨 뒤), 같으면 티커 오름차순. 원본 배열은 건드리지 않는다. */
export function sortBySize(companies: readonly Company[]): Company[] {
  return [...companies].sort(
    (a, b) =>
      (b.revenueTtmUsd ?? -1) - (a.revenueTtmUsd ?? -1) || a.ticker.localeCompare(b.ticker),
  );
}
