package com.usstockmap.server.collector.sec;

import com.usstockmap.server.collector.CollectorHttp;
import com.usstockmap.server.collector.HttpRetry;
import com.usstockmap.server.collector.RateLimiter;
import com.usstockmap.server.common.config.AppProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * SEC 접근 규칙(server/CLAUDE.md)을 지키는 실제 클라이언트.
 * 모든 요청에 User-Agent(앱 이름 + 연락처), 초당 app.sec.max-requests-per-second 회 이하, 재시도는 HttpRetry.
 */
@Component
public class HttpSecClient implements SecClient {

    static final String WWW = "https://www.sec.gov";
    static final String DATA = "https://data.sec.gov";

    private final RestClient http;
    private final RateLimiter limiter;
    private final JsonMapper json = JsonMapper.builder().build();
    private final long backoffBaseMillis;

    @Autowired
    public HttpSecClient(AppProperties props) {
        this(CollectorHttp.builder(), props, new RateLimiter(props.sec().maxRequestsPerSecond()), 1000);
    }

    HttpSecClient(RestClient.Builder builder, AppProperties props, RateLimiter limiter, long backoffBaseMillis) {
        this.http = builder
                .defaultHeader(HttpHeaders.USER_AGENT, props.sec().userAgent())
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .build();
        this.limiter = limiter;
        this.backoffBaseMillis = backoffBaseMillis;
    }

    @Override
    public JsonNode companyTickers() {
        return get(WWW + "/files/company_tickers.json");
    }

    @Override
    public JsonNode submissions(String cik) {
        return get(DATA + "/submissions/CIK" + requireCik(cik) + ".json");
    }

    @Override
    public JsonNode companyFacts(String cik) {
        return get(DATA + "/api/xbrl/companyfacts/CIK" + requireCik(cik) + ".json");
    }

    private JsonNode get(String url) {
        return HttpRetry.call("SEC " + url, backoffBaseMillis, () -> {
            limiter.acquire();
            return json.readTree(http.get().uri(url).retrieve().body(String.class));
        });
    }

    static String requireCik(String cik) {
        if (cik == null || !cik.matches("\\d{10}")) {
            throw new IllegalArgumentException("CIK must be 10 digits: " + cik);
        }
        return cik;
    }
}
