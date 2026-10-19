import { describe, expect, it } from "vitest";
import { makeCompany } from "@/test/makeCompany";
import type { Company } from "@/types";
import { getClusterListView } from "./clusterList";

const make = (ticker: string): Company => makeCompany({ ticker });
const list = (n: number) => Array.from({ length: n }, (_, i) => make(`T${i}`));
const tickers = (cs: Company[]) => cs.map((c) => c.ticker);

describe("getClusterListView", () => {
  it("기준 개수 이하면 전부, 더보기 없음", () => {
    expect(getClusterListView(list(5), false, 5)).toEqual({ items: list(5), remaining: 0 });
  });

  it("넘치면 앞에서부터 자르고 남은 개수 표시", () => {
    const v = getClusterListView(list(8), false, 5);
    expect(tickers(v.items)).toEqual(["T0", "T1", "T2", "T3", "T4"]);
    expect(v.remaining).toBe(3);
  });

  it("펼치면 전부", () => {
    const v = getClusterListView(list(8), true, 5);
    expect(v.items).toHaveLength(8);
    expect(v.remaining).toBe(0);
  });

  it("빈 목록도 안전", () => {
    expect(getClusterListView([], false)).toEqual({ items: [], remaining: 0 });
  });
});
