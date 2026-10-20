import type { FinancialStatement } from "@/types";

/**
 * 재무제표 한 건에서 바로 나오는 비율들. 공식은 표준 정의 그대로이고, 판단(좋다/나쁘다)은 하지 않는다.
 * 분모가 없거나 0 이하이면 null (나눗셈이 의미 없는 경우 — 예: 자본잠식이면 부채비율 null)
 */
export interface StatementRatios {
  /** 매출총이익률 = 매출총이익 / 매출 (은행은 보통 없음) */
  grossMargin: number | null;
  /** 영업이익률 = 영업이익 / 매출 */
  operatingMargin: number | null;
  /** 순이익률 = 순이익 / 매출 */
  netMargin: number | null;
  /** 잉여현금흐름 마진 = (영업현금흐름 − 설비투자) / 매출 */
  fcfMargin: number | null;
  /** 부채비율 = 부채 / 자본 (한국식 "부채비율", 1.8 = 180%) */
  debtToEquity: number | null;
  /** 자기자본비율 = 자본 / 자산 */
  equityRatio: number | null;
}

export function safeRatio(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null) return null;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return numerator / denominator;
}

export function getStatementRatios(s: FinancialStatement): StatementRatios {
  return {
    grossMargin: safeRatio(s.grossProfit, s.revenue),
    operatingMargin: safeRatio(s.operatingIncome, s.revenue),
    netMargin: safeRatio(s.netIncome, s.revenue),
    fcfMargin: safeRatio(s.freeCashFlow, s.revenue),
    debtToEquity: safeRatio(s.totalLiabilities, s.totalEquity),
    equityRatio: safeRatio(s.totalEquity, s.totalAssets),
  };
}

/** 자본잠식(자본 < 0) — 부채비율 대신 이 표시를 쓴다 */
export function isNegativeEquity(s: FinancialStatement): boolean {
  return s.totalEquity !== null && s.totalEquity < 0;
}
