import type { Company } from "@/types";
import { DEFAULT_SIZE_METRIC, getSizeValue, type SizeMetricId } from "./sizeMetric";

/**
 * 건물 크기 기준 내림차순(null은 맨 뒤), 같으면 티커 오름차순.
 * 원본 배열은 건드리지 않는다.
 */
export function sortBySize(
  companies: readonly Company[],
  metric: SizeMetricId = DEFAULT_SIZE_METRIC,
): Company[] {
  const v = (c: Company) => getSizeValue(c, metric) ?? Number.NEGATIVE_INFINITY;
  return [...companies].sort((a, b) => {
    const diff = v(b) - v(a);
    // 둘 다 null(−∞)이면 diff가 NaN이라 티커순으로 넘긴다
    return (Number.isNaN(diff) ? 0 : diff) || a.ticker.localeCompare(b.ticker);
  });
}
