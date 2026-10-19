package com.usstockmap.server.financial;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 한 기간의 한 항목 값.
 * filed = 이 값을 알 수 있게 된 날 (빼서 만든 값이면 재료 중 가장 늦은 공시일).
 * fiscalYear = 원래 공시가 붙인 회계연도 (기업 스스로 부르는 이름: NVDA 2026-01 마감 = 2026).
 */
public record PeriodValue(
        PeriodType type,
        int fiscalYear,
        String fiscalPeriod,
        LocalDate start,
        LocalDate end,
        BigDecimal value,
        LocalDate filed
) {
}
