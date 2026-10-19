package com.usstockmap.server.financial;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

/**
 * 정리된 분기 재무제표 → 지도용 지표 (docs/api.md GET /companies 필드 설명).
 * <ul>
 *   <li>TTM = 가장 최근 <b>연속</b> 4개 분기 합. 빈 분기가 있으면 null</li>
 *   <li>영업이익률 = 4분기 영업이익 합 ÷ 4분기 매출 합 (영업이익이 하나라도 없으면 null — 은행)</li>
 *   <li>매출 성장률 = 최근 4분기 매출 ÷ 그 직전 연속 4분기 매출 − 1</li>
 *   <li>총자산 = 가장 최근 분기말 값 (시점 값이라 합산하지 않음)</li>
 *   <li>공시상 시총 = dei:EntityPublicFloat 중 기준일이 가장 최근인 값</li>
 * </ul>
 */
public final class MapMetricsCalculator {

    public static final String DEI = "dei";
    public static final String PUBLIC_FLOAT = "EntityPublicFloat";
    /** 분기 사이 허용 간격 (앞 분기 끝 다음 날 ±3일) */
    private static final int MAX_GAP_DAYS = 4;

    private MapMetricsCalculator() {
    }

    public static MapMetrics calculate(List<FinancialRow> rows, List<SecFact> facts) {
        List<FinancialRow> q = rows.stream()
                .filter(r -> r.type() == PeriodType.Q)
                .sorted(Comparator.comparing(FinancialRow::end).reversed())
                .toList();

        List<FinancialRow> last4 = contiguous(q, 0);
        List<FinancialRow> prev4 = last4 == null ? null : contiguousAfter(q, last4.getLast());

        Long revenueTtm = sum(last4, FinancialRow::revenue);
        Long netIncomeTtm = sum(last4, FinancialRow::netIncome);
        Long operatingTtm = sum(last4, FinancialRow::operatingIncome);
        Long prevRevenueTtm = sum(prev4, FinancialRow::revenue);

        Double margin = operatingTtm != null && revenueTtm != null && revenueTtm > 0
                ? ratio(operatingTtm, revenueTtm) : null;
        Double growth = revenueTtm != null && prevRevenueTtm != null && prevRevenueTtm > 0
                ? ratio(revenueTtm - prevRevenueTtm, prevRevenueTtm) : null;

        FinancialRow latest = q.isEmpty() ? null : q.getFirst();
        Long assets = latest == null ? null : latest.totalAssets();
        LocalDate dataAsOf = latest == null ? null : latest.end();

        Optional<SecFact> pf = latestPublicFloat(facts);
        return new MapMetrics(revenueTtm, netIncomeTtm, assets, margin, growth,
                pf.map(f -> FinancialStatementBuilder.toUsd(f.value())).orElse(null),
                pf.map(SecFact::end).orElse(null),
                dataAsOf);
    }

    /** 공시상 시총: 기준일 최신, 같으면 늦게 공시된 값 */
    static Optional<SecFact> latestPublicFloat(List<SecFact> facts) {
        return facts.stream()
                .filter(f -> DEI.equals(f.taxonomy()) && PUBLIC_FLOAT.equals(f.concept()) && "USD".equals(f.unit()))
                .max(Comparator.comparing(SecFact::end).thenComparing(SecFact::filed));
    }

    /** q[from] 부터 연속 4분기. 끊기면 null */
    private static List<FinancialRow> contiguous(List<FinancialRow> q, int from) {
        if (q.size() < from + 4) {
            return null;
        }
        List<FinancialRow> four = q.subList(from, from + 4);
        for (int i = 0; i < 3; i++) {
            if (!adjacent(four.get(i + 1), four.get(i))) {
                return null;
            }
        }
        return four;
    }

    /** 이 분기 바로 앞에서 시작하는 연속 4분기 */
    private static List<FinancialRow> contiguousAfter(List<FinancialRow> q, FinancialRow oldestOfLast4) {
        int idx = q.indexOf(oldestOfLast4);
        if (idx < 0 || idx + 1 >= q.size() || !adjacent(q.get(idx + 1), oldestOfLast4)) {
            return null;
        }
        return contiguous(q, idx + 1);
    }

    private static boolean adjacent(FinancialRow older, FinancialRow newer) {
        long gap = ChronoUnit.DAYS.between(older.end(), newer.start());
        return gap >= 1 && gap <= MAX_GAP_DAYS;
    }

    private static Long sum(List<FinancialRow> rows, Function<FinancialRow, Long> field) {
        if (rows == null) {
            return null;
        }
        long total = 0;
        for (FinancialRow r : rows) {
            Long v = field.apply(r);
            if (v == null) {
                return null;
            }
            total += v;
        }
        return total;
    }

    /** 소수 4자리 (0.3123 = 31.23%) */
    private static double ratio(long numerator, long denominator) {
        return BigDecimal.valueOf(numerator)
                .divide(BigDecimal.valueOf(denominator), 4, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
