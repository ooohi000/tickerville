package com.usstockmap.server.collector.fred;

import com.usstockmap.server.common.config.AppProperties;
import com.usstockmap.server.common.time.MarketDates;
import com.usstockmap.server.weather.MarketWeatherIndex;
import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FRED 수집: STLFSI4 → macro_observation 에 쌓고 → 시장 날씨 지수 계산 → market_weather.
 * 처음엔 10년 + 여유를 받고, 그다음부터는 마지막 저장일 8주 전부터 (FRED 는 최근 값을 고치기도 한다).
 */
@Service
public class FredSyncService {

    static final int REFETCH_WEEKS = 8;
    static final int INITIAL_YEARS = 11;

    private final FredClient fred;
    private final AppProperties.Fred props;
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public FredSyncService(FredClient fred, AppProperties props, JdbcTemplate jdbc, Clock clock) {
        this.fred = fred;
        this.props = props.fred();
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Transactional
    public FredSyncResult sync() {
        if (!props.enabled()) {
            return FredSyncResult.skipped("FRED_API_KEY 없음 — https://fred.stlouisfed.org/docs/api/api_key.html 에서 무료 발급");
        }
        String series = MarketWeatherIndex.SERIES;
        LocalDate today = MarketDates.today(clock);
        LocalDate lastStored = jdbc.queryForObject(
                "select max(obs_date) from macro_observation where series_id = ?", LocalDate.class, series);
        LocalDate start = lastStored == null
                ? today.minusYears(INITIAL_YEARS)
                : lastStored.minusWeeks(REFETCH_WEEKS);

        List<FredObservation> fetched = fred.observations(series, start);
        jdbc.batchUpdate("""
                insert into macro_observation (series_id, obs_date, value, fetched_at) values (?, ?, ?, now())
                on conflict (series_id, obs_date) do update set value = excluded.value, fetched_at = now()
                """, fetched, 500, (ps, o) -> {
            ps.setString(1, series);
            ps.setDate(2, Date.valueOf(o.date()));
            ps.setBigDecimal(3, o.value());
        });

        List<MarketWeatherIndex.Point> all = jdbc.query(
                "select obs_date, value from macro_observation where series_id = ? order by obs_date",
                (rs, i) -> new MarketWeatherIndex.Point(rs.getDate(1).toLocalDate(), rs.getDouble(2)), series);
        // 새로 받은 구간만 다시 계산 (처음이면 계산 가능한 전부)
        LocalDate since = lastStored == null ? LocalDate.MIN : start;
        List<MarketWeatherIndex.Weekly> weeks = MarketWeatherIndex.compute(all, since);
        jdbc.batchUpdate("""
                insert into market_weather (as_of, stress_index, value, calc_version, updated_at)
                values (?, ?, ?, ?, now())
                on conflict (as_of) do update set stress_index = excluded.stress_index, value = excluded.value,
                    calc_version = excluded.calc_version, updated_at = now()
                """, weeks, 500, (ps, w) -> {
            ps.setDate(1, Date.valueOf(w.asOf()));
            ps.setDouble(2, w.stressIndex());
            ps.setDouble(3, w.value());
            ps.setInt(4, MarketWeatherIndex.VERSION);
        });

        MarketWeatherIndex.Weekly latest = weeks.isEmpty() ? null : weeks.getLast();
        return new FredSyncResult(series, fetched.size(), weeks.size(),
                latest == null ? null : latest.asOf(), latest == null ? null : latest.value(), null);
    }
}
