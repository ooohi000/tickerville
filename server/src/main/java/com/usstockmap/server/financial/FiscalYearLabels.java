package com.usstockmap.server.financial;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

/**
 * 회계연도 이름표 (회사가 스스로 부르는 이름: NVDA 2026-01 마감 = FY2026, 애플 2025-09 마감 = FY2025).
 *
 * <p>규칙: 10-K 한 건의 fy 는 "그 공시 안에서 가장 늦게 끝나는 연간 기간"의 이름이다.
 * 그래서 공시마다 (가장 늦은 연간 기간 끝 → fy) 를 모아 두고, 연간 기간 끝 날짜로 찾는다.
 *
 * <p>개념(태그)과 상관없이 정해져야 한다. 처음엔 "그 값이 처음 실린 공시의 fy"를 썼는데,
 * 알파벳은 2025년에 매출 태그를 바꿔서 새 태그로는 FY2024 값이 FY2025 10-K 의 비교 열에 처음 나온다
 * → FY2024 가 FY2025 로 붙는 버그 (실제 수집에서 품질 검사가 잡음).
 */
public final class FiscalYearLabels {

    static final FiscalYearLabels EMPTY = new FiscalYearLabels(new TreeMap<>());

    private final TreeMap<LocalDate, Integer> byAnnualEnd;

    private FiscalYearLabels(TreeMap<LocalDate, Integer> byAnnualEnd) {
        this.byAnnualEnd = byAnnualEnd;
    }

    public static FiscalYearLabels from(List<SecFact> facts) {
        record Filing(LocalDate filed, Integer fy, LocalDate latestAnnualEnd) {
        }
        Map<String, Filing> byAccession = new HashMap<>();
        for (SecFact f : facts) {
            if (!Metric.TAXONOMY.equals(f.taxonomy()) || !f.isDuration() || f.fy() == null
                    || !f.form().startsWith("10-K") || !PeriodNormalizer.isAnnual(f.days())) {
                continue;
            }
            byAccession.merge(f.accession(), new Filing(f.filed(), f.fy(), f.end()),
                    (a, b) -> a.latestAnnualEnd().isAfter(b.latestAnnualEnd()) ? a : b);
        }
        // 같은 기간을 다룬 10-K 가 여러 건(정정본)이면 원래 공시(가장 먼저 제출)의 이름
        TreeMap<LocalDate, Integer> out = new TreeMap<>();
        byAccession.values().stream()
                .sorted(Comparator.comparing(Filing::filed).reversed())
                .forEach(f -> out.put(f.latestAnnualEnd(), f.fy()));
        return new FiscalYearLabels(out);
    }

    /** 연간 기간 끝 날짜(±3일)의 회계연도 이름 */
    public Optional<Integer> forAnnualEnd(LocalDate end) {
        LocalDate from = end.minusDays(PeriodNormalizer.TOLERANCE_DAYS);
        LocalDate to = end.plusDays(PeriodNormalizer.TOLERANCE_DAYS);
        return byAnnualEnd.subMap(from, true, to, true).entrySet().stream()
                .min(Comparator.comparingLong(e -> Math.abs(ChronoUnit.DAYS.between(e.getKey(), end))))
                .map(Map.Entry::getValue);
    }
}
