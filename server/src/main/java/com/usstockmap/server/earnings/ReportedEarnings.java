package com.usstockmap.server.earnings;

import java.time.LocalDate;

/** 실제로 나온 실적 발표 (8-K 항목 2.02) */
public record ReportedEarnings(String accession, LocalDate eventDate, EarningsTiming timing) {
}
