package com.usstockmap.server.earnings;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.collector.sec.SecFiling;
import com.usstockmap.server.collector.sec.SubmissionsParser;
import com.usstockmap.server.support.SecFixtures;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class EarningsCalendarTest {

    static List<ReportedEarnings> reported(String ticker) {
        return EarningsCalendar.reported(SubmissionsParser.parse(SecFixtures.submissionsJson(ticker), ticker).filings());
    }

    @Test
    @DisplayName("애플 실적 발표 = 8-K 항목 2.02, 장 마감 후(동부 오후 4시 반 접수)")
    void appleReported() {
        List<ReportedEarnings> r = reported("AAPL");

        assertThat(r).extracting(ReportedEarnings::eventDate).containsExactly(
                LocalDate.parse("2025-07-31"), LocalDate.parse("2025-10-30"), LocalDate.parse("2026-01-29"),
                LocalDate.parse("2026-04-30"), LocalDate.parse("2026-07-30"));
        assertThat(r).allMatch(e -> e.timing() == EarningsTiming.AMC);
    }

    @Test
    @DisplayName("다음 발표 예상 = 작년 같은 분기 + 52주 (애플: 2025-10-30 → 2026-10-29 목요일)")
    void appleNextEstimate() {
        assertThat(EarningsCalendar.estimateNext(reported("AAPL"))).contains(LocalDate.parse("2026-10-29"));
    }

    @Test
    @DisplayName("1년치 기록이 없으면 예상하지 않는다")
    void noEstimateWithoutHistory() {
        List<ReportedEarnings> one = List.of(new ReportedEarnings("a", LocalDate.parse("2026-07-30"), null));
        assertThat(EarningsCalendar.estimateNext(one)).isEmpty();
        assertThat(EarningsCalendar.estimateNext(List.of())).isEmpty();
    }

    @Test
    @DisplayName("접수 시각(동부)으로 장전·장중·장후, 정정 8-K/A 와 2.02 없는 8-K 는 제외")
    void timingAndFilters() {
        List<SecFiling> filings = List.of(
                filing("8-K", "2.02,9.01", "2026-10-13T11:00:00Z"),   // 동부 07:00 장전
                filing("8-K", "2.02", "2026-10-14T15:00:00Z"),        // 동부 11:00 장중
                filing("8-K", "2.02", "2026-10-15T20:05:00Z"),        // 동부 16:05 장후
                filing("8-K/A", "2.02", "2026-10-16T20:05:00Z"),
                filing("8-K", "5.02", "2026-10-17T20:05:00Z"));

        assertThat(EarningsCalendar.reported(filings)).extracting(ReportedEarnings::timing)
                .containsExactly(EarningsTiming.BMO, EarningsTiming.DURING, EarningsTiming.AMC);
    }

    private static SecFiling filing(String form, String items, String accepted) {
        Instant at = Instant.parse(accepted);
        return new SecFiling("acc-" + accepted, form, LocalDate.parse(accepted.substring(0, 10)), null, at, items, "u");
    }
}
