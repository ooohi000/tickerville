import type { FinancialStatement } from "@/types";

/** 작년 같은 분기 대비 증감 (0.63 = +63%). 작년 값이 없거나 0 이하(적자)면 null — 적자에서의 % 는 뜻이 없다 */
export interface YoyChanges {
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  epsDiluted: number | null;
}

/** 분기 목록(순서 무관)에서 latest 의 작년 같은 분기 */
export function findSameQuarterLastYear(
  latest: FinancialStatement,
  quarters: readonly FinancialStatement[],
): FinancialStatement | null {
  return (
    quarters.find((q) => q.fiscalPeriod === latest.fiscalPeriod && q.fiscalYear === latest.fiscalYear - 1) ?? null
  );
}

function change(current: number | null, previous: number | null | undefined): number | null {
  if (current === null || previous === null || previous === undefined || previous <= 0) return null;
  return current / previous - 1;
}

export function getYoyChanges(latest: FinancialStatement, quarters: readonly FinancialStatement[]): YoyChanges {
  const prev = findSameQuarterLastYear(latest, quarters);
  return {
    revenue: change(latest.revenue, prev?.revenue),
    operatingIncome: change(latest.operatingIncome, prev?.operatingIncome),
    netIncome: change(latest.netIncome, prev?.netIncome),
    epsDiluted: change(latest.epsDiluted, prev?.epsDiluted),
  };
}
