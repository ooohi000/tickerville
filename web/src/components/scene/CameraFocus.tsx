"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { computeFocusView } from "@/lib/camera/focus";

/** 날아가는 시간 (ms) */
const DURATION_MS = 800;
/**
 * 내용까지 다 들어온 패널. 휴대폰 아래 시트는 내용만큼 커져서, "불러오는 중"일 때 재면
 * 나중에 커진 시트가 건물을 덮는다 → 데이터가 들어온 뒤에 잰다.
 */
const READY_PANEL_SELECTOR = "[data-target-panel][data-target-ready]";
const ANY_PANEL_SELECTOR = "[data-target-panel]";
/** 이 프레임 수(약 3초)까지 기다리고, 그래도 안 되면 지금 패널(없으면 패널 없이) 기준으로 맞춘다 */
const MAX_WAIT_FRAMES = 180;

interface Flight {
  fromTarget: Vector3;
  fromPosition: Vector3;
  toTarget: Vector3;
  toPosition: Vector3;
  startedAt: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * 상세 패널이 열리면 카메라가 그 건물로 날아간다 (계산은 lib/camera/focus).
 * focusKey(티커)가 바뀔 때 한 번. 날아가는 중에 사용자가 지도를 잡으면 멈춘다.
 * 패널 자리를 알아야 해서 패널이 화면에 붙은 다음 프레임에 계산한다. Canvas 안에 둔다.
 */
export function CameraFocus({
  focusKey,
  building,
  maxDistance,
  aimBelow,
}: {
  focusKey: string | null;
  building: readonly [number, number, number] | null;
  /** 가장 멀리 둘 거리 (없으면 lib/camera/focus 기본값) */
  maxDistance?: number;
  /** 겨누는 점을 화면 아래로 (px) */
  aimBelow?: number;
}) {
  const pendingRef = useRef<{ waited: number } | null>(null);
  const flightRef = useRef<Flight | null>(null);
  const buildingRef = useRef(building);
  const maxDistanceRef = useRef(maxDistance);
  const aimBelowRef = useRef(aimBelow);

  useEffect(() => {
    buildingRef.current = building;
    maxDistanceRef.current = maxDistance;
    aimBelowRef.current = aimBelow;
  }, [building, maxDistance, aimBelow]);

  useEffect(() => {
    flightRef.current = null;
    pendingRef.current = focusKey ? { waited: 0 } : null;
  }, [focusKey]);

  useFrame(({ camera, controls, size }) => {
    const orbit = controls as OrbitControlsImpl | null;
    if (!orbit) return;

    const pending = pendingRef.current;
    const b = buildingRef.current;
    if (pending && b) {
      const ready = document.querySelector(READY_PANEL_SELECTOR);
      const panelEl = ready ?? document.querySelector(ANY_PANEL_SELECTOR);
      if (!ready && pending.waited < MAX_WAIT_FRAMES) {
        pending.waited += 1;
        return;
      }
      pendingRef.current = null;
      const view = computeFocusView({
        building: new Vector3(b[0], b[1], b[2]),
        cameraPosition: camera.position,
        target: orbit.target,
        fovDeg: "fov" in camera ? (camera.fov as number) : 45,
        viewport: { width: size.width, height: size.height },
        panel: panelEl?.getBoundingClientRect() ?? null,
        // 휴대폰: 위쪽 표시(시계·날씨·높이 기준)에도 안 가리게
        topInset: document.querySelector("[data-hud-top]")?.getBoundingClientRect().bottom ?? 0,
        maxDistance: maxDistanceRef.current,
        aimBelow: aimBelowRef.current,
      });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        orbit.target.copy(view.target);
        camera.position.copy(view.position);
        orbit.update();
        return;
      }
      flightRef.current = {
        fromTarget: orbit.target.clone(),
        fromPosition: camera.position.clone(),
        toTarget: view.target,
        toPosition: view.position,
        startedAt: performance.now(),
      };
      // 사용자가 지도를 잡으면 비행을 멈춘다
      const stop = () => {
        flightRef.current = null;
        orbit.removeEventListener("start", stop);
      };
      orbit.addEventListener("start", stop);
    }

    const f = flightRef.current;
    if (!f) return;
    const t = Math.min(1, (performance.now() - f.startedAt) / DURATION_MS);
    const k = easeInOut(t);
    orbit.target.lerpVectors(f.fromTarget, f.toTarget, k);
    camera.position.lerpVectors(f.fromPosition, f.toPosition, k);
    orbit.update();
    if (t >= 1) flightRef.current = null;
  });

  return null;
}
