package com.usstockmap.server.collector.fred;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.support.FixtureFredClient;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class FredObservationsParserTest {

    @Test
    @DisplayName("실제 STLFSI4 응답: 1993-12-31 부터 주간, 빈 값(\".\")은 버리고 날짜순")
    void parsesRealResponse() {
        List<FredObservation> obs = FixtureFredClient.all("STLFSI4");

        assertThat(obs).hasSizeGreaterThan(1700);
        assertThat(obs.getFirst().date()).isEqualTo(LocalDate.parse("1993-12-31"));
        assertThat(obs.getLast().date()).isEqualTo(LocalDate.parse("2026-10-09"));
        assertThat(obs.getLast().value()).isEqualByComparingTo("-0.7206");
        assertThat(obs).extracting(FredObservation::date).doesNotContain(LocalDate.parse("2026-09-19")).isSorted();
    }
}
