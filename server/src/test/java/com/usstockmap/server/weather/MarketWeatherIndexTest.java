package com.usstockmap.server.weather;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.support.FixtureFredClient;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MarketWeatherIndexTest {

    static List<MarketWeatherIndex.Point> real() {
        return FixtureFredClient.all("STLFSI4").stream()
                .map(o -> new MarketWeatherIndex.Point(o.date(), o.value().doubleValue())).toList();
    }

    static Map<LocalDate, Double> realValues() {
        return MarketWeatherIndex.compute(real(), LocalDate.MIN).stream()
                .collect(Collectors.toMap(MarketWeatherIndex.Weekly::asOf, MarketWeatherIndex.Weekly::value));
    }

    @Test
    @DisplayName("백분위: 창에서 가장 불안 = 0, 가장 안정 = 100, 가운데 = 50, 같은 값은 중간 순위")
    void percentile() {
        double[] w = {1, 2, 3, 4, 5};
        assertThat(MarketWeatherIndex.value(w, 5)).isEqualTo(10.0);   // 가장 불안
        assertThat(MarketWeatherIndex.value(w, 1)).isEqualTo(90.0);   // 가장 안정
        assertThat(MarketWeatherIndex.value(w, 3)).isEqualTo(50.0);
        assertThat(MarketWeatherIndex.value(new double[]{2, 2, 2, 2}, 2)).isEqualTo(50.0);
    }

    @Test
    @DisplayName("이력이 5년(260주) 안 되면 계산하지 않고, 창은 최근 520주만")
    void windowAndMinimum() {
        List<MarketWeatherIndex.Point> rising = IntStream.range(0, 600)
                .mapToObj(i -> new MarketWeatherIndex.Point(LocalDate.of(2000, 1, 7).plusWeeks(i), i)).toList();

        List<MarketWeatherIndex.Weekly> out = MarketWeatherIndex.compute(rising, LocalDate.MIN);
        assertThat(out).hasSize(600 - 259);
        // 계속 오르면(점점 불안) 이번 주가 창에서 최고 → 0 근처
        assertThat(out.getLast().value()).isLessThan(1.0);
    }

    @Test
    @DisplayName("실제 위기는 전부 폭풍(< 25): 2008 금융위기, 2020 코로나, 2023 SVB, 2025-04 관세 충격")
    void realCrisesAreStorms() {
        Map<LocalDate, Double> v = realValues();
        for (String week : List.of("2008-10-17", "2020-03-20", "2023-03-17", "2025-04-11")) {
            assertThat(v.get(LocalDate.parse(week))).as(week).isLessThan(25.0);
        }
    }

    @Test
    @DisplayName("2026-10-09 (최근): 82.8 맑음. 초안 공식(50 − 20×STLFSI)이면 64.4 구름 조금")
    void latest() {
        assertThat(realValues().get(LocalDate.parse("2026-10-09"))).isEqualTo(82.8);
    }

    @Test
    @DisplayName("최근 1년 하늘이 한 가지로 고정되지 않는다 (날씨 4종 이상 등장)")
    void skyVaries() {
        long kinds = realValues().entrySet().stream()
                .filter(e -> e.getKey().isAfter(LocalDate.parse("2025-10-01")))
                .map(e -> weather(e.getValue())).distinct().count();
        assertThat(kinds).isGreaterThanOrEqualTo(4);
    }

    /** web lib/weather/weather.ts 의 구간과 같은 값 */
    static String weather(double v) {
        return v >= 76 ? "sunny" : v >= 56 ? "partlyCloudy" : v >= 45 ? "cloudy" : v >= 25 ? "rain" : "storm";
    }
}
