"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3, type Group } from "three";
import type { BuildingDimensions } from "@/lib/company/buildingSpec";
import {
  SIGN_FONT_URL,
  getSignDimensions,
  isSignVisible,
  type SignMode,
} from "@/lib/company/sign";

/** 색은 초안 — 집에서 화면 보고 조정 */
const PLATE_COLOR = "#1b2430";
const PLATE_HIGHLIGHT_COLOR = "#f5c542";
const TEXT_COLOR = "#ffffff";
const TEXT_HIGHLIGHT_COLOR = "#1b2430";

export interface SignProps {
  ticker: string;
  building: BuildingDimensions;
  mode: SignMode;
  highlighted?: boolean;
}

const worldPos = new Vector3();

/**
 * 옥상 간판. 항상 카메라를 향한다(Billboard).
 * 표시 여부는 매 프레임 ref로만 바꿔 리렌더를 만들지 않는다.
 */
export function Sign({ ticker, building, mode, highlighted = false }: SignProps) {
  const ref = useRef<Group>(null);
  const s = getSignDimensions(ticker, building);

  useFrame(({ camera }) => {
    const g = ref.current;
    if (!g) return;
    g.getWorldPosition(worldPos);
    g.visible = highlighted || isSignVisible(mode, camera.position.distanceTo(worldPos));
  });

  return (
    <Billboard ref={ref} position={[0, s.centerY, 0]}>
      <mesh>
        <planeGeometry args={[s.plateWidth, s.plateHeight]} />
        <meshBasicMaterial color={highlighted ? PLATE_HIGHLIGHT_COLOR : PLATE_COLOR} />
      </mesh>
      <Text
        font={SIGN_FONT_URL}
        fontSize={s.fontSize}
        color={highlighted ? TEXT_HIGHLIGHT_COLOR : TEXT_COLOR}
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.01]}
      >
        {ticker}
      </Text>
    </Billboard>
  );
}
