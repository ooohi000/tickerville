import { sortByMarketCap } from "@/lib/company/sort";
import { distanceKm } from "@/lib/geo/distance";
import type { Company, Region, RegionAssignment } from "@/types";

/** 이 수 이상 모이면 클러스터(대표 건물 + "+N" 배지 + 목록)로 본다 */
export const MIN_CLUSTER_SIZE = 2;

/**
 * 기업을 본사와 가장 가까운 지역에 묶는다.
 * - 거리 ≤ radiusKm 이면 소속 (경계 포함)
 * - 여러 지역 반경에 걸치면 중심이 더 가까운 지역
 * - 어디에도 안 들어가면 standalone
 * 기업이 1개 이상인 지역만 groups에 들어간다 (이름표는 1개여도 표시).
 */
export function assignRegions(
  companies: readonly Company[],
  regions: readonly Region[],
  minClusterSize = MIN_CLUSTER_SIZE,
): RegionAssignment {
  const buckets = new Map<string, Company[]>();
  const standalone: Company[] = [];

  for (const company of companies) {
    let best: { id: string; d: number } | null = null;
    for (const region of regions) {
      const d = distanceKm(company.hq, region);
      if (d <= region.radiusKm && (!best || d < best.d)) {
        best = { id: region.id, d };
      }
    }
    if (best) {
      const list = buckets.get(best.id) ?? [];
      list.push(company);
      buckets.set(best.id, list);
    } else {
      standalone.push(company);
    }
  }

  const groups = regions
    .filter((r) => buckets.has(r.id))
    .map((region) => {
      const members = sortByMarketCap(buckets.get(region.id)!);
      return { region, companies: members, isCluster: members.length >= minClusterSize };
    });

  return { groups, standalone: sortByMarketCap(standalone) };
}
