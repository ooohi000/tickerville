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

/**
 * 간판 단계 (8-2b): 멀리선 지역 이름표만, 가까이 가면 간판.
 * - DETAIL_DISTANCE 밖: 지역에 속한 기업 간판은 숨김 (이름표가 대신). 혼자 있는 기업은 보임
 * - SIGN_ALL_DISTANCE 밖 ~ DETAIL_DISTANCE: 지역마다 큰 기업 SIGN_TOP_N 개만 (간판끼리 겹치지 않게)
 * - SIGN_ALL_DISTANCE 안: 전부
 */
export const SIGN_ALL_DISTANCE = 16;
export const SIGN_TOP_N = 3;

/** 기업별 지역 안 순위 (현재 높이 기준 순서, 0 = 1위). 지역에 안 속하면 null */
export function getSignRanks(assignment: RegionAssignment): Map<string, number | null> {
  const ranks = new Map<string, number | null>();
  for (const c of assignment.standalone) ranks.set(c.ticker, null);
  for (const group of assignment.groups) group.companies.forEach((c, i) => ranks.set(c.ticker, i));
  return ranks;
}

export function isSignVisibleAt(rank: number | null, cameraDistance: number): boolean {
  if (rank === null) return true;
  if (cameraDistance > DETAIL_DISTANCE) return false;
  if (cameraDistance > SIGN_ALL_DISTANCE) return rank < SIGN_TOP_N;
  return true;
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
