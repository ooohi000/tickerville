package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.support.SecFixtures;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SubmissionsParserTest {

    @Test
    @DisplayName("애플 기본 정보: CIK, 거래소, 업종, 회계연도 마감, 본사 주소")
    void appleProfile() {
        SecSubmission s = SubmissionsParser.parse(SecFixtures.submissionsJson("AAPL"), "AAPL");

        assertThat(s.cik()).isEqualTo("0000320193");
        assertThat(s.exchange()).isEqualTo("Nasdaq");
        assertThat(s.sicCode()).isEqualTo("3571");
        assertThat(s.sicDescription()).isEqualTo("Electronic Computers");
        assertThat(s.fiscalYearEnd()).isEqualTo("0926");
        assertThat(s.businessAddress()).isEqualTo(
                new SecSubmission.Address("ONE APPLE PARK WAY", "CUPERTINO", "CA", "95014"));
    }

    @Test
    @DisplayName("팔란티어 본사는 SEC 기준 플로리다")
    void palantirAddress() {
        SecSubmission s = SubmissionsParser.parse(SecFixtures.submissionsJson("PLTR"), "PLTR");
        assertThat(s.businessAddress().state()).isEqualTo("FL");
    }

    @Test
    @DisplayName("공시: 필요한 종류만, 8-K 항목·접수 시각·원문 주소까지")
    void filings() {
        SecSubmission s = SubmissionsParser.parse(SecFixtures.submissionsJson("AAPL"), "AAPL");

        assertThat(s.filings()).isNotEmpty();
        assertThat(s.filings()).allMatch(f -> SubmissionsParser.KEPT_FORMS.contains(f.form()));
        SecFiling earnings = s.filings().stream()
                .filter(f -> f.form().equals("8-K") && f.filedAt().equals(LocalDate.parse("2026-07-30")))
                .findFirst().orElseThrow();
        assertThat(earnings.hasItem("2.02")).isTrue();
        assertThat(earnings.hasItem("2.0")).isFalse();
        assertThat(earnings.acceptedAt()).isEqualTo(Instant.parse("2026-07-31T00:30:28Z"));
        assertThat(earnings.url()).startsWith("https://www.sec.gov/Archives/edgar/data/320193/");
    }

    @Test
    @DisplayName("대표 문서가 없으면 공시 색인 페이지 주소")
    void indexUrlFallback() {
        assertThat(SubmissionsParser.documentUrl("0000320193", "0000320193-26-000001", null))
                .isEqualTo("https://www.sec.gov/Archives/edgar/data/320193/000032019326000001/0000320193-26-000001-index.htm");
    }

    @Test
    @DisplayName("티커 목록: 대문자 티커 → CIK 10자리 (같은 회사 여러 티커도)")
    void tickers() {
        Map<String, String> map = CompanyTickersParser.parse(
                tools.jackson.databind.json.JsonMapper.builder().build().readTree(
                        SubmissionsParserTest.class.getResourceAsStream("/sec/company_tickers.json")));

        assertThat(map).containsEntry("AAPL", "0000320193")
                .containsEntry("JPM", "0000019617")
                .containsEntry("GOOGL", "0001652044")
                .containsEntry("GOOG", "0001652044")
                .containsEntry("BRK-B", "0001067983");
    }
}
