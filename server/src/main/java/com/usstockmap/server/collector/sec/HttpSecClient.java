package com.usstockmap.server.collector.sec;

import com.usstockmap.server.collector.RateLimiter;
import com.usstockmap.server.common.config.AppProperties;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * SEC 접근 규칙(server/CLAUDE.md)을 지키는 실제 클라이언트.
 * <ul>
 *   <li>모든 요청에 User-Agent(앱 이름 + 연락처)</li>
 *   <li>초당 app.sec.max-requests-per-second 회 이하 (모든 요청이 제한기 하나를 같이 쓴다)</li>
 *   <li>429·5xx·연결 오류는 1·2·4초 쉬고 최대 3번 다시. 404 등 그 외 4xx 는 바로 실패</li>
 * </ul>
 */
@Component
public class HttpSecClient implements SecClient {

    private static final Logger log = LoggerFactory.getLogger(HttpSecClient.class);

    static final String WWW = "https://www.sec.gov";
    static final String DATA = "https://data.sec.gov";
    static final int MAX_RETRIES = 3;

    private final RestClient http;
    private final RateLimiter limiter;
    private final JsonMapper json = JsonMapper.builder().build();
    private final long backoffBaseMillis;

    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    /** companyfacts 는 큰 회사면 8MB 가까이 된다 */
    static final Duration READ_TIMEOUT = Duration.ofSeconds(60);

    @Autowired
    public HttpSecClient(AppProperties props) {
        this(RestClient.builder().requestFactory(requestFactory()), props,
                new RateLimiter(props.sec().maxRequestsPerSecond()), 1000);
    }

    private static JdkClientHttpRequestFactory requestFactory() {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
        factory.setReadTimeout(READ_TIMEOUT);
        return factory;
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
        return withRetry(url, () -> {
            limiter.acquire();
            String body = http.get().uri(url).retrieve().body(String.class);
            return json.readTree(body);
        });
    }

    private JsonNode withRetry(String url, Supplier<JsonNode> call) {
        RuntimeException last = null;
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                return call.get();
            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                boolean retryable = status == 429 || status >= 500;
                if (!retryable) {
                    throw new SecApiException("SEC " + status + " " + url, status, e);
                }
                last = e;
            } catch (ResourceAccessException e) {
                last = e;
            }
            if (attempt < MAX_RETRIES) {
                long wait = backoffBaseMillis << attempt;
                log.warn("SEC request failed, retry {}/{} in {}ms: {}", attempt + 1, MAX_RETRIES, wait, url);
                sleep(wait);
            }
        }
        int status = last instanceof HttpStatusCodeException h ? h.getStatusCode().value() : 0;
        throw new SecApiException("SEC failed after retries: " + url, status, last);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }

    static String requireCik(String cik) {
        if (cik == null || !cik.matches("\\d{10}")) {
            throw new IllegalArgumentException("CIK must be 10 digits: " + cik);
        }
        return cik;
    }
}
