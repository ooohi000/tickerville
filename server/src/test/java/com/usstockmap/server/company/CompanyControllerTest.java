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

    @MockitoBean
    CompanyDetailService detail;

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

    static final CompanyResponse JPM = new CompanyResponse("JPM", "JPMorgan Chase", "JP모건", "finance",
            new CompanyResponse.Hq("New York", "NY", 40.7559, -73.9754),
            270_000_000_000L, 58_000_000_000L, 4_000_000_000_000L, null, 0.06, 650_000_000_000L,
            java.time.LocalDate.of(2026, 6, 30), new CompanyResponse.FilingActivity(6, 10), null);

    @Test
    @DisplayName("상세 계약 모양: 없는 값도 null 로 남기고, 실적 요약까지")
    void detailInContractShape() {
        when(detail.get("jpm")).thenReturn(new CompanyDetailResponse(JPM,
                new CompanyDetailResponse.Profile("0000019617", "NYSE", "6021", "National Commercial Banks", "1231", null),
                null,
                new com.usstockmap.server.financial.FinancialStatementResponse(2026, "Q2", java.time.LocalDate.of(2026, 6, 30),
                        java.time.LocalDate.of(2026, 8, 6), 57_347_000_000L, null, null, 21_155_000_000L,
                        new java.math.BigDecimal("7.7"), 5_015_069_000_000L, null, null, null, null, null),
                List.of(new com.usstockmap.server.filing.FilingResponse("8-K", "2.02,9.01", "실적 발표",
                        java.time.LocalDate.of(2026, 10, 13), "https://www.sec.gov/x")),
                new com.usstockmap.server.earnings.EarningsSummaryResponse(
                        new com.usstockmap.server.earnings.EarningsSummaryResponse.LastReported(java.time.LocalDate.of(2026, 10, 13), "DURING"),
                        new com.usstockmap.server.earnings.EarningsSummaryResponse.Next(java.time.LocalDate.of(2027, 1, 12), "EXPECTED", "ESTIMATE"))));

        assertThat(mvc.get().uri("/api/v1/companies/jpm"))
                .hasStatusOk()
                .hasHeader("Cache-Control", "max-age=300, public")
                .bodyJson()
                .isLenientlyEqualTo("""
                        {
                          "company": { "ticker": "JPM", "operatingMarginTtm": null },
                          "profile": { "cik": "0000019617", "exchange": "NYSE", "sicCode": "6021",
                                       "sicDescription": "National Commercial Banks", "fiscalYearEnd": "1231",
                                       "descriptionKo": null },
                          "latestAnnual": null,
                          "latestQuarter": { "fiscalYear": 2026, "fiscalPeriod": "Q2", "periodEnd": "2026-06-30",
                                             "filedAt": "2026-08-06", "revenue": 57347000000, "grossProfit": null,
                                             "operatingIncome": null, "epsDiluted": 7.7, "freeCashFlow": null },
                          "recentFilings": [ { "form": "8-K", "items": "2.02,9.01", "labelKo": "실적 발표",
                                               "filedAt": "2026-10-13", "url": "https://www.sec.gov/x" } ],
                          "earnings": { "lastReported": { "date": "2026-10-13", "timing": "DURING" },
                                        "next": { "date": "2027-01-12", "status": "EXPECTED", "source": "ESTIMATE" } }
                        }
                        """);
    }

    @Test
    @DisplayName("재무제표 목록: 기본값 quarterly·8 을 그대로 서비스에 넘긴다")
    void financialsDefaults() {
        when(detail.financials("AAPL", "quarterly", 8)).thenReturn(List.of());
        assertThat(mvc.get().uri("/api/v1/companies/AAPL/financials")).hasStatusOk().bodyJson().isEqualTo("[]");

        when(detail.financials("AAPL", "annual", 3)).thenReturn(List.of());
        assertThat(mvc.get().uri("/api/v1/companies/AAPL/financials?period=annual&limit=3")).hasStatusOk();
    }

    @Test
    @DisplayName("없는 티커는 404 COMPANY_NOT_FOUND, limit 이 숫자가 아니면 400")
    void errors() {
        when(detail.get("ZZZZ")).thenThrow(com.usstockmap.server.common.api.ApiException.companyNotFound("ZZZZ"));

        assertThat(mvc.get().uri("/api/v1/companies/ZZZZ"))
                .hasStatus(404)
                .bodyJson().isStrictlyEqualTo("""
                        { "error": { "code": "COMPANY_NOT_FOUND", "message": "ticker ZZZZ not found" } }
                        """);
        assertThat(mvc.get().uri("/api/v1/companies/AAPL/financials?limit=abc"))
                .hasStatus(400).bodyJson().extractingPath("$.error.code").isEqualTo("INVALID_PARAMETER");
    }
}
