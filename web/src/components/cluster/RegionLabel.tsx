"use client";

import { Html } from "@react-three/drei";
import { MAP_HEIGHT } from "@/lib/geo/usStates";
import { projectLatLng } from "@/lib/geo/project";
import type { RegionGroup } from "@/types";
import styles from "./RegionLabel.module.css";

export interface RegionLabelProps {
  group: RegionGroup;
  active: boolean;
  onOpen: (regionId: string) => void;
}

/** 마우스가 있는 기기(데스크톱)인가 — 호버로 열지 판단 */
const canHover = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

/**
 * 지역 이름표 (부루마블 도시 칸 느낌). 한글이라 3D 글자 대신 HTML로 띄운다.
 * 데스크톱은 호버, 모바일은 탭으로 목록을 연다. 클러스터가 아니면(기업 1개) 이름만.
 */
export function RegionLabel({ group, active, onOpen }: RegionLabelProps) {
  const p = projectLatLng(group.region.lat, group.region.lng);
  if (!p) return null;

  const count = group.companies.length;
  const open = () => onOpen(group.region.id);

  return (
    <Html position={[p.x, MAP_HEIGHT, p.z]} center zIndexRange={[20, 0]}>
      <button
        type="button"
        className={`${styles.label} ${active ? styles.active : ""}`}
        onClick={open}
        onPointerEnter={() => canHover() && open()}
        aria-label={`${group.region.label} 기업 ${count}개 목록 열기`}
      >
        <span>{group.region.label}</span>
        {group.isCluster && <span className={styles.count}>{count}</span>}
      </button>
    </Html>
  );
}
