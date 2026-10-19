import type { RegionAssignment } from "@/types";

/**
 * 카메라가 이 거리 안으로 들어오면 클러스터가 "펼쳐진" 상태.
 * 건물·간판·"+N" 배지가 모두 이 값 하나를 기준으로 움직인다. 집에서 조정
 */
export const DETAIL_DISTANCE = 30;

/**
 * always: 단독 기업, 1개뿐인 지역, 클러스터 대표 — 항상 보임
 * near: 클러스터 일반 멤버 — 펼쳐졌을 때만 보임
 */
export type VisibilityMode = "always" | "near";

/** 지역 묶음 결과 → 기업별 표시 방식 */
export function getVisibilityModes(assignment: RegionAssignment): Map<string, VisibilityMode> {
  const modes = new Map<string, VisibilityMode>();
  for (const c of assignment.standalone) modes.set(c.ticker, "always");
  for (const group of assignment.groups) {
    group.companies.forEach((c, i) => {
      modes.set(c.ticker, !group.isCluster || i === 0 ? "always" : "near");
    });
  }
  return modes;
}

/** 펼쳐진 상태인가 (경계 포함) */
export function isExpanded(cameraDistance: number): boolean {
  return cameraDistance <= DETAIL_DISTANCE;
}

export function isVisibleAt(mode: VisibilityMode, cameraDistance: number): boolean {
  return mode === "always" || isExpanded(cameraDistance);
}

/**
 * 클러스터 대표 건물에 붙일 "+N"의 N. 대표가 아니거나 클러스터가 아니면 0.
 * 기업별로 미리 계산해 두고 Building에 넘긴다.
 */
export function getHiddenCounts(assignment: RegionAssignment): Map<string, number> {
  const counts = new Map<string, number>();
  for (const group of assignment.groups) {
    if (group.isCluster) counts.set(group.companies[0].ticker, group.companies.length - 1);
  }
  return counts;
}
