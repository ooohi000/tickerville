import { describe, expect, it } from "vitest";
import { createRng, randRange } from "./random";

describe("createRng", () => {
  it("같은 시드면 같은 수열", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });

  it("다른 시드면 다른 수열", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it("0 이상 1 미만", () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("randRange", () => {
  it("범위 안", () => {
    const r = createRng(3);
    for (let i = 0; i < 200; i++) {
      const v = randRange(r, -5, 5);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThan(5);
    }
  });
});
