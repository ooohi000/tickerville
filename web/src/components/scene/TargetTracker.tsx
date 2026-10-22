"use client";

import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { Vector3 } from "three";
import type { ScreenPoint } from "@/lib/camera/targetLine";

/** 매 프레임 재사용하는 계산용 벡터 (새로 만들지 않게) */
const SCRATCH = new Vector3();

export type TargetSink = (point: ScreenPoint | null) => void;

/**
 * 고른 건물의 3D 위치 → 화면 좌표(px)를 매 프레임 sinkRef 에 넘긴다 (지도를 돌리거나 확대해도 따라가게).
 * React 상태를 쓰지 않는다: 매 프레임 다시 그리면 무거우니 받는 쪽(TargetLine)이 DOM 을 직접 고친다.
 * Canvas 안에 둔다.
 */
export function TargetTracker({
  world,
  sinkRef,
}: {
  world: readonly [number, number, number] | null;
  sinkRef: RefObject<TargetSink | null>;
}) {
  useFrame(({ camera, gl }) => {
    const send = sinkRef.current;
    if (!send) return;
    if (!world) {
      send(null);
      return;
    }
    SCRATCH.set(world[0], world[1], world[2]).project(camera);
    // 카메라 뒤(또는 너무 멀리)면 화면 좌표가 뒤집혀서 쓸 수 없다
    if (SCRATCH.z < -1 || SCRATCH.z > 1) {
      send(null);
      return;
    }
    const r = gl.domElement.getBoundingClientRect();
    send({ x: r.left + ((SCRATCH.x + 1) / 2) * r.width, y: r.top + ((1 - SCRATCH.y) / 2) * r.height });
  });
  return null;
}
