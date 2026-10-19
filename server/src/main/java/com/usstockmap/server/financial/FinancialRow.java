package com.usstockmap.server.financial;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 정리된 재무제표 한 기간 (financial_period 테이블, 계약 FinancialStatement 와 같은 항목).
 * 금액은 달러 정수, 원본에 없으면 null.
 */
public record FinancialRow(
        PeriodType type,
        int fiscalYear,
        String fiscalPeriod,
        LocalDate start,
        LocalDate end,
        LocalDate filedAt,
        Long revenue,
        Long grossProfit,
        Long operatingIncome,
        Long netIncome,
        BigDecimal epsDiluted,
        Long totalAssets,
        Long totalLiabilities,
        Long totalEquity,
        Long operatingCashFlow,
        Long capitalExpenditure,
        Long freeCashFlow
) {
}
