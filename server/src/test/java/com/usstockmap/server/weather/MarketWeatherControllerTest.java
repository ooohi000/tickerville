package com.usstockmap.server.weather;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.usstockmap.server.common.api.ApiException;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** docs/api.md GET /api/v1/market-weather 계약 확인 */
@WebMvcTest(MarketWeatherController.class)
@ActiveProfiles("test")
class MarketWeatherControllerTest {

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    MarketWeatherService service;

    @Test
    @DisplayName("계약 모양: { value, asOf }")
    void returnsLatestWeather() {
        when(service.getLatest()).thenReturn(new MarketWeatherResponse(64, LocalDate.of(2026, 10, 9)));

        assertThat(mvc.get().uri("/api/v1/market-weather"))
                .hasStatusOk()
                .hasHeader("Cache-Control", "max-age=300, public")
                .bodyJson()
                .isStrictlyEqualTo("""
                        { "value": 64.0, "asOf": "2026-10-09" }
                        """);
    }

    @Test
    @DisplayName("아직 수집 전이면 503 DATA_NOT_READY")
    void returnsDataNotReadyWhenEmpty() {
        when(service.getLatest()).thenThrow(ApiException.dataNotReady("market weather"));

        assertThat(mvc.get().uri("/api/v1/market-weather"))
                .hasStatus(503)
                .bodyJson()
                .isStrictlyEqualTo("""
                        { "error": { "code": "DATA_NOT_READY", "message": "market weather not collected yet" } }
                        """);
    }
}
