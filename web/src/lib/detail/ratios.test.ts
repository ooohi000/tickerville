import { describe, expect, it } from "vitest";
import { makeStatement } from "@/test/makeStatement";
import { getStatementRatios, isNegativeEquity, safeRatio } from "./ratios";

describe("safeRatio", () => {
  it("분모가 없거나 0 이하면 null", () => {
    expect(safeRatio(1, 4)).toBe(0.25);
    expect(safeRatio(null, 4)).toBeNull();
    expect(safeRatio(1, null)).toBeNull();
    expect(safeRatio(1, 0)).toBeNull();
    expect(safeRatio(1, -5)).toBeNull();
  });

  it("분자가 음수(적자)면 음수 비율 그대로", () => {
    expect(safeRatio(-1, 4)).toBe(-0.25);
  });
});

describe("getStatementRatios", () => {
  it("표준 공식", () => {
    const r = getStatementRatios(
      makeStatement({
        fiscalYear: 2026,
        fiscalPeriod: "Q2",
        revenue: 100,
        grossProfit: 60,
        operatingIncome: 30,
        netIncome: 20,
        freeCashFlow: 15,
        totalAssets: 500,
        totalLiabilities: 300,
        totalEquity: 200,
      }),
    );
    expect(r).toEqual({
      grossMargin: 0.6,
      operatingMargin: 0.3,
      netMargin: 0.2,
      fcfMargin: 0.15,
      debtToEquity: 1.5,
      equityRatio: 0.4,
    });
  });

  it("은행처럼 매출총이익이 없으면 그 칸만 null", () => {
    const r = getStatementRatios(makeStatement({ fiscalYear: 2026, fiscalPeriod: "FY", revenue: 100, netIncome: 25 }));
    expect(r.grossMargin).toBeNull();
    expect(r.netMargin).toBe(0.25);
  });

  it("자본잠식이면 부채비율 null + 표시용 플래그", () => {
    const s = makeStatement({ fiscalYear: 2026, fiscalPeriod: "FY", totalLiabilities: 300, totalEquity: -20, totalAssets: 280 });
    expect(getStatementRatios(s).debtToEquity).toBeNull();
    expect(isNegativeEquity(s)).toBe(true);
  });
});
