"use client";

import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { Vector3, type Object3D } from "three";

const worldPos = new Vector3();

/**
 * 카메라와의 거리에 따라 매 프레임 object.visible을 바꾼다.
 * React 상태를 쓰지 않아서 리렌더가 생기지 않는다. 건물·배지 등 공통으로 쓴다.
 */
export function useDistanceVisible(
  ref: RefObject<Object3D | null>,
  isVisible: (cameraDistance: number) => boolean,
) {
  useFrame(({ camera }) => {
    const obj = ref.current;
    if (!obj) return;
    obj.getWorldPosition(worldPos);
    obj.visible = isVisible(camera.position.distanceTo(worldPos));
  });
}
