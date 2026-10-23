import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { FOCUS_DISTANCE, computeFocusView, visibleCenter } from "./focus";

/** 실제 three 카메라로 건물이 화면 어디에 찍히는지 */
function projectPx(view: { target: Vector3; position: Vector3 }, building: Vector3, w: number, h: number) {
  const cam = new PerspectiveCamera(45, w / h, 0.1, 5000);
  cam.position.copy(view.position);
  cam.lookAt(view.target);
  cam.updateMatrixWorld();
  const p = building.clone().project(cam);
  return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h };
}

const start = { cameraPosition: new Vector3(0, 150, 130), target: new Vector3(0, 0, 0), fovDeg: 45 };
const building = new Vector3(-45, 1, -4); // 실리콘밸리 근처

describe("visibleCenter", () => {
  it("오른쪽 패널이면 왼쪽 영역 가운데, 아래 시트면 위 영역 가운데", () => {
    expect(visibleCenter({ width: 1280, height: 800 }, { left: 864, top: 16, right: 1264, bottom: 784 })).toEqual({ x: 432, y: 400 });
    expect(visibleCenter({ width: 390, height: 844 }, { left: 12, top: 300, right: 378, bottom: 832 })).toEqual({ x: 195, y: 150 });
  });

  it("아래 시트면 위쪽 표시와 시트 사이 가운데, 사이가 너무 좁으면 위쪽 표시 무시", () => {
    const sheet = { left: 12, top: 300, right: 378, bottom: 832 };
    expect(visibleCenter({ width: 390, height: 844 }, sheet, 180)).toEqual({ x: 195, y: 240 });
    expect(visibleCenter({ width: 390, height: 844 }, sheet, 260)).toEqual({ x: 195, y: 150 });
  });
});

describe("computeFocusView", () => {
  it.each([
    ["데스크톱 오른쪽 패널", 1280, 800, { left: 864, top: 16, right: 1264, bottom: 784 }],
    ["휴대폰 아래 시트", 390, 844, { left: 12, top: 300, right: 378, bottom: 832 }],
  ])("%s: 건물이 패널에 안 가리는 영역 가운데 근처에 온다", (_, w, h, panel) => {
    const view = computeFocusView({ ...start, building, viewport: { width: w, height: h }, panel });
    const px = projectPx(view, building, w, h);
    expect(Math.abs(px.x - view.screen.x)).toBeLessThan(w * 0.08);
    expect(Math.abs(px.y - view.screen.y)).toBeLessThan(h * 0.08);
    // 패널 밖
    expect(px.x < panel.left || px.y < panel.top).toBe(true);
  });

  it("가까이 당기되 각도는 그대로", () => {
    const view = computeFocusView({ ...start, building, viewport: { width: 1280, height: 800 }, panel: null });
    expect(view.position.distanceTo(view.target)).toBeCloseTo(FOCUS_DISTANCE);
    const before = start.cameraPosition.clone().sub(start.target).normalize();
    const after = view.position.clone().sub(view.target).normalize();
    expect(after.angleTo(before)).toBeLessThan(1e-6);
  });

  it("이미 더 가까우면 거리는 그대로", () => {
    const near = { cameraPosition: new Vector3(0, 20, 20), target: new Vector3(0, 0, 0), fovDeg: 45 };
    const view = computeFocusView({ ...near, building, viewport: { width: 1280, height: 800 }, panel: null });
    expect(view.position.distanceTo(view.target)).toBeCloseTo(Math.hypot(20, 20));
  });
});

describe("aimBelow", () => {
  it("겨누는 점을 화면 아래로 내린다", async () => {
    const { computeFocusView } = await import("./focus");
    const { Vector3 } = await import("three");
    const base = {
      building: new Vector3(0, 0, 0),
      cameraPosition: new Vector3(0, 40, 40),
      target: new Vector3(0, 0, 0),
      fovDeg: 45,
      viewport: { width: 1000, height: 800 },
      panel: null,
    };
    expect(computeFocusView(base).screen.y).toBe(400);
    expect(computeFocusView({ ...base, aimBelow: 90 }).screen.y).toBe(490);
  });
});
