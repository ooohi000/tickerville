import { describe, expect, it } from "vitest";
import {
  HEAT_MAX_OPACITY,
  HEAT_MAX_RADIUS,
  HEAT_MIN_RADIUS,
  getVolumeHeat,
  getVolumeIntensity,
} from "./volumeHeat";

describe("getVolumeIntensity", () => {
  it.each([
    [0.5, 0],
    [1, 1 / 3],
    [2, 2 / 3],
    [4, 1],
  ])("RVOL %d → %d", (rvol, expected) => {
    expect(getVolumeIntensity(rvol)).toBeCloseTo(expected, 6);
  });

  it("한산하면 0, 폭발적이면 1로 자른다", () => {
    expect(getVolumeIntensity(0.1)).toBe(0);
    expect(getVolumeIntensity(0)).toBe(0);
    expect(getVolumeIntensity(20)).toBe(1);
  });

  it("잘못된 값은 0 (원판 없음)", () => {
    expect(getVolumeIntensity(NaN)).toBe(0);
    expect(getVolumeIntensity(-1)).toBe(0);
    expect(getVolumeIntensity(Infinity)).toBe(0);
  });

  it("거래량이 많을수록 강도가 커진다", () => {
    const values = [0.6, 0.9, 1.2, 1.8, 2.6, 3.5].map(getVolumeIntensity);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });
});

describe("getVolumeHeat", () => {
  it("강도 0이면 최소 반지름, 투명", () => {
    const h = getVolumeHeat(0.3);
    expect(h.radius).toBe(HEAT_MIN_RADIUS);
    expect(h.opacity).toBe(0);
  });

  it("강도 1이면 최대 반지름, 최대 불투명도", () => {
    const h = getVolumeHeat(10);
    expect(h.radius).toBe(HEAT_MAX_RADIUS);
    expect(h.opacity).toBe(HEAT_MAX_OPACITY);
  });

  it("평소(1.0)보다 2배(2.0)가 더 크고 진하다", () => {
    const normal = getVolumeHeat(1);
    const busy = getVolumeHeat(2);
    expect(busy.radius).toBeGreaterThan(normal.radius);
    expect(busy.opacity).toBeGreaterThan(normal.opacity);
  });
});
