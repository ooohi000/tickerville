import type { Company, Region } from "@/types";
import { SIZE_METRIC_ORDER, type SizeMetricId } from "@/lib/company/sizeMetric";
import { assignRegions } from "./assignRegions";
import { getHiddenCounts, getVisibilityModes } from "./visibility";

export interface SizeView {
  assignment: ReturnType<typeof assignRegions>;
  visibilityModes: ReturnType<typeof getVisibilityModes>;
  hiddenCounts: ReturnType<typeof getHiddenCounts>;
}

/**
 * 건물 높이 기준마다 대표 건물(크기 1위)이 달라지므로, 기준별 묶음 결과를 한 번에 계산한다.
 * 기준 4개 × 기업 수 정도라 가볍다. 데이터가 바뀔 때만 다시 부른다 (화면에서는 useMemo)
 */
export function buildSizeViews(companies: Company[], regions: Region[]): Record<SizeMetricId, SizeView> {
  return Object.fromEntries(
    SIZE_METRIC_ORDER.map((id) => {
      const assignment = assignRegions(companies, regions, { sizeMetric: id });
      return [
        id,
        {
          assignment,
          visibilityModes: getVisibilityModes(assignment),
          hiddenCounts: getHiddenCounts(assignment),
        },
      ];
    }),
  ) as Record<SizeMetricId, SizeView>;
}
