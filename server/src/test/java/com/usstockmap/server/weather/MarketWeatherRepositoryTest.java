package com.usstockmap.server.weather;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.usstockmap.server.support.DbTest;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

@DbTest
class MarketWeatherRepositoryTest {

    @Autowired
    MarketWeatherRepository weathers;

    @Test
    @DisplayName("목데이터 시장 날씨는 62 (STLFSI -0.6)")
    void seedHasSampleWeather() {
        MarketWeather latest = weathers.findTopByOrderByAsOfDesc().orElseThrow();

        assertThat(latest.getValue()).isEqualTo(62.0);
        assertThat(latest.getStressIndex()).isEqualTo(-0.6);
    }

    @Test
    @DisplayName("가장 최근 기준일의 값을 돌려준다")
    void latestByAsOf() {
        weathers.saveAndFlush(new MarketWeather(LocalDate.of(2026, 10, 23), 1.0, 30));
        weathers.saveAndFlush(new MarketWeather(LocalDate.of(2026, 10, 9), -1.0, 70));

        assertThat(weathers.findTopByOrderByAsOfDesc().orElseThrow().getAsOf())
                .isEqualTo(LocalDate.of(2026, 10, 23));
    }

    @Test
    @DisplayName("지수는 0~100 밖이면 거부된다")
    void valueOutOfRangeIsRejected() {
        assertThatThrownBy(() -> weathers.saveAndFlush(new MarketWeather(LocalDate.of(2026, 1, 2), -5, 150)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
