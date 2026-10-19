"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { getBuildingDimensions, type BuildingDimensions } from "@/lib/company/buildingSpec";
import type { Company, WorldPoint } from "@/types";

/** 색은 초안 — 집에서 화면 보고 조정 */
const BODY_COLOR = "#e8e2d4";
const ROOF_COLOR = "#c0503a";
const HIGHLIGHT_EMISSIVE = "#f5c542";

export interface BuildingProps {
  company: Company;
  position: WorldPoint;
  highlighted?: boolean;
  onSelect?: (ticker: string) => void;
}

/**
 * 모든 등급 공통 건물. 모양 차이는 BUILDING_SPECS(lib)에서만 결정된다.
 * 건물 원점은 바닥 중앙.
 */
export function Building({ company, position, highlighted = false, onSelect }: BuildingProps) {
  const d = getBuildingDimensions(company.marketCapUsd);
  const emissive = highlighted ? HIGHLIGHT_EMISSIVE : "#000000";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.(company.ticker);
  };

  return (
    <group position={[position.x, 0, position.z]} onClick={handleClick} name={company.ticker}>
      <mesh position={[0, d.bodyHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[d.width, d.bodyHeight, d.depth]} />
        <meshStandardMaterial color={BODY_COLOR} emissive={emissive} emissiveIntensity={0.4} />
      </mesh>
      <Roof d={d} emissive={emissive} />
    </group>
  );
}

function Roof({ d, emissive }: { d: BuildingDimensions; emissive: string }) {
  const y = d.bodyHeight + d.roofHeight / 2;
  const material = (
    <meshStandardMaterial color={ROOF_COLOR} emissive={emissive} emissiveIntensity={0.4} />
  );

  switch (d.roof) {
    case "flat":
      return null;
    case "gable":
      // 4면 피라미드를 45° 돌려 상자 모서리에 맞춘다
      return (
        <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[(d.width / 2) * Math.SQRT2, d.roofHeight, 4]} />
          {material}
        </mesh>
      );
    case "antenna":
      return (
        <mesh position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, d.roofHeight, 6]} />
          {material}
        </mesh>
      );
    case "spire":
      return (
        <mesh position={[0, y, 0]} castShadow>
          <coneGeometry args={[d.width * 0.3, d.roofHeight, 12]} />
          {material}
        </mesh>
      );
  }
}
