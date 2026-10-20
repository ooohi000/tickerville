import { describe, expect, it } from "vitest";
import { describeFiscalYearEnd } from "./fiscalYear";

describe("describeFiscalYearEnd", () => {
  it.each([
    ["0125", "회계연도 1월 말 마감"],
    ["0927", "회계연도 9월 말 마감"],
    ["0630", "회계연도 6월 말 마감"],
    ["0315", "회계연도 3월 15일 마감"],
  ])("%s → %s", (mmdd, text) => {
    expect(describeFiscalYearEnd(mmdd)).toBe(text);
  });

  it("12월 말(달력과 같음)·없음·이상한 값은 null", () => {
    expect(describeFiscalYearEnd("1231")).toBeNull();
    expect(describeFiscalYearEnd(null)).toBeNull();
    expect(describeFiscalYearEnd("13xx")).toBeNull();
    expect(describeFiscalYearEnd("1340")).toBeNull();
  });
});
