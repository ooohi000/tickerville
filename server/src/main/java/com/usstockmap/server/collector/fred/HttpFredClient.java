package com.usstockmap.server.collector.fred;

import com.usstockmap.server.collector.CollectorHttp;
import com.usstockmap.server.collector.HttpRetry;
import com.usstockmap.server.common.config.AppProperties;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.json.JsonMapper;

/**
 * FRED API (https://api.stlouisfed.org). 키 필수(무료). 제한 분당 120회 — 우리는 하루 몇 번.
 * 화면에 "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." 표기
 */
@Component
public class HttpFredClient implements FredClient {

    static final String BASE = "https://api.stlouisfed.org/fred/series/observations";

    private final RestClient http;
    private final AppProperties.Fred props;
    private final JsonMapper json = JsonMapper.builder().build();
    private final long backoffBaseMillis;

    @Autowired
    public HttpFredClient(AppProperties props) {
        this(CollectorHttp.builder(), props.fred(), 1000);
    }

    HttpFredClient(RestClient.Builder builder, AppProperties.Fred props, long backoffBaseMillis) {
        this.http = builder.build();
        this.props = props;
        this.backoffBaseMillis = backoffBaseMillis;
    }

    @Override
    public List<FredObservation> observations(String seriesId, LocalDate start) {
        if (!props.enabled()) {
            throw new IllegalStateException("FRED_API_KEY 가 없어 FRED 수집을 할 수 없음");
        }
        String url = UriComponentsBuilder.fromUriString(BASE)
                .queryParam("series_id", seriesId)
                .queryParam("observation_start", start.toString())
                .queryParam("file_type", "json")
                .queryParam("api_key", props.apiKey())
                .build().toUriString();
        // 로그·예외 메시지에 키가 남지 않게 라벨은 시리즈 ID 만
        return HttpRetry.call("FRED " + seriesId, backoffBaseMillis,
                () -> FredObservationsParser.parse(json.readTree(http.get().uri(url).retrieve().body(String.class))));
    }
}
