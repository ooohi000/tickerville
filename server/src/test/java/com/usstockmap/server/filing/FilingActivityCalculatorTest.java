package com.usstockmap.server.filing;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.collector.sec.SecFiling;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class FilingActivityCalculatorTest {

    static SecFiling f(String form, String date) {
        return new SecFiling("a-" + form + date, form, LocalDate.parse(date), null, null, null, "u");
    }

    @Test
    @DisplayName("오늘 포함 30일: 8-K·8-K/A = 중요 사건, 4·4/A = 내부자 거래, 나머지는 안 센다")
    void countsWindow() {
        LocalDate today = LocalDate.parse("2026-10-19");
        List<SecFiling> filings = List.of(
                f("8-K", "2026-10-19"),
                f("8-K/A", "2026-09-20"),   // 30일째 (포함)
                f("8-K", "2026-09-19"),     // 31일째 (제외)
                f("4", "2026-10-01"),
                f("4/A", "2026-10-02"),
                f("10-Q", "2026-10-10"),
                f("4", "2026-10-20"));      // 미래 (제외)

        assertThat(FilingActivityCalculator.count(filings, today)).isEqualTo(new FilingActivity(2, 2));
    }
}
