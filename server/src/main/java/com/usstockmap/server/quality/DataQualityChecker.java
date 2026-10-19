package com.usstockmap.server.quality;

import com.usstockmap.server.financial.FinancialRow;
import com.usstockmap.server.financial.MapMetrics;
import com.usstockmap.server.financial.PeriodType;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 수집 결과 자동 점검. 기업이 늘면 생기는 예외(보험사·리츠·외국 기업·회계연도 변경)를 사람이 찾지 않아도 되게.
 * 이상 신호가 있어도 저장은 한다 — 관리자 확인 목록에 올리는 용도.
 */
public final class DataQualityChecker {

    /** 분기 마감 + 10-Q 마감 기한(최대 45일) + 여유 → 이보다 오래되면 "최근 분기 없음" */
    static final int STALE_DAYS = 135;
    /** 분기 매출이 직전 분기의 3배 넘게 뛰거나 1/3 아래로 떨어지면 */
    static final double JUMP_RATIO = 3.0;

    private DataQualityChecker() {
    }

    public static List<QualityIssue> check(List<FinancialRow> rows, MapMetrics metrics, LocalDate today) {
        return check(rows, metrics, today, null);
    }

    /**
     * @param latestReportPeriod 공시 목록상 가장 최근 10-Q·10-K 의 보고 기준일. 재무 데이터 기준일보다 늦으면
     *                           "공시는 냈는데 companyfacts 에 숫자가 아직 없음" (KO 2026-07-03 분기)
     */
    public static List<QualityIssue> check(List<FinancialRow> rows, MapMetrics metrics, LocalDate today,
                                           LocalDate latestReportPeriod) {
        List<QualityIssue> out = new ArrayList<>();
        List<FinancialRow> quarters = rows.stream().filter(r -> r.type() == PeriodType.Q).toList(); // 최신순

        if (quarters.stream().limit(4).allMatch(r -> r.revenue() == null)) {
            out.add(new QualityIssue("NO_REVENUE", "최근 4분기 매출 항목을 찾지 못함 (개념 후보에 없는 업종일 수 있음)"));
        } else if (metrics.revenueTtmUsd() == null) {
            out.add(new QualityIssue("NO_TTM", "연속 4분기 매출이 없어 TTM 계산 불가"));
        }

        if (metrics.dataAsOf() == null) {
            out.add(new QualityIssue("NO_QUARTERS", "분기 재무 데이터 없음"));
        } else if (metrics.dataAsOf().isBefore(today.minusDays(STALE_DAYS))) {
            out.add(new QualityIssue("STALE", "마지막 분기 " + metrics.dataAsOf() + " — " + STALE_DAYS + "일 넘게 새 분기 없음"));
        }

        if (latestReportPeriod != null && metrics.dataAsOf() != null
                && latestReportPeriod.isAfter(metrics.dataAsOf().plusDays(7))) {
            out.add(new QualityIssue("FACTS_BEHIND_FILINGS", "공시상 최신 보고 기준일 " + latestReportPeriod
                    + " 인데 SEC companyfacts 숫자는 " + metrics.dataAsOf() + " 까지 (SEC 쪽 반영 지연)"));
        }

        for (int i = 0; i + 1 < quarters.size() && i < 8; i++) {
            Long newer = quarters.get(i).revenue();
            Long older = quarters.get(i + 1).revenue();
            if (newer == null || older == null) {
                continue;
            }
            if (newer < 0) {
                out.add(new QualityIssue("NEGATIVE_REVENUE", quarters.get(i).end() + " 분기 매출이 음수: " + newer));
                break;
            }
            if (older > 0 && (newer > older * JUMP_RATIO || newer * JUMP_RATIO < older)) {
                out.add(new QualityIssue("REVENUE_JUMP",
                        quarters.get(i).end() + " 분기 매출 " + newer + " (직전 " + older + ") — 3배 이상 변화"));
                break;
            }
        }

        Map<Integer, List<FinancialRow>> byYear = quarters.stream().collect(Collectors.groupingBy(FinancialRow::fiscalYear));
        rows.stream().filter(r -> r.type() == PeriodType.FY).limit(2).forEach(fy -> {
            List<FinancialRow> qs = byYear.getOrDefault(fy.fiscalYear(), List.of());
            if (qs.size() != 4) {
                out.add(new QualityIssue("MISSING_QUARTERS",
                        "FY" + fy.fiscalYear() + " 분기가 " + qs.size() + "개 (4개여야 함)"));
            } else if (fy.revenue() != null && qs.stream().allMatch(q -> q.revenue() != null)
                    && qs.stream().mapToLong(FinancialRow::revenue).sum() != fy.revenue()) {
                out.add(new QualityIssue("QUARTER_SUM_MISMATCH", "FY" + fy.fiscalYear() + " 분기 매출 합 ≠ 연간"));
            }
        });
        return mergeSameCode(out);
    }

    /** 같은 코드는 하나로 (기업·코드당 한 줄로 저장) */
    private static List<QualityIssue> mergeSameCode(List<QualityIssue> issues) {
        Map<String, String> merged = new java.util.LinkedHashMap<>();
        issues.forEach(i -> merged.merge(i.code(), i.detail(), (a, b) -> a + "; " + b));
        return merged.entrySet().stream().map(e -> new QualityIssue(e.getKey(), e.getValue())).toList();
    }
}
