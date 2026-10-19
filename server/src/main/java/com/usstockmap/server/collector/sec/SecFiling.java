package com.usstockmap.server.collector.sec;

import java.time.Instant;
import java.time.LocalDate;

/** submissions 의 공시 한 건 */
public record SecFiling(
        String accession,
        String form,
        LocalDate filedAt,
        LocalDate reportDate,
        Instant acceptedAt,
        /** 8-K 항목 번호 "2.02,9.01" (2.02 = 실적 발표) */
        String items,
        String url
) {

    public boolean hasItem(String item) {
        if (items == null || items.isBlank()) {
            return false;
        }
        for (String i : items.split(",")) {
            if (i.trim().equals(item)) {
                return true;
            }
        }
        return false;
    }
}
