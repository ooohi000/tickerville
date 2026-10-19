"use client";

import { CanvasTexture, type Texture } from "three";
import { getEventHeat } from "@/lib/company/eventHeat";
import type { FilingActivity } from "@/types";

/** 땅 윗면·경계선과 겹쳐 깜빡이지 않게 띄우는 높이 (경계선보다 살짝 아래) */
const HEAT_LIFT = 0.005;

let sharedTexture: Texture | null = null;

/** 가운데가 진하고 가장자리로 갈수록 사라지는 원형 그라데이션. 모든 원판이 하나를 공유 */
function getRadialTexture(): Texture | null {
  if (sharedTexture) return sharedTexture;
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.6, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedTexture = new CanvasTexture(canvas);
  return sharedTexture;
}

export interface EventHeatProps {
  filings: FilingActivity;
}

/** 건물 바닥 주변 원판. 최근 공시가 많을수록 넓고 진하다. 강도 0이면 그리지 않는다 */
export function EventHeat({ filings }: EventHeatProps) {
  const heat = getEventHeat(filings);
  if (heat.intensity === 0) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, HEAT_LIFT, 0]} renderOrder={1}>
      <circleGeometry args={[heat.radius, 48]} />
      <meshBasicMaterial
        color={heat.color}
        alphaMap={getRadialTexture()}
        transparent
        opacity={heat.opacity}
        depthWrite={false}
      />
    </mesh>
  );
}
