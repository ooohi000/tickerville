import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { MAP_BOUNDS, fitMapView } from "./fitView";

/** 실제 three 카메라로 본토 네 모서리를 화면 좌표(-1~1)로 찍어 본다 */
function cornersOnScreen(aspect: number, fovDeg = 45) {
  const view = fitMapView({ aspect, fovDeg });
  const camera = new PerspectiveCamera(fovDeg, aspect, 0.1, 5000);
  camera.position.set(...view.position);
  camera.lookAt(new Vector3(...view.target));
  camera.updateMatrixWorld();
  const { minX, maxX, minZ, maxZ } = MAP_BOUNDS;
  return [
    [minX, minZ],
    [maxX, minZ],
    [minX, maxZ],
    [maxX, maxZ],
  ].map(([x, z]) => new Vector3(x, 0, z).project(camera));
}

describe("fitMapView", () => {
  it.each([
    ["데스크톱 16:9", 16 / 9],
    ["노트북 16:10", 1.6],
    ["정사각형", 1],
    ["휴대폰 세로", 390 / 844],
    ["브라우저 창 세로", 800 / 1145],
  ])("%s: 본토 네 모서리가 모두 화면 안", (_, aspect) => {
    for (const p of cornersOnScreen(aspect)) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1);
    }
  });

  it("넓은 화면에서는 꽉 차게 (너무 멀리 빼지 않는다)", () => {
    const xs = cornersOnScreen(16 / 9).map((p) => Math.abs(p.x));
    const ys = cornersOnScreen(16 / 9).map((p) => Math.abs(p.y));
    expect(Math.max(...xs, ...ys)).toBeGreaterThan(0.85);
  });

  it("세로로 긴 화면일수록 더 멀리", () => {
    const wide = fitMapView({ aspect: 16 / 9, fovDeg: 45 }).distance;
    const phone = fitMapView({ aspect: 390 / 844, fovDeg: 45 }).distance;
    expect(phone).toBeGreaterThan(wide * 2);
  });

  it("카메라는 남쪽 하늘에서 지도 가운데를 본다 (각도 50도)", () => {
    const v = fitMapView({ aspect: 1.6, fovDeg: 45 });
    const [tx, , tz] = v.target;
    const [px, py, pz] = v.position;
    expect(px).toBeCloseTo(tx);
    expect(pz).toBeGreaterThan(tz);
    expect((Math.atan2(py, pz - tz) * 180) / Math.PI).toBeCloseTo(50);
    expect(Math.hypot(py, pz - tz)).toBeCloseTo(v.distance);
  });
});
