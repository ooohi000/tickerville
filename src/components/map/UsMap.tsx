"use client";

import { useEffect, useMemo } from "react";
import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  Vector2,
} from "three";
import {
  MAP_HEIGHT,
  getBorderPositions,
  getUsStates,
  toShapeXY,
  type StatePolygon,
} from "@/lib/geo/usStates";
import type { WorldPoint } from "@/types";

/** 색은 초안 — 집에서 화면 보고 조정 */
const LAND_COLOR = "#7fae6a";
const BORDER_COLOR = "#4f7a45";
/** 경계선이 땅 윗면과 겹쳐 깜빡이지(z-fighting) 않게 살짝 띄운다 */
const BORDER_LIFT = 0.01;

const toVectors = (ring: readonly WorldPoint[]) => ring.map((p) => new Vector2(...toShapeXY(p)));

function toShape(poly: StatePolygon): Shape {
  const shape = new Shape(toVectors(poly.outer));
  shape.holes = poly.holes.map((h) => new Path(toVectors(h)));
  return shape;
}

/**
 * 미국 50개 주 + DC를 하나의 지오메트리로 extrude한 땅 + 주 경계선.
 * 땅 윗면 높이는 MAP_HEIGHT (건물이 그 위에 선다).
 */
export function UsMap() {
  const states = getUsStates();

  const land = useMemo(() => {
    const shapes = states.flatMap((s) => s.polygons.map(toShape));
    return new ExtrudeGeometry(shapes, { depth: MAP_HEIGHT, bevelEnabled: false });
  }, [states]);

  const borders = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new Float32BufferAttribute(getBorderPositions(states, MAP_HEIGHT + BORDER_LIFT), 3),
    );
    return g;
  }, [states]);

  useEffect(
    () => () => {
      land.dispose();
      borders.dispose();
    },
    [land, borders],
  );

  return (
    <group>
      {/* xy 평면 Shape를 눕혀서 xz 평면으로. 두께는 +y 방향 */}
      <mesh geometry={land} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={LAND_COLOR} />
      </mesh>
      <lineSegments geometry={borders}>
        <lineBasicMaterial color={BORDER_COLOR} />
      </lineSegments>
    </group>
  );
}
