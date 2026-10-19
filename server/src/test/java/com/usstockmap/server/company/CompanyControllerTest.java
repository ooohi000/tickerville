package com.usstockmap.server.company;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** docs/api.md GET /api/v1/companies 계약 확인 */
@WebMvcTest(CompanyController.class)
@ActiveProfiles("test")
class CompanyControllerTest {

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    CompanyService service;

    @Test
    @DisplayName("계약 모양 그대로: 날짜는 YYYY-MM-DD, 없는 값도 null 로 필드를 남긴다")
    void returnsDatasetInContractShape() {
        when(service.getMapDataset()).thenReturn(new CompanyDatasetResponse(
                LocalDate.of(2026, 10, 16),
                List.of(new CompanyResponse("JPM", "JPMorgan Chase", "JP모건", "finance",
                        new CompanyResponse.Hq("New York", "NY", 40.7559, -73.9754),
                        270_000_000_000L, 58_000_000_000L, 4_000_000_000_000L,
                        null, 0.06, 650_000_000_000L, LocalDate.of(2026, 6, 30),
                        new CompanyResponse.FilingActivity(6, 10), null))));

        assertThat(mvc.get().uri("/api/v1/companies"))
                .hasStatusOk()
                .hasHeader("Cache-Control", "max-age=300, public")
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "asOf": "2026-10-16",
                          "companies": [{
                            "ticker": "JPM", "name": "JPMorgan Chase", "nameKo": "JP모건", "sector": "finance",
                            "hq": { "city": "New York", "state": "NY", "lat": 40.7559, "lng": -73.9754 },
                            "revenueTtmUsd": 270000000000,
                            "netIncomeTtmUsd": 58000000000,
                            "totalAssetsUsd": 4000000000000,
                            "operatingMarginTtm": null,
                            "revenueGrowthYoy": 0.06,
                            "publicFloatUsd": 650000000000,
                            "publicFloatAsOf": "2026-06-30",
                            "filings30d": { "material": 6, "insider": 10 },
                            "memo": null
                          }]
                        }
                        """);
    }
}
