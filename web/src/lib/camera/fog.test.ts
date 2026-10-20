import { describe, expect, it } from "vitest";
import { getFogRange } from "./fog";

describe("getFogRange", () => {
  it("예전 첫 화면 거리(≈99)에서 예전 값(110~260)과 비슷", () => {
    const r = getFogRange(99);
    expect(r.near).toBeCloseTo(108.9);
    expect(r.far).toBeCloseTo(257.4);
  });

  it("안개는 항상 보는 점(지도)보다 멀리서 시작 → 지도는 맑다", () => {
    for (const d of [30, 99, 220, 400]) {
      expect(getFogRange(d).near).toBeGreaterThan(d);
      expect(getFogRange(d).far).toBeGreaterThan(getFogRange(d).near);
    }
  });

  it("거리 0 이하도 깨지지 않는다", () => {
    expect(getFogRange(0).near).toBeGreaterThan(0);
  });
});
