import { describe, expect, it } from "vitest";
import { makeCompany } from "@/test/makeCompany";
import type { Company } from "@/types";
import { sortBySize } from "./sort";

const tickers = (cs: Company[]) => cs.map((c) => c.ticker);

describe("sortBySize", () => {
  it("기본은 매출 내림차순", () => {
    const cs = [
      makeCompany({ ticker: "A", revenueTtmUsd: 1 }),
      makeCompany({ ticker: "B", revenueTtmUsd: 3 }),
      makeCompany({ ticker: "C", revenueTtmUsd: 2 }),
    ];
    expect(tickers(sortBySize(cs))).toEqual(["B", "C", "A"]);
  });

  it("기준을 바꾸면 그 지표로 정렬 (총자산)", () => {
    const cs = [
      makeCompany({ ticker: "BIGREV", revenueTtmUsd: 100, totalAssetsUsd: 1 }),
      makeCompany({ ticker: "BANK", revenueTtmUsd: 10, totalAssetsUsd: 1_000 }),
    ];
    expect(tickers(sortBySize(cs, "totalAssets"))).toEqual(["BANK", "BIGREV"]);
  });

  it("같으면 티커순, null은 맨 뒤 (null끼리는 티커순)", () => {
    const cs = [
      makeCompany({ ticker: "N2", revenueTtmUsd: null }),
      makeCompany({ ticker: "ZZ", revenueTtmUsd: 5 }),
      makeCompany({ ticker: "N1", revenueTtmUsd: null }),
      makeCompany({ ticker: "AA", revenueTtmUsd: 5 }),
    ];
    expect(tickers(sortBySize(cs))).toEqual(["AA", "ZZ", "N1", "N2"]);
  });

  it("적자(음수)는 흑자보다 뒤, null보다는 앞", () => {
    const cs = [
      makeCompany({ ticker: "NULL", netIncomeTtmUsd: null }),
      makeCompany({ ticker: "LOSS", netIncomeTtmUsd: -5 }),
      makeCompany({ ticker: "WIN", netIncomeTtmUsd: 5 }),
    ];
    expect(tickers(sortBySize(cs, "netIncome"))).toEqual(["WIN", "LOSS", "NULL"]);
  });

  it("원본을 바꾸지 않는다", () => {
    const input = [makeCompany({ ticker: "A", revenueTtmUsd: 1 }), makeCompany({ ticker: "B", revenueTtmUsd: 2 })];
    sortBySize(input);
    expect(tickers(input)).toEqual(["A", "B"]);
  });
});
