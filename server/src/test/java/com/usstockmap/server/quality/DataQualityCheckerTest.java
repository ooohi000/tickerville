package com.usstockmap.server.quality;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.financial.FinancialRow;
import com.usstockmap.server.financial.MapMetrics;
import com.usstockmap.server.financial.PeriodType;
import com.usstockmap.server.support.SecFixtures;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DataQualityCheckerTest {

    static final LocalDate TODAY = LocalDate.parse("2026-10-19");

    static List<QualityIssue> checkReal(String ticker) {
        var update = com.usstockmap.server.collector.sec.SecCompanyUpdate.compute(ticker,
                SecFixtures.submissionsJson(ticker), SecFixtures.companyFactsJson(ticker), TODAY);
        return update.issues();
    }

    @Test
    @DisplayName("실제 7개 기업은 이상 신호 없음 (알파벳 포함 — 태그 변경 버그가 다시 생기면 MISSING_QUARTERS 로 잡힌다)")
    void realCompaniesAreClean() {
        for (String t : List.of("AAPL", "AMZN", "GOOGL", "JPM", "NVDA", "PLTR", "TSLA")) {
            assertThat(checkReal(t)).as(t).isEmpty();
        }
    }

    @Test
    @DisplayName("코카콜라: 2026-07-03 분기 10-Q 는 냈는데 companyfacts 에 숫자가 없음 → 이유까지 잡아낸다")
    void cocaColaFactsBehindFilings() {
        assertThat(checkReal("KO")).extracting(QualityIssue::code)
                .containsExactlyInAnyOrder("STALE", "FACTS_BEHIND_FILINGS");
    }

    @Test
    @DisplayName("매출을 못 찾음 / 데이터 없음")
    void noRevenueNoData() {
        MapMetrics none = new MapMetrics(null, null, null, null, null, null, null, null);
        assertThat(DataQualityChecker.check(List.of(), none, TODAY)).extracting(QualityIssue::code)
                .containsExactly("NO_REVENUE", "NO_QUARTERS");
    }

    @Test
    @DisplayName("마지막 분기가 135일 넘게 지났으면 STALE")
    void stale() {
        List<FinancialRow> rows = List.of(q("2026-01-01", "2026-03-31", 100L));
        MapMetrics m = new MapMetrics(400L, null, null, null, null, null, null, LocalDate.parse("2026-03-31"));
        assertThat(DataQualityChecker.check(rows, m, TODAY)).extracting(QualityIssue::code).contains("STALE");
    }

    @Test
    @DisplayName("분기 매출이 3배 넘게 뛰면 REVENUE_JUMP")
    void revenueJump() {
        List<FinancialRow> rows = List.of(q("2026-04-01", "2026-06-30", 400L), q("2026-01-01", "2026-03-31", 100L));
        MapMetrics m = new MapMetrics(500L, null, null, null, null, null, null, LocalDate.parse("2026-06-30"));
        assertThat(DataQualityChecker.check(rows, m, TODAY)).extracting(QualityIssue::code).contains("REVENUE_JUMP");
    }

    @Test
    @DisplayName("같은 코드는 하나로 합친다 (두 해 연속 분기 부족)")
    void mergesSameCode() {
        List<FinancialRow> rows = List.of(
                fy(2025, "2025-01-01", "2025-12-31"), fy(2024, "2024-01-01", "2024-12-31"));
        MapMetrics m = new MapMetrics(null, null, null, null, null, null, null, null);
        assertThat(DataQualityChecker.check(rows, m, TODAY))
                .filteredOn(i -> i.code().equals("MISSING_QUARTERS"))
                .singleElement()
                .satisfies(i -> assertThat(i.detail()).contains("FY2025").contains("FY2024"));
    }

    private static FinancialRow q(String start, String end, Long revenue) {
        return new FinancialRow(PeriodType.Q, 2026, "Q1", LocalDate.parse(start), LocalDate.parse(end), null,
                revenue, null, null, null, null, null, null, null, null, null, null);
    }

    private static FinancialRow fy(int year, String start, String end) {
        return new FinancialRow(PeriodType.FY, year, "FY", LocalDate.parse(start), LocalDate.parse(end), null,
                100L, null, null, null, null, null, null, null, null, null, null);
    }
}
