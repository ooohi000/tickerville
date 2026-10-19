package com.usstockmap.server.filing;

import com.usstockmap.server.collector.sec.SecFiling;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** 땅 "열기"의 재료: 오늘 포함 최근 30일(미국 동부 날짜) 공시 건수 */
public final class FilingActivityCalculator {

    public static final int WINDOW_DAYS = 30;
    static final Set<String> MATERIAL = Set.of("8-K", "8-K/A");
    static final Set<String> INSIDER = Set.of("4", "4/A");

    private FilingActivityCalculator() {
    }

    public static FilingActivity count(List<SecFiling> filings, LocalDate today) {
        LocalDate from = today.minusDays(WINDOW_DAYS - 1);
        int material = 0;
        int insider = 0;
        for (SecFiling f : filings) {
            if (f.filedAt().isBefore(from) || f.filedAt().isAfter(today)) {
                continue;
            }
            if (MATERIAL.contains(f.form())) {
                material++;
            } else if (INSIDER.contains(f.form())) {
                insider++;
            }
        }
        return new FilingActivity(material, insider);
    }
}
