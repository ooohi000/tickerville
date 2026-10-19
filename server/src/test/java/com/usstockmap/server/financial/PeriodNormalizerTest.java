package com.usstockmap.server.financial;

import static com.usstockmap.server.financial.FactBuilder.flow;
import static com.usstockmap.server.financial.FactBuilder.stock;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 기간 판정 규칙 하나씩 (가짜 숫자, 달력 회계연도 2025 + 진행 중인 2026) */
class PeriodNormalizerTest {

    // 2025 회계연도: 3개월 값 3개 + 연간 (10-K 는 2026-02 제출)
    static final List<SecFact> CALENDAR_YEAR = List.of(
            flow("2025-01-01", "2025-03-31", 100, "10-Q", "2025-05-01"),
            flow("2025-04-01", "2025-06-30", 110, "10-Q", "2025-08-01"),
            flow("2025-01-01", "2025-06-30", 210, "10-Q", "2025-08-01"),
            flow("2025-07-01", "2025-09-30", 120, "10-Q", "2025-11-01"),
            flow("2025-01-01", "2025-09-30", 330, "10-Q", "2025-11-01"),
            flow("2025-01-01", "2025-12-31", 460, "10-K", "2026-02-15", 2025));

    @Test
    @DisplayName("3개월 값은 그대로, 4분기 = 연간 − 9개월 누적")
    void quartersAndDerivedFourthQuarter() {
        List<PeriodValue> out = PeriodNormalizer.flows(CALENDAR_YEAR, true);

        assertThat(out).extracting(PeriodValue::type, PeriodValue::fiscalPeriod, PeriodValue::end, v -> v.value().longValue())
                .containsExactly(
                        tuple(PeriodType.Q, "Q1", LocalDate.parse("2025-03-31"), 100L),
                        tuple(PeriodType.Q, "Q2", LocalDate.parse("2025-06-30"), 110L),
                        tuple(PeriodType.Q, "Q3", LocalDate.parse("2025-09-30"), 120L),
                        tuple(PeriodType.Q, "Q4", LocalDate.parse("2025-12-31"), 130L),
                        tuple(PeriodType.FY, "FY", LocalDate.parse("2025-12-31"), 460L));
        PeriodValue q4 = out.get(3);
        assertThat(q4.start()).isEqualTo(LocalDate.parse("2025-10-01"));
        assertThat(q4.filed()).isEqualTo(LocalDate.parse("2026-02-15")); // 재료 중 늦은 공시일
        assertThat(out).allSatisfy(v -> assertThat(v.fiscalYear()).isEqualTo(2025));
    }

    @Test
    @DisplayName("현금흐름처럼 누적 값만 있으면 2·3·4분기를 누적끼리 빼서 만든다")
    void cumulativeOnlyIsDifferenced() {
        List<SecFact> cashFlow = List.of(
                flow("2025-01-01", "2025-03-31", 50, "10-Q", "2025-05-01"),
                flow("2025-01-01", "2025-06-30", 80, "10-Q", "2025-08-01"),
                flow("2025-01-01", "2025-09-30", 150, "10-Q", "2025-11-01"),
                flow("2025-01-01", "2025-12-31", 140, "10-K", "2026-02-15", 2025));

        assertThat(PeriodNormalizer.flows(cashFlow, true))
                .extracting(PeriodValue::fiscalPeriod, v -> v.value().longValue())
                .containsExactly(tuple("Q1", 50L), tuple("Q2", 30L), tuple("Q3", 70L), tuple("Q4", -10L), tuple("FY", 140L));
    }

    @Test
    @DisplayName("1~3분기 값과 누적이 정정·반올림으로 어긋나도 4분기 = 연간 − (1~3분기 합) → 네 분기 합 = 연간")
    void fourthQuarterKeepsSumConsistent() {
        List<SecFact> restated = List.of(
                flow("2019-01-01", "2019-03-31", 29123, "10-Q", "2019-05-02"),
                flow("2019-04-01", "2019-06-30", 28747, "10-Q", "2020-08-03"),
                flow("2019-01-01", "2019-06-30", 57823, "10-Q", "2020-08-03"), // 1분기가 몰래 정정됨
                flow("2019-07-01", "2019-09-30", 29291, "10-Q", "2020-11-02"),
                flow("2019-01-01", "2019-09-30", 87114, "10-Q", "2020-11-02"),
                flow("2019-01-01", "2019-12-31", 115720, "10-K", "2022-02-22", 2019));

        List<PeriodValue> out = PeriodNormalizer.flows(restated, true);
        long quarters = out.stream().filter(v -> v.type() == PeriodType.Q).mapToLong(v -> v.value().longValue()).sum();
        assertThat(quarters).isEqualTo(115720);
        assertThat(out.get(3).value()).isEqualByComparingTo("28559"); // 115720 − (29123 + 28747 + 29291)
    }

    @Test
    @DisplayName("주당순이익처럼 뺄 수 없는 값은 직접 공시된 기간만 (4분기 없음)")
    void nonSubtractableSkipsDerived() {
        assertThat(PeriodNormalizer.flows(CALENDAR_YEAR, false))
                .extracting(PeriodValue::fiscalPeriod)
                .containsExactly("Q1", "Q2", "Q3", "FY");
    }

    @Test
    @DisplayName("같은 기간이 여러 공시에 나오면 늦게 공시된 값 (정정 반영)")
    void latestFiledWins() {
        List<SecFact> facts = new java.util.ArrayList<>(CALENDAR_YEAR);
        facts.add(flow("2025-01-01", "2025-03-31", 105, "10-Q/A", "2025-06-15")); // 1분기 정정

        assertThat(PeriodNormalizer.flows(facts, true).getFirst().value()).isEqualByComparingTo("105");
    }

    @Test
    @DisplayName("정기 보고서가 아닌 공시(위임장 DEF 14A)의 반올림 값은 무시한다")
    void ignoresNonReportForms() {
        List<SecFact> facts = new java.util.ArrayList<>(CALENDAR_YEAR);
        facts.add(flow("2025-01-01", "2025-12-31", 500, "DEF 14A", "2026-04-06"));

        List<PeriodValue> out = PeriodNormalizer.flows(facts, true);
        assertThat(out.getLast().value()).isEqualByComparingTo("460");
    }

    @Test
    @DisplayName("마지막 10-K 이후 분기는 다음 회계연도(진행 중)로 붙는다")
    void openYearAfterLastAnnual() {
        List<SecFact> facts = new java.util.ArrayList<>(CALENDAR_YEAR);
        facts.add(flow("2026-01-01", "2026-03-31", 140, "10-Q", "2026-05-01"));
        facts.add(flow("2026-04-01", "2026-06-30", 150, "10-Q", "2026-08-01"));
        facts.add(flow("2026-01-01", "2026-06-30", 290, "10-Q", "2026-08-01"));

        List<PeriodValue> out = PeriodNormalizer.flows(facts, true);
        assertThat(out.subList(out.size() - 2, out.size()))
                .extracting(PeriodValue::fiscalYear, PeriodValue::fiscalPeriod, v -> v.value().longValue())
                .containsExactly(tuple(2026, "Q1", 140L), tuple(2026, "Q2", 150L));
    }

    @Test
    @DisplayName("회계연도 라벨은 원래 10-K 가 붙인 값 (엔비디아: 2026-01 마감 = 2026)")
    void fiscalYearLabelFromOriginal10K() {
        List<SecFact> nvdaLike = List.of(
                flow("2025-01-27", "2025-04-27", 44, "10-Q", "2025-05-28", 2026),
                flow("2025-01-27", "2026-01-25", 216, "10-K", "2026-02-25", 2026),
                // 다음 해 10-K 에 비교 값으로 다시 실림 (fy=2027 로 태그됨) → 라벨은 원래 것 유지
                flow("2025-01-27", "2026-01-25", 216, "10-K", "2027-02-24", 2027));

        assertThat(PeriodNormalizer.flows(nvdaLike, true))
                .filteredOn(v -> v.type() == PeriodType.FY)
                .extracting(PeriodValue::fiscalYear)
                .containsExactly(2026);
    }

    @Test
    @DisplayName("1분기 보고서가 빠져도 3분기는 누적끼리 빼서 만든다 (2분기는 못 만듦)")
    void missingFirstQuarter() {
        List<SecFact> facts = List.of(
                flow("2025-01-01", "2025-06-30", 210, "10-Q", "2025-08-01"),
                flow("2025-01-01", "2025-09-30", 330, "10-Q", "2025-11-01"),
                flow("2025-01-01", "2025-12-31", 460, "10-K", "2026-02-15", 2025));

        assertThat(PeriodNormalizer.flows(facts, true))
                .extracting(PeriodValue::fiscalPeriod, v -> v.value().longValue())
                .containsExactly(tuple("Q3", 120L), tuple("Q4", 130L), tuple("FY", 460L));
    }

    @Test
    @DisplayName("52·53주 회계연도: 시작일이 하루 어긋나도 같은 해로 본다")
    void toleratesOneDayShift() {
        List<SecFact> facts = List.of(
                flow("2024-09-29", "2024-12-28", 124, "10-Q", "2025-01-31"),
                flow("2024-09-30", "2025-03-29", 219, "10-Q", "2025-05-02"), // 누적 시작이 하루 늦게 태그됨
                flow("2024-09-29", "2025-09-27", 416, "10-K", "2025-10-31", 2025));

        assertThat(PeriodNormalizer.flows(facts, true))
                .extracting(PeriodValue::fiscalPeriod, v -> v.value().longValue())
                .startsWith(tuple("Q1", 124L), tuple("Q2", 95L));
    }

    @Test
    @DisplayName("시점 값: 날짜별로 늦게 공시된 값")
    void stocksByEndDate() {
        var out = PeriodNormalizer.stocks(List.of(
                stock("2025-03-31", 1000, "2025-05-01"),
                stock("2025-03-31", 1010, "2026-05-01"),
                stock("2025-06-30", 1100, "2025-08-01")));

        assertThat(out).hasSize(2);
        assertThat(out.get(LocalDate.parse("2025-03-31")).value()).isEqualByComparingTo(BigDecimal.valueOf(1010));
    }
}
