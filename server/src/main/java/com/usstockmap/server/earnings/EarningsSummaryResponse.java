package com.usstockmap.server.earnings;

import java.time.LocalDate;

/** 계약 EarningsSummary */
public record EarningsSummaryResponse(LastReported lastReported, Next next) {

    public record LastReported(LocalDate date, String timing) {
    }

    /** status EXPECTED(추정, 화면에 "예상") · CONFIRMED(확정) */
    public record Next(LocalDate date, String status, String source) {
    }

    public static final EarningsSummaryResponse NONE = new EarningsSummaryResponse(null, null);
}
