import type { FinancialStatement } from "@/types";
import { safeRatio } from "./ratios";

/** 분기 차트 한 칸 (오래된 것 → 최신 순) */
export interface QuarterPoint {
  key: string; // "2026-Q2" (React key)
  /** "FY26 Q2" — 회계연도 기준이라 달력 분기와 다를 수 있음 */
  label: string;
  periodEnd: string;
  revenue: number | null;
  netIncome: number | null;
  operatingMargin: number | null;
  /** 작년 같은 분기 대비 매출 증감률. 목록에 작년 분기가 없으면 null */
  revenueYoy: number | null;
}

const QUARTERS = new Set(["Q1", "Q2", "Q3", "Q4"]);

/**
 * API 재무제표(최신순) → 분기 차트 데이터.
 * 연간(FY)은 빼고, 같은 분기가 두 번 오면 먼저 온 것(최신)만 쓴다. 최근 maxPoints 개만.
 */
export function buildQuarterPoints(statements: FinancialStatement[], maxPoints = 8): QuarterPoint[] {
  const byKey = new Map<string, FinancialStatement>();
  for (const s of statements) {
    if (!QUARTERS.has(s.fiscalPeriod)) continue;
    const key = `${s.fiscalYear}-${s.fiscalPeriod}`;
    if (!byKey.has(key)) byKey.set(key, s);
  }
  const ordered = [...byKey.values()].sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));

  return ordered.slice(-maxPoints).map((s) => {
    const lastYear = byKey.get(`${s.fiscalYear - 1}-${s.fiscalPeriod}`);
    return {
      key: `${s.fiscalYear}-${s.fiscalPeriod}`,
      label: `FY${String(s.fiscalYear).slice(-2)} ${s.fiscalPeriod}`,
      periodEnd: s.periodEnd,
      revenue: s.revenue,
      netIncome: s.netIncome,
      operatingMargin: safeRatio(s.operatingIncome, s.revenue),
      revenueYoy: growth(s.revenue, lastYear?.revenue ?? null),
    };
  });
}

function growth(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous <= 0) return null;
  return current / previous - 1;
}

/**
 * 막대 차트 세로 범위. 적자(음수)가 있으면 0 아래까지, 항상 0 을 포함한다.
 * 값이 하나도 없으면 null (차트 대신 "데이터 없음")
 */
export function getChartRange(
  points: QuarterPoint[],
  field: "revenue" | "netIncome",
): { min: number; max: number } | null {
  const values = points.map((p) => p[field]).filter((v): v is number => v !== null && Number.isFinite(v));
  if (values.length === 0) return null;
  return { min: Math.min(0, ...values), max: Math.max(0, ...values) };
}
