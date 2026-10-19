import { describe, expect, it } from "vitest";
import { distanceKm } from "./distance";

describe("distanceKm", () => {
  it("같은 점은 0", () => {
    expect(distanceKm({ lat: 37, lng: -122 }, { lat: 37, lng: -122 })).toBe(0);
  });

  it("샌프란시스코–뉴욕은 약 4,130km", () => {
    const d = distanceKm(
      { lat: 37.7749, lng: -122.4194 },
      { lat: 40.7128, lng: -74.006 },
    );
    expect(d).toBeGreaterThan(4080);
    expect(d).toBeLessThan(4180);
  });

  it("쿠퍼티노–산타클라라는 실리콘밸리 반경(40km) 안", () => {
    const d = distanceKm(
      { lat: 37.3349, lng: -122.009 },
      { lat: 37.3707, lng: -121.9638 },
    );
    expect(d).toBeLessThan(40);
  });
});
