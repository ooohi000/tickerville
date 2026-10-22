import { describe, expect, it } from "vitest";
import { getRingArc } from "./gauge";

describe("getRingArc", () => {
  it("비율만큼 둘레를 채운다", () => {
    const a = getRingArc(0.62, 34)!;
    expect(a.circumference).toBeCloseTo(213.63, 1);
    expect(a.filled).toBeCloseTo(a.circumference * 0.62);
    expect(a.negative).toBe(false);
  });

  it("적자는 0 으로 채우고 negative, 100% 넘으면 꽉 참, 값 없으면 null", () => {
    expect(getRingArc(-0.1, 34)).toMatchObject({ filled: 0, negative: true });
    expect(getRingArc(1.4, 34)!.filled).toBeCloseTo(getRingArc(1, 34)!.circumference);
    expect(getRingArc(null, 34)).toBeNull();
  });
});
