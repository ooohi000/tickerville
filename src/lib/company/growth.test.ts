import { describe, expect, it } from "vitest";
import { LABEL_GAP } from "./buildingSpec";
import { HIGH_GROWTH_THRESHOLD, formatGrowth, getCraneLayout, isHighGrowth } from "./growth";

describe("isHighGrowth", () => {
  it("기준 이상이면 고성장 (경계 포함)", () => {
    expect(isHighGrowth(HIGH_GROWTH_THRESHOLD)).toBe(true);
    expect(isHighGrowth(0.55)).toBe(true);
    expect(isHighGrowth(HIGH_GROWTH_THRESHOLD - 0.01)).toBe(false);
  });

  it("역성장·없음·이상값은 아님", () => {
    expect(isHighGrowth(-0.3)).toBe(false);
    expect(isHighGrowth(null)).toBe(false);
    expect(isHighGrowth(NaN)).toBe(false);
  });
});

describe("formatGrowth", () => {
  it.each([
    [0.25, "+25%"],
    [-0.031, "−3%"],
    [0, "0%"],
    [null, "—"],
  ] as const)("%s → %s", (g, text) => {
    expect(formatGrowth(g)).toBe(text);
  });
});

describe("getCraneLayout", () => {
  const building = { width: 1, depth: 1, bodyHeight: 4 };
  const c = getCraneLayout(building);

  it("기둥은 건물 바닥 밖에 선다", () => {
    expect(c.x).toBeGreaterThan(0.5);
    expect(c.z).toBeGreaterThan(0.5);
  });

  it("팔은 옥상 바로 위, 간판(옥상 + 0.5)보다 아래", () => {
    expect(c.mastHeight).toBeGreaterThan(building.bodyHeight);
    expect(c.mastHeight).toBeLessThan(building.bodyHeight + LABEL_GAP);
  });

  it("팔 끝이 건물 중심(첨탑)까지는 닿지 않는다", () => {
    expect(c.jibLength).toBeLessThan(Math.hypot(c.x, c.z));
  });

  it("기본 각도에서 팔 끝은 건물 중심 쪽을 향한다", () => {
    // three.js y축 회전: (1,0,0) → (cos θ, 0, -sin θ)
    const tipX = c.x + Math.cos(c.baseAngle) * c.jibLength;
    const tipZ = c.z - Math.sin(c.baseAngle) * c.jibLength;
    expect(Math.hypot(tipX, tipZ)).toBeLessThan(Math.hypot(c.x, c.z));
  });
});
