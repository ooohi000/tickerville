"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { fitMapView } from "@/lib/camera/fitView";

/** 최대 줌아웃 = 첫 화면 거리의 이 배수 (첫 화면보다 조금만 더 멀리) */
const MAX_DISTANCE_FACTOR = 1.3;

/**
 * 첫 화면 구도를 화면 비율에 맞춘다 (계산은 lib/camera/fitView). 처음 한 번만 — 이후엔 사용자가 움직인 대로.
 * 맞춘 구도를 OrbitControls 의 "처음 상태"로 저장해서 0 키(controls.reset)가 여기로 돌아온다.
 * Canvas 안, <OrbitControls makeDefault> 뒤에 둔다.
 */
export function CameraFit() {
  // 카메라·컨트롤은 effect 안에서 store 에서 꺼내 바꾼다 (렌더 중 받은 값은 바꾸지 않는다)
  const get = useThree((s) => s.get);
  const hasControls = useThree((s) => s.controls !== null);
  const done = useRef(false);

  useLayoutEffect(() => {
    if (done.current || !hasControls) return;
    const { camera, controls, size } = get();
    const orbit = controls as OrbitControlsImpl;
    const view = fitMapView({
      aspect: size.width / Math.max(1, size.height),
      fovDeg: (camera as PerspectiveCamera).fov,
    });
    orbit.target.set(...view.target);
    camera.position.set(...view.position);
    orbit.maxDistance = Math.max(orbit.maxDistance, view.distance * MAX_DISTANCE_FACTOR);
    orbit.update();
    orbit.saveState();
    done.current = true;
  }, [get, hasControls]);

  return null;
}
