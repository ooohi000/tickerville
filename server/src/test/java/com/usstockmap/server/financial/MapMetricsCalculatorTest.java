package com.usstockmap.server.financial;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.support.SecFixtures;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MapMetricsCalculatorTest {

    static MapMetrics metrics(String ticker) {
        var facts = SecFixtures.companyFacts(ticker);
        IndustryProfile profile = ticker.equals("JPM") ? IndustryProfile.BANK : IndustryProfile.STANDARD;
        return MapMetricsCalculator.calculate(FinancialStatementBuilder.build(facts, profile), facts);
    }

    @Test
    @DisplayName("애플: 최근 4분기 매출 합, 직전 4분기 대비 성장률, 영업이익률, 기준일")
    void apple() {
        MapMetrics m = metrics("AAPL");

        // 1,094.17 + 1,111.84 + 1,437.56 + 1,024.66 (억 달러)
        assertThat(m.revenueTtmUsd()).isEqualTo(466_823_000_000L);
        // 직전 4분기 940.36 + 953.59 + 1,243.00 + 949.30 = 4,086.25 → +14.24%
        assertThat(m.revenueGrowthYoy()).isEqualTo(0.1424);
        assertThat(m.operatingMarginTtm()).isBetween(0.30, 0.35);
        assertThat(m.totalAssetsUsd()).isEqualTo(383_266_000_000L);
        assertThat(m.dataAsOf()).isEqualTo(LocalDate.parse("2026-06-27"));
        assertThat(m.publicFloatUsd()).isEqualTo(3_253_431_000_000L);
        assertThat(m.publicFloatAsOf()).isEqualTo(LocalDate.parse("2025-03-28"));
    }

    @Test
    @DisplayName("JP모건(은행): 영업이익률은 null, 나머지는 계산")
    void bank() {
        MapMetrics m = metrics("JPM");

        assertThat(m.operatingMarginTtm()).isNull();
        assertThat(m.revenueTtmUsd()).isPositive();
        assertThat(m.netIncomeTtmUsd()).isPositive();
    }

    @Test
    @DisplayName("코카콜라: 최신 분기가 아직 SEC 에 없으면 기준일이 이전 분기 (2026-04-03)")
    void cocaColaDataAsOf() {
        assertThat(metrics("KO").dataAsOf()).isEqualTo(LocalDate.parse("2026-04-03"));
    }

    @Test
    @DisplayName("7개 기업 모두 TTM 매출·순이익·총자산·성장률·공시상 시총이 나온다")
    void allCompaniesHaveCoreMetrics() {
        for (String t : List.of("AAPL", "AMZN", "JPM", "KO", "NVDA", "PLTR", "TSLA")) {
            MapMetrics m = metrics(t);
            assertThat(m.revenueTtmUsd()).as(t).isNotNull();
            assertThat(m.netIncomeTtmUsd()).as(t).isNotNull();
            assertThat(m.totalAssetsUsd()).as(t).isNotNull();
            assertThat(m.revenueGrowthYoy()).as(t).isNotNull();
            assertThat(m.publicFloatUsd()).as(t).isNotNull();
        }
    }

    @Test
    @DisplayName("분기가 하나 비면 TTM 은 null (연속 4분기만 더한다)")
    void gapMeansNoTtm() {
        List<FinancialRow> q = new ArrayList<>(List.of(
                quarter("2026-04-01", "2026-06-30", 10),
                quarter("2025-10-01", "2025-12-31", 10), // 2026 1분기 없음
                quarter("2025-07-01", "2025-09-30", 10),
                quarter("2025-04-01", "2025-06-30", 10)));

        MapMetrics m = MapMetricsCalculator.calculate(q, List.of());
        assertThat(m.revenueTtmUsd()).isNull();
        assertThat(m.revenueGrowthYoy()).isNull();
        assertThat(m.dataAsOf()).isEqualTo(LocalDate.parse("2026-06-30"));
    }

    @Test
    @DisplayName("연속 4분기는 있지만 직전 4분기가 없으면 성장률만 null")
    void growthNeedsEightQuarters() {
        List<FinancialRow> q = List.of(
                quarter("2026-04-01", "2026-06-30", 40),
                quarter("2026-01-01", "2026-03-31", 30),
                quarter("2025-10-01", "2025-12-31", 20),
                quarter("2025-07-01", "2025-09-30", 10));

        MapMetrics m = MapMetricsCalculator.calculate(q, List.of());
        assertThat(m.revenueTtmUsd()).isEqualTo(100L);
        assertThat(m.revenueGrowthYoy()).isNull();
        assertThat(m.publicFloatUsd()).isNull();
    }

    @Test
    @DisplayName("데이터가 없으면 전부 null")
    void empty() {
        assertThat(MapMetricsCalculator.calculate(List.of(), List.of()))
                .isEqualTo(new MapMetrics(null, null, null, null, null, null, null, null));
    }

    private static FinancialRow quarter(String start, String end, long revenue) {
        return new FinancialRow(PeriodType.Q, 2026, "Q1", LocalDate.parse(start), LocalDate.parse(end), null,
                revenue, null, null, revenue / 10, null, null, null, null, null, null, null);
    }
}
