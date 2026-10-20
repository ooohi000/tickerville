import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { groundDirs, panDelta } from "./pan";

const origin = new Vector3(0, 0, 0);

describe("groundDirs", () => {
  it("카메라가 남쪽에서 북쪽을 보면 위=북쪽(-z), 오른쪽=동쪽(+x)", () => {
    const d = groundDirs(new Vector3(0, 70, 70), origin)!;
    expect(d.up.z).toBeCloseTo(-1);
    expect(d.right.x).toBeCloseTo(1);
  });

  it("반 바퀴 돌면 위=남쪽(+z), 오른쪽=서쪽(-x)", () => {
    const d = groundDirs(new Vector3(0, 70, -70), origin)!;
    expect(d.up.z).toBeCloseTo(1);
    expect(d.right.x).toBeCloseTo(-1);
  });

  it("카메라가 바로 위에서 내려다보면 null", () => {
    expect(groundDirs(new Vector3(0, 70, 0), origin)).toBeNull();
  });

  // 과외노트 5번 표: 앞을 보면 오른손이 가리키는 쪽 (위에서 보면 시계 방향 90도)
  it.each([
    ["북쪽", new Vector3(0, 50, 50), [0, -1], [1, 0]],
    ["동쪽", new Vector3(-50, 50, 0), [1, 0], [0, 1]],
    ["남쪽", new Vector3(0, 50, -50), [0, 1], [-1, 0]],
    ["서쪽", new Vector3(50, 50, 0), [-1, 0], [0, -1]],
  ] as const)("%s을 보면 위·오른쪽 (x, z)", (_, camera, up, right) => {
    const d = groundDirs(camera, origin)!;
    expect([d.up.x, d.up.z].map((v) => Math.round(v) + 0)).toEqual(up);
    expect([d.right.x, d.right.z].map((v) => Math.round(v) + 0)).toEqual(right);
  });

  it("카메라 높이·거리와 상관없이 길이 1 (정규화)", () => {
    const far = groundDirs(new Vector3(30, 200, 400), origin)!;
    expect(far.up.length()).toBeCloseTo(1);
    expect(far.right.length()).toBeCloseTo(1);
    expect(far.up.y).toBe(0);
  });
});

describe("panDelta", () => {
  it("처음 시점에서 위 3 = 북쪽으로 3, 오른쪽 3 = 동쪽으로 3", () => {
    const cam = new Vector3(0, 70, 70);
    const up = panDelta(cam, origin, 0, 3);
    expect([up.x, up.y, up.z].map((v) => v + 0)).toEqual([0, 0, -3]);
    const right = panDelta(cam, origin, 3, 0);
    expect(right.x).toBeCloseTo(3);
    expect(right.z).toBeCloseTo(0);
  });

  it("높이는 바뀌지 않는다 (땅 위로만 이동)", () => {
    expect(panDelta(new Vector3(20, 90, 40), origin, 2, 5).y).toBe(0);
  });

  it("방향을 모르면 (바로 위) 움직이지 않는다", () => {
    expect(panDelta(new Vector3(0, 70, 0), origin, 3, 3).length()).toBe(0);
  });
});
