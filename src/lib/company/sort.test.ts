import { describe, expect, it } from "vitest";
import type { Company } from "@/types";
import { sortBySize } from "./sort";

const make = (ticker: string, revenueTtmUsd: number | null): Company => ({
  ticker,
  name: ticker,
  sector: "tech",
  hq: { city: "", state: "CA", lat: 0, lng: 0 },
  revenueTtmUsd,
  filings30d: { material: 0, insider: 0 },
});
const tickers = (cs: Company[]) => cs.map((c) => c.ticker);

describe("sortBySize", () => {
  it("매출 내림차순", () => {
    expect(tickers(sortBySize([make("A", 1), make("B", 3), make("C", 2)]))).toEqual(["B", "C", "A"]);
  });

  it("매출이 같으면 티커순", () => {
    expect(tickers(sortBySize([make("ZZ", 5), make("AA", 5)]))).toEqual(["AA", "ZZ"]);
  });

  it("매출 정보 없는 기업은 맨 뒤", () => {
    expect(tickers(sortBySize([make("N", null), make("A", 0), make("B", 7)]))).toEqual(["B", "A", "N"]);
  });

  it("원본을 바꾸지 않는다", () => {
    const input = [make("A", 1), make("B", 2)];
    sortBySize(input);
    expect(tickers(input)).toEqual(["A", "B"]);
  });
});
