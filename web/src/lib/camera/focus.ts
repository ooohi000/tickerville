import { Vector3 } from "three";
import { groundDirs } from "./pan";
import type { ScreenRect } from "./targetLine";

/**
 * 상세 패널을 열면 카메라가 고른 건물로 날아간다 ("조준").
 * 지금 각도·방향은 그대로 두고, 거리만 가까이(최대 FOCUS_DISTANCE) 당긴 뒤
 * 건물이 패널에 가리지 않는 영역의 가운데에 오도록 보는 점을 옮긴다.
 * - 데스크톱(패널 오른쪽): 패널 왼쪽 남은 화면의 가운데
 * - 휴대폰(아래 시트): 시트 위 남은 화면의 가운데
 */
export const FOCUS_DISTANCE = 45;

export interface FocusInput {
  building: Vector3;
  cameraPosition: Vector3;
  target: Vector3;
  fovDeg: number;
  viewport: { width: number; height: number };
  panel: ScreenRect | null;
  /** 화면 위쪽 표시의 아래 끝 (px). visibleCenter 참고 */
  topInset?: number;
}

export interface FocusView {
  target: Vector3;
  position: Vector3;
  /** 건물이 놓일 화면 자리 (검증·디버그용) */
  screen: { x: number; y: number };
}

/**
 * 패널이 가리지 않는 영역의 가운데 (화면 px).
 * topInset: 화면 위쪽에 떠 있는 표시(시계·날씨·높이 기준)의 아래 끝 — 아래 시트일 때 그 사이 가운데로.
 */
export function visibleCenter(
  viewport: { width: number; height: number },
  panel: ScreenRect | null,
  topInset = 0,
) {
  const { width: w, height: h } = viewport;
  if (!panel) return { x: w / 2, y: h / 2 };
  // 아래 시트: 위 표시와 시트 사이 (사이가 너무 좁으면 위 표시는 무시)
  if (panel.top > h / 3) {
    const top = panel.top - topInset >= 80 ? topInset : 0;
    return { x: w / 2, y: (top + panel.top) / 2 };
  }
  // 오른쪽 패널: 패널 왼쪽 영역
  return { x: panel.left / 2, y: h / 2 };
}

export function computeFocusView({
  building,
  cameraPosition,
  target,
  fovDeg,
  viewport,
  panel,
  topInset = 0,
}: FocusInput): FocusView {
  const offset = new Vector3().subVectors(cameraPosition, target);
  const currentDistance = offset.length();
  const distance = Math.min(currentDistance, FOCUS_DISTANCE);
  const back = offset.clone().normalize();
  const sinPitch = Math.max(0.2, back.y);

  // 보는 점 거리에서 화면 1px = 몇 월드 단위인가
  const worldPerPx = (2 * distance * Math.tan(((fovDeg / 2) * Math.PI) / 180)) / viewport.height;
  const want = visibleCenter(viewport, panel, topInset);
  const ox = want.x - viewport.width / 2; // + 면 건물이 화면 오른쪽에
  const oy = want.y - viewport.height / 2; // + 면 건물이 화면 아래에

  const dirs = groundDirs(cameraPosition, target) ?? { up: new Vector3(0, 0, -1), right: new Vector3(1, 0, 0) };
  // 건물을 화면 왼쪽(−ox)에 두려면 보는 점을 오른쪽으로, 위(−oy)에 두려면 보는 점을 카메라 쪽(−up)으로
  const newTarget = building
    .clone()
    .setY(target.y)
    .addScaledVector(dirs.right, -ox * worldPerPx)
    .addScaledVector(dirs.up, (oy * worldPerPx) / sinPitch);
  const position = newTarget.clone().addScaledVector(back, distance);
  return { target: newTarget, position, screen: want };
}
