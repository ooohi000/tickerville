import { describe, expect, it } from "vitest";
import {
  CLOUD_ALTITUDE,
  LIGHTNING,
  RAIN,
  SKY_BOUNDS,
  fallY,
  getCloudLayout,
  getLightningIntensity,
  getRainDropPositions,
} from "./sky";
import { WEATHER_SPECS } from "./weather";

describe("getCloudLayout", () => {
  it("요청한 개수만큼, 0이면 없음", () => {
    expect(getCloudLayout(12)).toHaveLength(12);
    expect(getCloudLayout(0)).toHaveLength(0);
    expect(getCloudLayout(-3)).toHaveLength(0);
  });

  it("같은 시드면 같은 배치 (새로고침해도 안 바뀜)", () => {
    expect(getCloudLayout(5, 9)).toEqual(getCloudLayout(5, 9));
  });

  it("구름이 하늘 범위·고도 안에 있다", () => {
    for (const c of getCloudLayout(40)) {
      expect(c.x).toBeGreaterThanOrEqual(SKY_BOUNDS.minX);
      expect(c.x).toBeLessThan(SKY_BOUNDS.maxX);
      expect(c.z).toBeGreaterThanOrEqual(SKY_BOUNDS.minZ);
      expect(c.z).toBeLessThan(SKY_BOUNDS.maxZ);
      expect(c.y).toBeGreaterThanOrEqual(CLOUD_ALTITUDE.min);
      expect(c.y).toBeLessThan(CLOUD_ALTITUDE.max);
      expect(c.puffs.length).toBeGreaterThanOrEqual(3);
      expect(c.puffs.length).toBeLessThanOrEqual(6);
    }
  });

  it("가장 높은 건물보다 구름이 위에 있다", () => {
    // mega 최대 높이 ≈ 10층 × 0.4 × 1.5 + 첨탑 1.5 + 간판 ≈ 9
    expect(CLOUD_ALTITUDE.min - 2.2).toBeGreaterThan(10);
  });

  it("폭풍 날씨 구름 수도 문제없이 만든다", () => {
    expect(getCloudLayout(WEATHER_SPECS.storm.cloudCount)).toHaveLength(
      WEATHER_SPECS.storm.cloudCount,
    );
  });
});

describe("rain", () => {
  it("빗방울 좌표 개수 = 방울 수 × 3", () => {
    expect(getRainDropPositions(100)).toHaveLength(300);
  });

  it("떨어지다 바닥 아래로 가면 위로 되돌아간다", () => {
    expect(fallY(10, 0.1)).toBeCloseTo(10 - RAIN.speed * 0.1);
    const wrapped = fallY(RAIN.bottom + 0.5, 0.1);
    expect(wrapped).toBeGreaterThan(RAIN.bottom);
    expect(wrapped).toBeLessThanOrEqual(RAIN.top);
  });
});

describe("getLightningIntensity", () => {
  it("주기 시작에 최대로 번쩍", () => {
    expect(getLightningIntensity(0)).toBeCloseTo(LIGHTNING.peak);
    expect(getLightningIntensity(LIGHTNING.interval * 3)).toBeCloseTo(LIGHTNING.peak);
  });

  it("두 번째 번쩍임", () => {
    expect(getLightningIntensity(LIGHTNING.flashes[1])).toBeCloseTo(LIGHTNING.peak);
  });

  it("평소엔 0", () => {
    expect(getLightningIntensity(3)).toBe(0);
    expect(getLightningIntensity(LIGHTNING.duration + 0.01)).toBe(0);
  });

  it("음수 시간도 안전", () => {
    expect(Number.isFinite(getLightningIntensity(-1))).toBe(true);
  });
});
