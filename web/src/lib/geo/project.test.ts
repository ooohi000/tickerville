import { describe, expect, it } from "vitest";
import { projectLatLng } from "./project";

describe("projectLatLng", () => {
  const sf = projectLatLng(37.7749, -122.4194)!;
  const ny = projectLatLng(40.7128, -74.006)!;
  const miami = projectLatLng(25.7617, -80.1918)!;
  const seattle = projectLatLng(47.6062, -122.3321)!;

  it("미국 안의 좌표는 투영된다", () => {
    expect(sf).not.toBeNull();
    expect(ny).not.toBeNull();
  });

  it("동쪽일수록 x가 크다", () => {
    expect(ny.x).toBeGreaterThan(sf.x);
  });

  it("남쪽일수록 z가 크다", () => {
    expect(miami.z).toBeGreaterThan(seattle.z);
  });

  it("본토 폭이 약 100 단위다", () => {
    const width = ny.x - sf.x;
    expect(width).toBeGreaterThan(70);
    expect(width).toBeLessThan(110);
  });

  it("미국 밖(서울)은 null", () => {
    expect(projectLatLng(37.5665, 126.978)).toBeNull();
  });

  it("알래스카·하와이도 투영된다", () => {
    expect(projectLatLng(61.2181, -149.9003)).not.toBeNull();
    expect(projectLatLng(21.3069, -157.8583)).not.toBeNull();
  });
});
