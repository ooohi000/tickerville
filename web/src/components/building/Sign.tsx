"use client";

import { Billboard, Text } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";
import { useDistanceVisible } from "@/components/scene/useDistanceVisible";
import { isExpanded } from "@/lib/cluster/visibility";
import type { BuildingDimensions } from "@/lib/company/buildingSpec";
import { SIGN_FONT_URL, SIGN_LINE_HEIGHT, getBadgeLayout, getSignDimensions } from "@/lib/company/sign";

/** 색은 초안 — 집에서 화면 보고 조정 */
const PLATE_COLOR = "#1b2430";
const PLATE_HIGHLIGHT_COLOR = "#f5c542";
const TEXT_COLOR = "#ffffff";
const TEXT_HIGHLIGHT_COLOR = "#1b2430";
const BADGE_COLOR = "#e5484d";

export interface SignProps {
  /** 간판 글자 (한글 이름, 없으면 영문 이름) */
  label: string;
  building: BuildingDimensions;
  /** 클러스터 대표일 때 숨은 기업 수. 0이면 배지 없음 */
  hiddenCount?: number;
  highlighted?: boolean;
}

/**
 * 옥상 간판 (한글 이름, 길면 두 줄). 항상 카메라를 향한다(Billboard).
 * 보이고 숨는 건 부모 Building이 정한다. 여기서는 "+N" 배지만 거리로 판단.
 */
export function Sign({ label, building, hiddenCount = 0, highlighted = false }: SignProps) {
  const s = getSignDimensions(label, building);

  return (
    <Billboard position={[0, s.centerY, 0]}>
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
        textAlign="center"
        lineHeight={SIGN_LINE_HEIGHT}
        position={[0, 0, 0.01]}
      >
        {s.lines.join("\n")}
      </Text>
      {hiddenCount > 0 && <Badge sign={s} count={hiddenCount} />}
    </Billboard>
  );
}

/** "+N" — 클러스터가 접혀 있을 때(멀리서)만 보인다 */
function Badge({ sign, count }: { sign: ReturnType<typeof getSignDimensions>; count: number }) {
  const ref = useRef<Group>(null);
  const b = getBadgeLayout(sign, count);
  useDistanceVisible(ref, (d) => !isExpanded(d));

  return (
    <group ref={ref} position={[b.x, b.y, 0.02]}>
      <mesh>
        <circleGeometry args={[b.radius, 32]} />
        <meshBasicMaterial color={BADGE_COLOR} />
      </mesh>
      <Text
        font={SIGN_FONT_URL}
        fontSize={b.fontSize}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.01]}
      >
        {b.text}
      </Text>
    </group>
  );
}
