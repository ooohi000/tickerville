import type { RegionAssignment } from "@/types";
import type { BuildingDimensions } from "./buildingSpec";

/** 간판 폰트 (public/fonts, SIL OFL) */
export const SIGN_FONT_URL = "/fonts/BebasNeue.woff";

/** Bebas Neue 대문자 한 글자 폭 ≈ 글자 크기의 0.45배 (여유 있게 잡은 값) */
export const SIGN_CHAR_WIDTH_EM = 0.45;
/** 간판 판 좌우·상하 여백 (글자 크기 배수) */
export const SIGN_PADDING_EM = 0.35;

/** 이 거리 안으로 카메라가 들어와야 클러스터 일반 멤버 간판이 보인다. 집에서 조정 */
export const SIGN_DETAIL_DISTANCE = 30;

/**
 * always: 단독 기업, 클러스터 대표 — 항상 보임
 * near: 클러스터 일반 멤버 — 가까이 갔을 때만 보임 (멀리서 간판 겹침 방지)
 */
export type SignMode = "always" | "near";

export interface SignDimensions {
  fontSize: number;
  plateWidth: number;
  plateHeight: number;
  /** 간판 중심 y (건물 원점 기준) */
  centerY: number;
}

/** 티커 길이와 건물 치수 → 간판 크기·위치 */
export function getSignDimensions(ticker: string, building: BuildingDimensions): SignDimensions {
  const fontSize = building.signFontSize;
  const padding = fontSize * SIGN_PADDING_EM;
  const plateWidth = Math.max(1, ticker.length) * fontSize * SIGN_CHAR_WIDTH_EM + padding * 2;
  const plateHeight = fontSize + padding * 2;
  return { fontSize, plateWidth, plateHeight, centerY: building.labelY + plateHeight / 2 };
}

/** 지역 묶음 결과 → 기업별 간판 모드 */
export function getSignModes(assignment: RegionAssignment): Map<string, SignMode> {
  const modes = new Map<string, SignMode>();
  for (const c of assignment.standalone) modes.set(c.ticker, "always");
  for (const group of assignment.groups) {
    group.companies.forEach((c, i) => {
      modes.set(c.ticker, !group.isCluster || i === 0 ? "always" : "near");
    });
  }
  return modes;
}

export function isSignVisible(mode: SignMode, cameraDistance: number): boolean {
  return mode === "always" || cameraDistance <= SIGN_DETAIL_DISTANCE;
}
