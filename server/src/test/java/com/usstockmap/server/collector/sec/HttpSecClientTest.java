package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.usstockmap.server.collector.RateLimiter;
import com.usstockmap.server.common.config.AppProperties;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpSecClientTest {

    static final String UA = "UsStockMap/0.1 (test@example.com)";
    static final String FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json";

    MockRestServiceServer server;
    HttpSecClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        AppProperties props = new AppProperties(new AppProperties.Cors(List.of()),
                new AppProperties.Sec(UA, 8), new AppProperties.Fred(""));
        client = new HttpSecClient(builder, props, new RateLimiter(1000), 1);
    }

    @Test
    @DisplayName("모든 요청에 User-Agent(앱 이름 + 연락처), CIK 10자리 주소")
    void sendsUserAgent() {
        server.expect(requestTo("https://data.sec.gov/submissions/CIK0000320193.json"))
                .andExpect(header("User-Agent", UA))
                .andRespond(withSuccess("{\"cik\":\"0000320193\"}", MediaType.APPLICATION_JSON));

        assertThat(client.submissions("0000320193").get("cik").asString()).isEqualTo("0000320193");
        server.verify();
    }

    @Test
    @DisplayName("429(너무 많은 요청)·5xx 는 쉬었다가 다시 시도")
    void retriesOnThrottleAndServerError() {
        server.expect(requestTo(FACTS_URL)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        server.expect(requestTo(FACTS_URL)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        server.expect(requestTo(FACTS_URL)).andRespond(withSuccess("{\"facts\":{}}", MediaType.APPLICATION_JSON));

        assertThat(client.companyFacts("0000320193").has("facts")).isTrue();
        server.verify();
    }

    @Test
    @DisplayName("다시 시도해도 계속 실패하면 SecApiException (원래 + 3번)")
    void givesUpAfterRetries() {
        server.expect(ExpectedCount.times(4), requestTo(FACTS_URL))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThatThrownBy(() -> client.companyFacts("0000320193"))
                .isInstanceOfSatisfying(SecApiException.class, e -> assertThat(e.status()).isEqualTo(429));
        server.verify();
    }

    @Test
    @DisplayName("404 는 다시 시도하지 않고 바로 실패")
    void noRetryOn404() {
        server.expect(ExpectedCount.once(), requestTo(FACTS_URL)).andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> client.companyFacts("0000320193"))
                .isInstanceOfSatisfying(SecApiException.class, e -> assertThat(e.status()).isEqualTo(404));
        server.verify();
    }

    @Test
    @DisplayName("CIK 는 10자리 숫자만")
    void validatesCik() {
        assertThatThrownBy(() -> client.submissions("320193")).isInstanceOf(IllegalArgumentException.class);
    }
}
