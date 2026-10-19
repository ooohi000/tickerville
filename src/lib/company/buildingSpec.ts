import type { MarketCapTier } from "@/types";
import { getMarketCapTier, getPositionInTier } from "./tier";

/** 부루마블 느낌: 집 → 빌딩 → 고층 빌딩 → 랜드마크 */
export type RoofType = "gable" | "flat" | "antenna" | "spire";

export interface BuildingSpec {
  /** 기본 층수 (등급 하한 기준) */
  floors: number;
  /** 가로·세로 바닥 크기 (정사각형) */
  footprint: number;
  roof: RoofType;
  /** 지붕/첨탑 높이 */
  roofHeight: number;
}

/** 한 층 높이 (월드 단위). 모든 등급이 공유 */
export const FLOOR_HEIGHT = 0.4;

/** 같은 등급 안 최대 높이 보정. 1.5면 등급 상한에서 1.5배 */
export const MAX_IN_TIER_HEIGHT_FACTOR = 1.5;

/** 티커 라벨이 건물 꼭대기에서 떠 있는 간격 */
export const LABEL_GAP = 0.5;

/** 등급별 건물 설정. 값은 초안 — 집에서 화면 보고 조정 */
export const BUILDING_SPECS: Readonly<Record<MarketCapTier, BuildingSpec>> = {
  small: { floors: 1, footprint: 0.5, roof: "gable", roofHeight: 0.35 },
  mid: { floors: 3, footprint: 0.6, roof: "flat", roofHeight: 0 },
  large: { floors: 6, footprint: 0.8, roof: "antenna", roofHeight: 0.8 },
  mega: { floors: 10, footprint: 1.0, roof: "spire", roofHeight: 1.5 },
};

/** Building 컴포넌트가 그대로 쓰는 최종 치수 */
export interface BuildingDimensions {
  tier: MarketCapTier;
  roof: RoofType;
  width: number;
  depth: number;
  /** 몸통 높이 (지붕 제외) */
  bodyHeight: number;
  roofHeight: number;
  /** 몸통 + 지붕 */
  totalHeight: number;
  /** 티커 라벨 y 위치 */
  labelY: number;
}

/** 시총 → 건물 치수. 등급으로 모양을 정하고, 등급 안 위치로 높이만 보정한다. */
export function getBuildingDimensions(marketCapUsd: number): BuildingDimensions {
  const tier = getMarketCapTier(marketCapUsd);
  const spec = BUILDING_SPECS[tier];
  const factor = 1 + getPositionInTier(marketCapUsd) * (MAX_IN_TIER_HEIGHT_FACTOR - 1);
  const bodyHeight = spec.floors * FLOOR_HEIGHT * factor;
  const totalHeight = bodyHeight + spec.roofHeight;

  return {
    tier,
    roof: spec.roof,
    width: spec.footprint,
    depth: spec.footprint,
    bodyHeight,
    roofHeight: spec.roofHeight,
    totalHeight,
    labelY: totalHeight + LABEL_GAP,
  };
}
