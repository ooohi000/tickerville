import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/math/random";
import { createDeck, draw, shuffled } from "./deck";

describe("shuffled", () => {
  it("0..n-1 을 한 번씩", () => {
    const a = shuffled(10, createRng(1));
    expect([...a].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe("draw", () => {
  it("한 바퀴 안에서는 겹치지 않는다", () => {
    const rng = createRng(7);
    let deck = createDeck(20, rng);
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) {
      const r = draw(deck, rng);
      seen.add(r.index);
      deck = r.deck;
    }
    expect(seen.size).toBe(20);
  });

  it("다시 섞을 때 방금 본 것이 바로 나오지 않는다", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = createRng(seed);
      let deck = createDeck(3, rng);
      let last = -1;
      for (let i = 0; i < 30; i++) {
        const r = draw(deck, rng);
        expect(r.index).not.toBe(last);
        last = r.index;
        deck = r.deck;
      }
    }
  });

  it("한 장짜리 더미는 계속 그 한 장", () => {
    let deck = createDeck(1);
    for (let i = 0; i < 3; i++) {
      const r = draw(deck);
      expect(r.index).toBe(0);
      deck = r.deck;
    }
  });

  it("빈 더미는 에러", () => {
    expect(() => draw(createDeck(0))).toThrow();
  });
});
