"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useDistanceVisible } from "@/components/scene/useDistanceVisible";
import { isVisibleAt, type VisibilityMode } from "@/lib/cluster/visibility";
import { getBuildingDimensions, type BuildingDimensions } from "@/lib/company/buildingSpec";
import { isHighGrowth } from "@/lib/company/growth";
import {
  DEFAULT_SIZE_METRIC,
  SIZE_METRICS,
  getSizeValue,
  type SizeMetricId,
} from "@/lib/company/sizeMetric";
import { MAP_HEIGHT } from "@/lib/geo/usStates";
import type { Company, WorldPoint } from "@/types";
import { Crane } from "./Crane";
import { Sign } from "./Sign";
import { displayName } from "@/lib/company/format";
import { EventHeat } from "./EventHeat";

/** 색은 초안 — 집에서 화면 보고 조정 */
const BODY_COLOR = "#e8e2d4";
const ROOF_COLOR = "#c0503a";
const HIGHLIGHT_EMISSIVE = "#f5c542";
/** 시대 테마: 그 해에 아직 없던 기업 — 색을 빼고 반투명 (누를 수는 있다) */
const FADED_COLOR = "#d6d2c6";
const FADED_OPACITY = 0.5;

export interface BuildingProps {
  company: Company;
  position: WorldPoint;
  /** 건물 높이 기준 (화면 토글) */
  sizeMetric?: SizeMetricId;
  /** always: 항상 / near: 클러스터가 펼쳐졌을 때만 (getVisibilityModes) */
  visibilityMode?: VisibilityMode;
  /** 클러스터 대표일 때 숨은 기업 수 → 간판 "+N" (getHiddenCounts) */
  hiddenCount?: number;
  highlighted?: boolean;
  /** 고른 시대에 아직 없던 기업 (lib/era/eras isBeforeFounding) */
  faded?: boolean;
  onSelect?: (ticker: string) => void;
}

/**
 * 모든 등급 공통 건물. 모양 차이는 BUILDING_SPECS(lib)에서만 결정된다.
 * 건물 원점은 바닥 중앙이고, 땅 윗면(MAP_HEIGHT) 위에 선다.
 */
export function Building({
  company,
  position,
  sizeMetric = DEFAULT_SIZE_METRIC,
  visibilityMode = "always",
  hiddenCount = 0,
  highlighted = false,
  faded = false,
  onSelect,
}: BuildingProps) {
  const ref = useRef<Group>(null);
  const d = getBuildingDimensions(
    getSizeValue(company, sizeMetric),
    SIZE_METRICS[sizeMetric].ranges,
  );
  const emissive = highlighted ? HIGHLIGHT_EMISSIVE : "#000000";
  const look: SurfaceLook = faded
    ? { body: FADED_COLOR, roof: FADED_COLOR, emissive, transparent: true, opacity: FADED_OPACITY }
    : { body: BODY_COLOR, roof: ROOF_COLOR, emissive, transparent: false, opacity: 1 };

  // 선택된 건물은 거리와 상관없이 보인다
  useDistanceVisible(ref, (dist) => highlighted || isVisibleAt(visibilityMode, dist));

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // 숨은 건물은 클릭을 가로채지 않고 뒤(대표 건물)로 넘긴다
    if (!ref.current?.visible) return;
    e.stopPropagation();
    onSelect?.(company.ticker);
  };

  return (
    <group
      ref={ref}
      position={[position.x, MAP_HEIGHT, position.z]}
      onClick={handleClick}
      name={company.ticker}
    >
      <mesh position={[0, d.bodyHeight / 2, 0]} castShadow={!faded} receiveShadow>
        <boxGeometry args={[d.width, d.bodyHeight, d.depth]} />
        {/* transparent 는 재질을 새로 만들어야 반영된다 (three needsUpdate) → key 로 바꿔 끼운다 */}
        <meshStandardMaterial
          key={look.transparent ? "faded" : "solid"}
          color={look.body}
          emissive={look.emissive}
          emissiveIntensity={0.4}
          transparent={look.transparent}
          opacity={look.opacity}
          depthWrite={!look.transparent}
        />
      </mesh>
      <EventHeat filings={company.filings30d} />
      <Roof d={d} look={look} />
      {isHighGrowth(company.revenueGrowthYoy) && <Crane building={d} />}
      <Sign
        label={displayName(company)}
        building={d}
        hiddenCount={hiddenCount}
        highlighted={highlighted}
      />
    </group>
  );
}

interface SurfaceLook {
  body: string;
  roof: string;
  emissive: string;
  transparent: boolean;
  opacity: number;
}

function Roof({ d, look }: { d: BuildingDimensions; look: SurfaceLook }) {
  const y = d.bodyHeight + d.roofHeight / 2;
  const material = (
    <meshStandardMaterial
      key={look.transparent ? "faded" : "solid"}
      color={look.roof}
      emissive={look.emissive}
      emissiveIntensity={0.4}
      transparent={look.transparent}
      opacity={look.opacity}
      depthWrite={!look.transparent}
    />
  );

  switch (d.roof) {
    case "flat":
      return null;
    case "gable":
      // 4면 피라미드를 45° 돌려 상자 모서리에 맞춘다
      return (
        <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]} castShadow={!look.transparent}>
          <coneGeometry args={[(d.width / 2) * Math.SQRT2, d.roofHeight, 4]} />
          {material}
        </mesh>
      );
    case "antenna":
      return (
        <mesh position={[0, y, 0]} castShadow={!look.transparent}>
          <cylinderGeometry args={[0.03, 0.03, d.roofHeight, 6]} />
          {material}
        </mesh>
      );
    case "spire":
      return (
        <mesh position={[0, y, 0]} castShadow={!look.transparent}>
          <coneGeometry args={[d.width * 0.3, d.roofHeight, 12]} />
          {material}
        </mesh>
      );
  }
}
