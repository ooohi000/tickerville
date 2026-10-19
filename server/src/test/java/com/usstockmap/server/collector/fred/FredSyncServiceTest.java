package com.usstockmap.server.collector.fred;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.common.config.AppProperties;
import com.usstockmap.server.support.DbTest;
import com.usstockmap.server.support.FixtureFredClient;
import com.usstockmap.server.weather.MarketWeatherRepository;
import com.usstockmap.server.weather.MarketWeatherService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

@DbTest
class FredSyncServiceTest {

    static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-19T12:00:00Z"), ZoneOffset.UTC);

    @Autowired JdbcTemplate jdbc;
    @Autowired MarketWeatherRepository weathers;

    static AppProperties props(String key) {
        return new AppProperties(new AppProperties.Cors(List.of()), new AppProperties.Sec("ua", 8, ""),
                new AppProperties.Fred(key, ""), new AppProperties.Collector(false), new AppProperties.Admin(""));
    }

    FredSyncService service(FixtureFredClient fred, String key) {
        return new FredSyncService(fred, props(key), jdbc, CLOCK);
    }

    @Test
    @DisplayName("처음 수집: 11년치를 쌓고 시장 날씨를 계산 → 최신 API 가 샘플 62 대신 실제 82.8")
    void firstSync() {
        FixtureFredClient fred = new FixtureFredClient();

        FredSyncResult r = service(fred, "key").sync();

        assertThat(fred.calls).containsExactly("STLFSI4:2015-10-19");
        assertThat(r.fetched()).isGreaterThan(570);
        assertThat(r.latestAsOf()).isEqualTo(LocalDate.parse("2026-10-09"));
        assertThat(r.latestValue()).isEqualTo(82.8);
        assertThat(new MarketWeatherService(weathers).getLatest().value()).isEqualTo(82.8);
        assertThat(jdbc.queryForObject("select count(*) from macro_observation where series_id = 'STLFSI4'",
                Integer.class)).isEqualTo(r.fetched());
    }

    @Test
    @DisplayName("다음 수집: 마지막 저장일 8주 전부터만 받고, 다시 돌려도 중복 없음")
    void incremental() {
        FixtureFredClient fred = new FixtureFredClient();
        FredSyncService s = service(fred, "key");
        s.sync();
        int obs = jdbc.queryForObject("select count(*) from macro_observation", Integer.class);
        int weeks = jdbc.queryForObject("select count(*) from market_weather", Integer.class);

        FredSyncResult again = s.sync();

        assertThat(fred.calls.getLast()).isEqualTo("STLFSI4:2026-08-14");
        assertThat(again.weatherWeeks()).isBetween(7, 9);
        assertThat(jdbc.queryForObject("select count(*) from macro_observation", Integer.class)).isEqualTo(obs);
        assertThat(jdbc.queryForObject("select count(*) from market_weather", Integer.class)).isEqualTo(weeks);
    }

    @Test
    @DisplayName("FRED 키가 없으면 호출하지 않고 이유와 함께 건너뜀")
    void skippedWithoutKey() {
        FixtureFredClient fred = new FixtureFredClient();

        FredSyncResult r = service(fred, "").sync();

        assertThat(fred.calls).isEmpty();
        assertThat(r.skippedReason()).contains("FRED_API_KEY");
    }
}
