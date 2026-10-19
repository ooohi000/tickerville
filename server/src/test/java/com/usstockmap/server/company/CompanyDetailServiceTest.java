package com.usstockmap.server.company;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.usstockmap.server.collector.sec.SecSyncService;
import com.usstockmap.server.collector.sec.SecSyncWriter;
import com.usstockmap.server.common.api.ApiException;
import com.usstockmap.server.common.api.ErrorCode;
import com.usstockmap.server.common.geo.ZipCentroids;
import com.usstockmap.server.filing.FilingResponse;
import com.usstockmap.server.financial.FinancialStatementResponse;
import com.usstockmap.server.support.DbTest;
import com.usstockmap.server.support.FixtureSecClient;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/** 실제 SEC 응답으로 수집해 둔 DB 에서 상세 조회 (수집 → 조회 전체 흐름) */
@DbTest
@Import({CompanyDetailService.class, CompanyDetailQueryRepository.class, SecSyncService.class, SecSyncWriter.class,
        ZipCentroids.class, CompanyDetailServiceTest.Config.class})
class CompanyDetailServiceTest {

    @TestConfiguration
    static class Config {
        @Bean
        FixtureSecClient secClient() {
            return new FixtureSecClient();
        }

        @Bean
        Clock clock() {
            return Clock.fixed(Instant.parse("2026-10-19T12:00:00Z"), ZoneOffset.UTC);
        }
    }

    @Autowired CompanyDetailService detail;
    @Autowired SecSyncService sync;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;

    @BeforeEach
    void collect() {
        sync.syncTickers(List.of("AAPL", "JPM"));
        em.flush();
        em.clear();
    }

    @Test
    @DisplayName("애플 상세: 기본 정보, 최근 분기·연간, 공시 20건(최신순·한글 이름), 실적 지난·다음(예상)")
    void apple() {
        CompanyDetailResponse d = detail.get("aapl"); // 소문자도 된다

        assertThat(d.company().ticker()).isEqualTo("AAPL");
        assertThat(d.company().revenueTtmUsd()).isEqualTo(466_823_000_000L);
        assertThat(d.profile().cik()).isEqualTo("0000320193");
        assertThat(d.profile().fiscalYearEnd()).isEqualTo("0926");

        assertThat(d.latestQuarter().fiscalYear()).isEqualTo(2026);
        assertThat(d.latestQuarter().fiscalPeriod()).isEqualTo("Q3");
        assertThat(d.latestQuarter().revenue()).isEqualTo(109_417_000_000L);
        assertThat(d.latestQuarter().epsDiluted()).isEqualByComparingTo("2.02");
        assertThat(d.latestAnnual().fiscalPeriod()).isEqualTo("FY");
        assertThat(d.latestAnnual().revenue()).isEqualTo(416_161_000_000L);

        assertThat(d.recentFilings()).hasSize(20);
        assertThat(d.recentFilings()).extracting(FilingResponse::filedAt)
                .isSortedAccordingTo(java.util.Comparator.reverseOrder());
        assertThat(d.recentFilings()).allSatisfy(f -> assertThat(f.labelKo()).isNotBlank());

        assertThat(d.earnings().lastReported().date()).isEqualTo(LocalDate.parse("2026-07-30"));
        assertThat(d.earnings().lastReported().timing()).isEqualTo("AMC");
        assertThat(d.earnings().next().date()).isEqualTo(LocalDate.parse("2026-10-29"));
        assertThat(d.earnings().next().status()).isEqualTo("EXPECTED");
    }

    @Test
    @DisplayName("회사가 날짜를 발표해 확정(CONFIRMED)을 넣으면 추정보다 확정이 다음 발표로")
    void confirmedBeatsEstimate() {
        long id = jdbc.queryForObject("select id from company where ticker = 'AAPL'", Long.class);
        jdbc.update("insert into earnings_event (company_id, status, event_date, source) values (?, 'CONFIRMED', date '2026-10-29', 'MANUAL')", id);

        var next = detail.get("AAPL").earnings().next();
        assertThat(next.status()).isEqualTo("CONFIRMED");
        assertThat(next.source()).isEqualTo("MANUAL");
    }

    @Test
    @DisplayName("아직 수집 안 된 기업(META): 지도 값은 목데이터, 기본 정보·재무 null, 공시 빈 배열, 실적 null")
    void notCollectedYet() {
        CompanyDetailResponse d = detail.get("META");

        assertThat(d.company().ticker()).isEqualTo("META");
        assertThat(d.profile()).isNull();
        assertThat(d.latestAnnual()).isNull();
        assertThat(d.latestQuarter()).isNull();
        assertThat(d.recentFilings()).isEmpty();
        assertThat(d.earnings().lastReported()).isNull();
        assertThat(d.earnings().next()).isNull();
    }

    @Test
    @DisplayName("재무제표 목록: 분기 기본 8개 최신순, 연간, 은행은 영업이익 null")
    void financials() {
        List<FinancialStatementResponse> q = detail.financials("AAPL", "quarterly", 8);
        assertThat(q).hasSize(8);
        assertThat(q.getFirst().periodEnd()).isEqualTo(LocalDate.parse("2026-06-27"));
        assertThat(q).extracting(FinancialStatementResponse::periodEnd).isSortedAccordingTo(java.util.Comparator.reverseOrder());
        assertThat(q).filteredOn(r -> r.fiscalPeriod().equals("Q4")).allSatisfy(r -> assertThat(r.epsDiluted()).isNull());

        List<FinancialStatementResponse> fy = detail.financials("AAPL", "ANNUAL", 3);
        assertThat(fy).extracting(FinancialStatementResponse::fiscalYear).containsExactly(2025, 2024, 2023);

        assertThat(detail.financials("JPM", "annual", 1).getFirst().operatingIncome()).isNull();
    }

    @Test
    @DisplayName("잘못된 요청: 없는 티커 404, period·limit 범위 밖 400")
    void errors() {
        assertCode(() -> detail.get("ZZZZ"), ErrorCode.COMPANY_NOT_FOUND);
        assertCode(() -> detail.financials("ZZZZ", "quarterly", 8), ErrorCode.COMPANY_NOT_FOUND);
        assertCode(() -> detail.financials("AAPL", "weekly", 8), ErrorCode.INVALID_PARAMETER);
        assertCode(() -> detail.financials("AAPL", "quarterly", 0), ErrorCode.INVALID_PARAMETER);
        assertCode(() -> detail.financials("AAPL", "quarterly", 41), ErrorCode.INVALID_PARAMETER);
    }

    private static void assertCode(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, ErrorCode code) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo(code));
    }
}
