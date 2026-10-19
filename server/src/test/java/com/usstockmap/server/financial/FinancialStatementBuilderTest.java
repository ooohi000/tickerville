package com.usstockmap.server.financial;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.support.SecFixtures;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** 실제 SEC 데이터 (2026-10-19 수집). 기대값은 각 회사가 실제로 발표한 숫자 */
class FinancialStatementBuilderTest {

    static List<FinancialRow> rows(String ticker) {
        IndustryProfile profile = ticker.equals("JPM") ? IndustryProfile.BANK : IndustryProfile.STANDARD;
        return FinancialStatementBuilder.build(SecFixtures.companyFacts(ticker), profile);
    }

    static FinancialRow find(List<FinancialRow> rows, PeriodType type, String end) {
        return rows.stream()
                .filter(r -> r.type() == type && r.end().equals(LocalDate.parse(end)))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no " + type + " ending " + end));
    }

    @Test
    @DisplayName("애플 FY2025 4분기 매출 = 연간 4,161.61억 − 9개월 = 1,024.66억 달러")
    void appleFourthQuarterRevenue() {
        List<FinancialRow> aapl = rows("AAPL");
        FinancialRow q4 = find(aapl, PeriodType.Q, "2025-09-27");
        FinancialRow fy = find(aapl, PeriodType.FY, "2025-09-27");

        assertThat(q4.fiscalYear()).isEqualTo(2025);
        assertThat(q4.fiscalPeriod()).isEqualTo("Q4");
        assertThat(q4.start()).isEqualTo(LocalDate.parse("2025-06-29"));
        assertThat(q4.revenue()).isEqualTo(102_466_000_000L);
        assertThat(q4.epsDiluted()).isNull();            // 주당순이익은 빼서 만들지 않는다
        assertThat(fy.revenue()).isEqualTo(416_161_000_000L);
        assertThat(fy.epsDiluted()).isEqualByComparingTo("7.46");
    }

    @Test
    @DisplayName("애플: 잉여현금흐름 = 영업현금흐름 − 설비투자, 시점 값은 분기말 기준")
    void appleCashFlowAndBalanceSheet() {
        FinancialRow q3 = find(rows("AAPL"), PeriodType.Q, "2026-06-27");

        assertThat(q3.freeCashFlow()).isEqualTo(q3.operatingCashFlow() - q3.capitalExpenditure());
        assertThat(q3.totalAssets()).isEqualTo(383_266_000_000L);
        assertThat(q3.totalLiabilities() + q3.totalEquity()).isEqualTo(q3.totalAssets());
    }

    @Test
    @DisplayName("엔비디아: 회계연도는 1월 말 마감, 라벨은 회사 표기대로 (2025-01 마감 = FY2025)")
    void nvidiaFiscalYearLabels() {
        List<FinancialRow> nvda = rows("NVDA");

        FinancialRow fy2025 = find(nvda, PeriodType.FY, "2025-01-26");
        assertThat(fy2025.fiscalYear()).isEqualTo(2025);
        assertThat(fy2025.revenue()).isEqualTo(130_497_000_000L);
        assertThat(find(nvda, PeriodType.Q, "2025-01-26").revenue()).isEqualTo(39_331_000_000L);
        assertThat(find(nvda, PeriodType.Q, "2026-07-26").fiscalYear()).isEqualTo(2027);
    }

    @Test
    @DisplayName("엔비디아: 2022년에 매출 개념 이름이 바뀌어도 이전 해 매출이 이어진다 (FY2021 166.75억)")
    void nvidiaConceptRename() {
        assertThat(find(rows("NVDA"), PeriodType.FY, "2021-01-31").revenue()).isEqualTo(16_675_000_000L);
    }

    @Test
    @DisplayName("JP모건(은행): 매출 = 이자비용 차감 순수익, 영업이익·설비투자 없음, 위임장 반올림 값 무시")
    void bankRules() {
        FinancialRow fy2024 = find(rows("JPM"), PeriodType.FY, "2024-12-31");

        assertThat(fy2024.revenue()).isEqualTo(177_556_000_000L);
        assertThat(fy2024.netIncome()).isEqualTo(58_471_000_000L); // 위임장의 58,500 이 아니라 10-K 값
        assertThat(fy2024.operatingIncome()).isNull();
        assertThat(fy2024.capitalExpenditure()).isNull();
        assertThat(fy2024.freeCashFlow()).isNull();
    }

    @Test
    @DisplayName("아마존·코카콜라: 부채 합계를 공시하지 않으면 총자산 − 자본으로 채운다")
    void derivedLiabilities() {
        for (String t : List.of("AMZN", "KO")) {
            FinancialRow latest = FinancialStatementBuilder.quarters(rows(t)).getFirst();
            assertThat(latest.totalLiabilities()).as(t).isNotNull().isPositive();
            assertThat(latest.totalLiabilities()).as(t).isLessThan(latest.totalAssets());
        }
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"AAPL", "AMZN", "GOOGL", "JPM", "KO", "NVDA", "PLTR", "TSLA"})
    @DisplayName("모든 기업: 마감된 회계연도의 네 분기 합 = 연간 (매출·순이익·영업현금흐름)")
    void quartersSumToAnnual(String ticker) {
        List<FinancialRow> all = rows(ticker);
        Map<Integer, List<FinancialRow>> quartersByYear = all.stream()
                .filter(r -> r.type() == PeriodType.Q)
                .collect(Collectors.groupingBy(FinancialRow::fiscalYear));

        List<FinancialRow> annuals = all.stream().filter(r -> r.type() == PeriodType.FY).toList();
        assertThat(annuals).as("연간 기간이 있어야 함").hasSizeGreaterThanOrEqualTo(5);
        int checked = 0;
        for (FinancialRow fy : annuals) {
            List<FinancialRow> qs = quartersByYear.getOrDefault(fy.fiscalYear(), List.of());
            if (qs.size() != 4) {
                continue; // 2019년 이전 자료를 잘라내서 첫해는 분기가 모자랄 수 있다
            }
            checked++;
            assertThat(qs).extracting(FinancialRow::fiscalPeriod).containsExactlyInAnyOrder("Q1", "Q2", "Q3", "Q4");
            assertSum(ticker, fy, qs, FinancialRow::revenue);
            assertSum(ticker, fy, qs, FinancialRow::netIncome);
            assertSum(ticker, fy, qs, FinancialRow::operatingCashFlow);
        }
        assertThat(checked).as("검증한 연도 수").isGreaterThanOrEqualTo(4);
    }

    @Test
    @DisplayName("알파벳: 2025년에 매출 태그를 바꿔도 회계연도 이름이 섞이지 않는다 (2024-12 마감 = FY2024)")
    void alphabetConceptSwitchKeepsFiscalYears() {
        List<FinancialRow> googl = rows("GOOGL");

        assertThat(find(googl, PeriodType.FY, "2024-12-31").fiscalYear()).isEqualTo(2024);
        assertThat(find(googl, PeriodType.FY, "2025-12-31").fiscalYear()).isEqualTo(2025);
        assertThat(find(googl, PeriodType.Q, "2024-12-31").fiscalYear()).isEqualTo(2024);
        assertThat(googl).filteredOn(r -> r.type() == PeriodType.FY)
                .extracting(FinancialRow::fiscalYear).doesNotHaveDuplicates();
        assertThat(find(googl, PeriodType.FY, "2024-12-31").revenue()).isEqualTo(350_018_000_000L);
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"AAPL", "AMZN", "GOOGL", "JPM", "KO", "NVDA", "PLTR", "TSLA"})
    @DisplayName("모든 기업: 연간 기간의 회계연도 이름이 겹치지 않는다")
    void fiscalYearLabelsUnique(String ticker) {
        assertThat(rows(ticker)).filteredOn(r -> r.type() == PeriodType.FY)
                .extracting(FinancialRow::fiscalYear).as(ticker).doesNotHaveDuplicates();
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"AAPL", "AMZN", "GOOGL", "JPM", "KO", "NVDA", "PLTR", "TSLA"})
    @DisplayName("모든 기업: 같은 기간이 두 번 나오지 않고, 최신순 정렬")
    void uniqueAndSorted(String ticker) {
        List<FinancialRow> all = rows(ticker);

        assertThat(all).extracting(r -> r.type() + "|" + r.end()).doesNotHaveDuplicates();
        for (int i = 1; i < all.size(); i++) {
            assertThat(all.get(i).end()).isBeforeOrEqualTo(all.get(i - 1).end());
        }
    }

    private static void assertSum(String ticker, FinancialRow fy, List<FinancialRow> qs,
                                  java.util.function.Function<FinancialRow, Long> field) {
        if (field.apply(fy) == null || qs.stream().anyMatch(q -> field.apply(q) == null)) {
            return;
        }
        long sum = qs.stream().mapToLong(field::apply).sum();
        assertThat(sum).as(ticker + " FY" + fy.fiscalYear()).isEqualTo(field.apply(fy));
    }
}
