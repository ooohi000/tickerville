import type { FinancialStatement } from "@/types";

/**
 * 테스트용 재무제표 한 건. 필요한 필드만 덮어쓴다 (필드가 늘면 여기만 고친다).
 */
export function makeStatement(
  overrides: Partial<FinancialStatement> & Pick<FinancialStatement, "fiscalYear" | "fiscalPeriod">,
): FinancialStatement {
  return {
    periodEnd: "2026-01-01",
    filedAt: null,
    revenue: null,
    grossProfit: null,
    operatingIncome: null,
    netIncome: null,
    epsDiluted: null,
    totalAssets: null,
    totalLiabilities: null,
    totalEquity: null,
    operatingCashFlow: null,
    capitalExpenditure: null,
    freeCashFlow: null,
    ...overrides,
  };
}
