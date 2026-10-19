"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { BuildingDimensions } from "@/lib/company/buildingSpec";
import { getCraneLayout } from "@/lib/company/growth";

/** 색·속도는 초안 — 집에서 조정 */
const CRANE_COLOR = "#f2b705";
const CABLE_COLOR = "#3a3a3a";
const MAST = 0.07; // 기둥 굵기
const JIB = 0.05; // 팔 굵기
const SWING_SPEED = 0.5; // 흔들림 속도 (rad/s 기준 위상)

/**
 * 고성장 기업 옆 공사 크레인. 팔이 옥상 위에서 천천히 좌우로 흔들린다.
 * 배치 계산은 lib(getCraneLayout), 여기서는 그리기만.
 */
export function Crane({ building }: { building: BuildingDimensions }) {
  const c = getCraneLayout(building);
  const jibRef = useRef<Group>(null);
  // 크레인마다 흔들리는 박자가 같으면 어색해서 위치로 위상을 조금 비튼다
  const phase = (c.x * 13.7 + c.mastHeight * 7.3) % (Math.PI * 2);

  useFrame(({ clock }) => {
    if (jibRef.current) {
      jibRef.current.rotation.y = c.baseAngle + Math.sin(clock.elapsedTime * SWING_SPEED + phase) * c.swing;
    }
  });

  const hookDrop = c.mastHeight * 0.45;

  return (
    <group position={[c.x, 0, c.z]}>
      {/* 기둥 */}
      <mesh position={[0, c.mastHeight / 2, 0]} castShadow>
        <boxGeometry args={[MAST, c.mastHeight, MAST]} />
        <meshStandardMaterial color={CRANE_COLOR} />
      </mesh>

      {/* 회전하는 팔 묶음: 기본 방향은 +x */}
      <group ref={jibRef} position={[0, c.mastHeight, 0]}>
        <mesh position={[c.jibLength / 2, 0, 0]} castShadow>
          <boxGeometry args={[c.jibLength, JIB, JIB]} />
          <meshStandardMaterial color={CRANE_COLOR} />
        </mesh>
        <mesh position={[-c.counterLength / 2, 0, 0]}>
          <boxGeometry args={[c.counterLength, JIB, JIB]} />
          <meshStandardMaterial color={CRANE_COLOR} />
        </mesh>
        {/* 균형추 */}
        <mesh position={[-c.counterLength, -0.06, 0]}>
          <boxGeometry args={[0.14, 0.12, 0.12]} />
          <meshStandardMaterial color={CABLE_COLOR} />
        </mesh>
        {/* 케이블 + 갈고리 */}
        <mesh position={[c.jibLength * 0.85, -hookDrop / 2, 0]}>
          <boxGeometry args={[0.01, hookDrop, 0.01]} />
          <meshBasicMaterial color={CABLE_COLOR} />
        </mesh>
        <mesh position={[c.jibLength * 0.85, -hookDrop, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color={CABLE_COLOR} />
        </mesh>
      </group>
    </group>
  );
}
