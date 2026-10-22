import { describe, expect, it } from "vitest";
import { makeStatement } from "@/test/makeStatement";
import { findSameQuarterLastYear, getYoyChanges } from "./yoy";

const latest = makeStatement({ fiscalYear: 2027, fiscalPeriod: "Q2", revenue: 720, operatingIncome: 446, netIncome: 410, epsDiluted: 1.68 });
const lastYear = makeStatement({ fiscalYear: 2026, fiscalPeriod: "Q2", revenue: 441, operatingIncome: 280, netIncome: -10, epsDiluted: 1.07 });
const other = makeStatement({ fiscalYear: 2027, fiscalPeriod: "Q1", revenue: 650 });

describe("getYoyChanges", () => {
  it("작년 같은 분기를 찾아 증감률", () => {
    expect(findSameQuarterLastYear(latest, [other, lastYear, latest])).toBe(lastYear);
    const y = getYoyChanges(latest, [other, lastYear]);
    expect(y.revenue).toBeCloseTo(720 / 441 - 1);
    expect(y.operatingIncome).toBeCloseTo(446 / 280 - 1);
    expect(y.epsDiluted).toBeCloseTo(1.68 / 1.07 - 1);
  });

  it("작년이 적자거나 없으면 null", () => {
    expect(getYoyChanges(latest, [lastYear]).netIncome).toBeNull();
    expect(getYoyChanges(latest, [other])).toEqual({ revenue: null, operatingIncome: null, netIncome: null, epsDiluted: null });
  });
});
