package com.usstockmap.server.financial;

import java.math.BigDecimal;
import java.time.LocalDate;

/** 계약 FinancialStatement (docs/api.md /financials). 금액은 달러, 원본에 없으면 null */
public record FinancialStatementResponse(
        int fiscalYear,
        String fiscalPeriod,
        LocalDate periodEnd,
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

    public static FinancialStatementResponse from(FinancialPeriod p) {
        return new FinancialStatementResponse(p.getFiscalYear(), p.getFiscalPeriod(), p.getPeriodEnd(), p.getFiledAt(),
                p.getRevenue(), p.getGrossProfit(), p.getOperatingIncome(), p.getNetIncome(),
                p.getEpsDiluted() == null ? null : p.getEpsDiluted().stripTrailingZeros(),
                p.getTotalAssets(), p.getTotalLiabilities(), p.getTotalEquity(), p.getOperatingCashFlow(),
                p.getCapitalExpenditure(), p.getFreeCashFlow());
    }
}
