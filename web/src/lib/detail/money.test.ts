import { describe, expect, it } from "vitest";
import { formatPerShare, formatRatio, formatUsdKo } from "./money";

describe("formatUsdKo", () => {
  it.each([
    [466.8e9, "4,668억 달러"],
    [3.84e12, "3조 8,400억 달러"],
    [1.2e12, "1조 2,000억 달러"],
    [2e12, "2조 달러"],
    [1.9999e12, "2조 달러"], // 억 자리 반올림이 1조를 넘기면 올림
    [999.99e9, "1조 달러"],
    [35e6, "3,500만 달러"],
    [1.5e8, "2억 달러"],
    [500, "500 달러"],
    [0, "0 달러"],
    [-12e9, "−120억 달러"],
  ])("%d → %s", (usd, text) => {
    expect(formatUsdKo(usd)).toBe(text);
  });

  it("값이 없으면 —", () => {
    expect(formatUsdKo(null)).toBe("—");
    expect(formatUsdKo(Number.NaN)).toBe("—");
  });
});

describe("formatPerShare / formatRatio", () => {
  it("EPS", () => {
    expect(formatPerShare(2.344)).toBe("$2.34");
    expect(formatPerShare(-0.12)).toBe("−$0.12");
    expect(formatPerShare(null)).toBe("—");
  });

  it("비율", () => {
    expect(formatRatio(0.2534)).toBe("25.3%");
    expect(formatRatio(-0.051)).toBe("−5.1%");
    expect(formatRatio(-0.00001)).toBe("0.0%");
    expect(formatRatio(1.8, 0)).toBe("180%");
    expect(formatRatio(null)).toBe("—");
  });
});
