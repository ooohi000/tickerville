import { describe, expect, it } from "vitest";
import { isPointInPolygon, isPointInRing } from "./polygon";

const square = [
  { x: 0, z: 0 },
  { x: 10, z: 0 },
  { x: 10, z: 10 },
  { x: 0, z: 10 },
];
const hole = [
  { x: 4, z: 4 },
  { x: 6, z: 4 },
  { x: 6, z: 6 },
  { x: 4, z: 6 },
];

describe("isPointInRing", () => {
  it("안/밖", () => {
    expect(isPointInRing({ x: 5, z: 5 }, square)).toBe(true);
    expect(isPointInRing({ x: 15, z: 5 }, square)).toBe(false);
    expect(isPointInRing({ x: -1, z: -1 }, square)).toBe(false);
  });

  it("끝점이 중복된 닫힌 고리도 같은 결과", () => {
    expect(isPointInRing({ x: 5, z: 5 }, [...square, square[0]])).toBe(true);
  });
});

describe("isPointInPolygon", () => {
  it("구멍 안은 밖으로 본다", () => {
    const poly = { outer: square, holes: [hole] };
    expect(isPointInPolygon({ x: 2, z: 2 }, poly)).toBe(true);
    expect(isPointInPolygon({ x: 5, z: 5 }, poly)).toBe(false);
  });
});
