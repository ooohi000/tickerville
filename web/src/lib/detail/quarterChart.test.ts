import { describe, expect, it } from "vitest";
import { makeStatement } from "@/test/makeStatement";
import type { FinancialStatement } from "@/types";
import { buildQuarterPoints, getChartRange } from "./quarterChart";

const q = (fy: number, fp: "Q1" | "Q2" | "Q3" | "Q4", periodEnd: string, revenue: number | null, extra: Partial<FinancialStatement> = {}) =>
  makeStatement({ fiscalYear: fy, fiscalPeriod: fp, periodEnd, revenue, ...extra });

describe("buildQuarterPoints", () => {
  // API 는 최신순
  const api = [
    q(2026, "Q2", "2026-07-26", 150, { operatingIncome: 60, netIncome: 45 }),
    makeStatement({ fiscalYear: 2026, fiscalPeriod: "FY", periodEnd: "2026-01-25", revenue: 500 }),
    q(2026, "Q1", "2026-04-26", 130),
    q(2025, "Q4", "2026-01-25", 140),
    q(2025, "Q3", "2025-10-26", 120),
    q(2025, "Q2", "2025-07-27", 100),
  ];

  it("오래된 순, 연간 제외, 회계연도 라벨", () => {
    const points = buildQuarterPoints(api);
    expect(points.map((p) => p.label)).toEqual(["FY25 Q2", "FY25 Q3", "FY25 Q4", "FY26 Q1", "FY26 Q2"]);
  });

  it("작년 같은 분기가 있으면 YoY, 없으면 null. 영업이익률도 같이", () => {
    const last = buildQuarterPoints(api).at(-1)!;
    expect(last.revenueYoy).toBeCloseTo(0.5);
    expect(last.operatingMargin).toBe(0.4);
    expect(buildQuarterPoints(api)[0].revenueYoy).toBeNull();
  });

  it("최근 n개만, 중복 분기는 최신(먼저 온 것)", () => {
    const dup = [q(2026, "Q2", "2026-07-26", 150), q(2026, "Q2", "2026-07-26", 999), ...api.slice(2)];
    const points = buildQuarterPoints(dup, 2);
    expect(points.map((p) => p.label)).toEqual(["FY26 Q1", "FY26 Q2"]);
    expect(points[1].revenue).toBe(150);
  });

  it("빈 목록이면 빈 배열", () => {
    expect(buildQuarterPoints([])).toEqual([]);
  });
});

describe("getChartRange", () => {
  it("0 을 포함하고 적자면 아래로", () => {
    const points = buildQuarterPoints([
      q(2026, "Q2", "2026-07-01", 100, { netIncome: -20 }),
      q(2026, "Q1", "2026-04-01", 80, { netIncome: 10 }),
    ]);
    expect(getChartRange(points, "revenue")).toEqual({ min: 0, max: 100 });
    expect(getChartRange(points, "netIncome")).toEqual({ min: -20, max: 10 });
  });

  it("값이 없으면 null", () => {
    expect(getChartRange(buildQuarterPoints([q(2026, "Q1", "2026-04-01", null)]), "revenue")).toBeNull();
  });
});
