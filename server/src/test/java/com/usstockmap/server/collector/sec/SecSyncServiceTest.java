package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.common.geo.ZipCentroids;
import com.usstockmap.server.company.Company;
import com.usstockmap.server.company.CompanyRepository;
import com.usstockmap.server.company.CompanySnapshot;
import com.usstockmap.server.company.CompanySnapshotRepository;
import com.usstockmap.server.financial.FinancialCalc;
import com.usstockmap.server.support.DbTest;
import com.usstockmap.server.support.FixtureSecClient;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/** 수집 전체 흐름: 가짜 SEC(실제 응답 파일) → 계산 → 진짜 PostgreSQL 저장 */
@DbTest
@Import({SecSyncService.class, SecSyncWriter.class, ZipCentroids.class, SecSyncServiceTest.Config.class})
class SecSyncServiceTest {

    @TestConfiguration
    static class Config {
        @Bean
        FixtureSecClient secClient() {
            return new FixtureSecClient();
        }

        /** 2026-10-19 (월) 동부 오전 8시 */
        @Bean
        Clock clock() {
            return Clock.fixed(Instant.parse("2026-10-19T12:00:00Z"), ZoneOffset.UTC);
        }
    }

    @Autowired SecSyncService service;
    @Autowired FixtureSecClient sec;
    @Autowired CompanyRepository companies;
    @Autowired CompanySnapshotRepository snapshots;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;

    @org.junit.jupiter.api.BeforeEach
    void resetCalls() {
        sec.calls.clear(); // 가짜 클라이언트는 테스트끼리 공유된다
    }

    @Test
    @DisplayName("애플 수집: CIK·기본 정보 채움, 지도 지표가 목데이터에서 실제 SEC 값으로")
    void syncsApple() {
        SecSyncResult result = service.syncTickers(List.of("AAPL"));
        em.flush();
        em.clear();

        assertThat(result.succeeded()).containsExactly("AAPL");
        Company aapl = companies.findByTicker("AAPL").orElseThrow();
        assertThat(aapl.getCik()).isEqualTo("0000320193");
        assertThat(aapl.getSicCode()).isEqualTo("3571");
        assertThat(aapl.getFiscalYearEnd()).isEqualTo("0926");
        assertThat(aapl.getSecCity()).isEqualTo("CUPERTINO");
        assertThat(aapl.getSecSyncedAt()).isEqualTo(Instant.parse("2026-10-19T12:00:00Z"));
        assertThat(aapl.getHqLat()).isEqualTo(37.3349); // 좌표는 우리가 관리 (덮어쓰지 않음)

        CompanySnapshot s = snapshots.findById(aapl.getId()).orElseThrow();
        assertThat(s.getRevenueTtmUsd()).isEqualTo(466_823_000_000L);
        assertThat(s.getRevenueGrowthYoy()).isEqualTo(0.1424);
        assertThat(s.getDataAsOf()).isEqualTo(LocalDate.parse("2026-06-27"));
        assertThat(s.getPublicFloatAsOf()).isEqualTo(LocalDate.parse("2025-03-28"));
        assertThat(s.getCalcVersion()).isEqualTo(FinancialCalc.VERSION);
    }

    @Test
    @DisplayName("애플 수집: 원본 값·재무제표·공시·오늘 기록·실적 이벤트가 쌓인다")
    void storesHistory() {
        service.syncTickers(List.of("AAPL"));
        long id = companies.findByTicker("AAPL").orElseThrow().getId();

        assertThat(count("financial_fact", id)).isGreaterThan(500);
        assertThat(jdbc.queryForObject("""
                select revenue from financial_period
                where company_id = ? and period_type = 'Q' and period_end = date '2025-09-27'
                """, Long.class, id)).isEqualTo(102_466_000_000L);
        assertThat(count("filing", id)).isGreaterThan(50);

        Map<String, Object> daily = jdbc.queryForMap(
                "select as_of, calc_version, revenue_ttm_usd from company_metric_daily where company_id = ?", id);
        assertThat(daily.get("as_of").toString()).isEqualTo("2026-10-19");
        assertThat(daily.get("revenue_ttm_usd")).isEqualTo(466_823_000_000L);

        assertThat(jdbc.queryForObject(
                "select count(*) from earnings_event where company_id = ? and status = 'REPORTED'", Integer.class, id))
                .isEqualTo(5);
        assertThat(jdbc.queryForObject(
                "select event_date from earnings_event where company_id = ? and status = 'EXPECTED'", LocalDate.class, id))
                .isEqualTo(LocalDate.parse("2026-10-29"));
        assertThat(count("data_quality_issue", id)).isZero();
    }

    @Test
    @DisplayName("같은 날 두 번 돌려도 중복 없이 같은 결과 (공시·이벤트·기록 그대로)")
    void idempotent() {
        service.syncTickers(List.of("AAPL"));
        long id = companies.findByTicker("AAPL").orElseThrow().getId();
        int facts = count("financial_fact", id);
        int periods = count("financial_period", id);
        int filings = count("filing", id);
        int events = count("earnings_event", id);

        service.syncTickers(List.of("AAPL"));

        assertThat(count("financial_fact", id)).isEqualTo(facts);
        assertThat(count("financial_period", id)).isEqualTo(periods);
        assertThat(count("filing", id)).isEqualTo(filings);
        assertThat(count("earnings_event", id)).isEqualTo(events);
        assertThat(count("company_metric_daily", id)).isEqualTo(1);
    }

    @Test
    @DisplayName("CIK 가 없으면 티커 목록을 한 번만 받아서 찾는다. 두 번째부터는 저장된 CIK")
    void resolvesCikOnce() {
        service.syncTickers(List.of("AAPL", "JPM"));
        assertThat(sec.calls.stream().filter(c -> c.equals("tickers"))).hasSize(1);

        sec.calls.clear();
        em.flush();
        em.clear();
        service.syncTickers(List.of("AAPL"));
        assertThat(sec.calls).containsExactly("submissions:0000320193", "companyfacts:0000320193");
    }

    @Test
    @DisplayName("한 기업이 실패해도(META: 응답 없음) 나머지는 수집된다")
    void isolatesFailures() {
        SecSyncResult result = service.syncTickers(List.of("META", "JPM"));

        assertThat(result.succeeded()).containsExactly("JPM");
        assertThat(result.failed()).extracting(SecSyncResult.Failure::ticker).containsExactly("META");
        Company jpm = companies.findByTicker("JPM").orElseThrow();
        assertThat(snapshots.findById(jpm.getId()).orElseThrow().getOperatingMarginTtm()).isNull(); // 은행 규칙
    }

    @Test
    @DisplayName("전체 수집: 등록된 10개 중 응답 파일이 있는 7개 성공")
    void syncAll() {
        SecSyncResult result = service.syncAll();

        assertThat(result.succeeded()).containsExactly("AAPL", "AMZN", "JPM", "KO", "NVDA", "PLTR", "TSLA");
        long ko = companies.findByTicker("KO").orElseThrow().getId();
        assertThat(jdbc.queryForList("select code from data_quality_issue where company_id = ?", String.class, ko))
                .containsExactlyInAnyOrder("STALE", "FACTS_BEHIND_FILINGS");
        assertThat(result.failed()).extracting(SecSyncResult.Failure::ticker)
                .containsExactlyInAnyOrder("GOOGL", "META", "MSFT");
    }

    @Test
    @DisplayName("지도 좌표가 SEC 본사 주소와 50km 넘게 멀면 이상 신호 (코카콜라 좌표를 덴버로 바꿔봄)")
    void flagsHqMismatch() {
        jdbc.update("update company set hq_lat = 39.74, hq_lng = -104.99 where ticker = 'KO'");
        em.clear();

        service.syncTickers(List.of("KO", "PLTR"));

        long ko = companies.findByTicker("KO").orElseThrow().getId();
        long pltr = companies.findByTicker("PLTR").orElseThrow().getId();
        assertThat(jdbc.queryForList("select code from data_quality_issue where company_id = ?", String.class, ko))
                .contains("HQ_FAR_FROM_SEC_ADDRESS");
        assertThat(jdbc.queryForList("select code from data_quality_issue where company_id = ?", String.class, pltr))
                .doesNotContain("HQ_FAR_FROM_SEC_ADDRESS"); // 목데이터 좌표가 이미 SEC 주소(아벤투라)
    }

    private int count(String table, long companyId) {
        return jdbc.queryForObject("select count(*) from " + table + " where company_id = ?", Integer.class, companyId);
    }
}
