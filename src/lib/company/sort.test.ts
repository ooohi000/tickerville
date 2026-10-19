import { describe, expect, it } from "vitest";
import type { Company } from "@/types";
import { sortByMarketCap } from "./sort";

const make = (ticker: string, marketCapUsd: number): Company => ({
  ticker,
  name: ticker,
  sector: "tech",
  hq: { city: "", state: "CA", lat: 0, lng: 0 },
  marketCapUsd,
  interest: 0,
});

describe("sortByMarketCap", () => {
  it("시총 내림차순", () => {
    const sorted = sortByMarketCap([make("A", 1), make("B", 3), make("C", 2)]);
    expect(sorted.map((c) => c.ticker)).toEqual(["B", "C", "A"]);
  });

  it("시총이 같으면 티커순", () => {
    const sorted = sortByMarketCap([make("ZZ", 5), make("AA", 5)]);
    expect(sorted.map((c) => c.ticker)).toEqual(["AA", "ZZ"]);
  });

  it("원본을 바꾸지 않는다", () => {
    const input = [make("A", 1), make("B", 2)];
    sortByMarketCap(input);
    expect(input.map((c) => c.ticker)).toEqual(["A", "B"]);
  });
});
