package com.usstockmap.server.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.common.geo.AddressGeocoder;
import com.usstockmap.server.common.geo.HqLocator;
import com.usstockmap.server.common.geo.ZipCentroids;
import com.usstockmap.server.company.Company;
import com.usstockmap.server.company.CompanyRepository;
import com.usstockmap.server.company.CompanyUniverse;
import com.usstockmap.server.company.Sector;
import com.usstockmap.server.support.DbTest;
import com.usstockmap.server.support.FixtureSecClient;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@DbTest
@Import({CompanyUniverseSync.class, CompanyRegistrationService.class, HqLocator.class, ZipCentroids.class,
        CompanyUniverseSyncTest.Config.class})
class CompanyUniverseSyncTest {

    @TestConfiguration
    static class Config {
        @Bean
        FixtureSecClient secClient() {
            return new FixtureSecClient();
        }

        @Bean
        AddressGeocoder geocoder() {
            return (street, city, state, zip) -> Optional.empty();
        }

        /** 목데이터(KO·AAPL 있음) + 새 기업 AMZN(지우고 시작) + SEC 에 없는 ZZZZ */
        @Bean
        CompanyUniverse universe() {
            return new CompanyUniverse(List.of(
                    new CompanyUniverse.Entry("KO", Sector.CONSUMER, "코카콜라", "콜라 등 음료 원액과 브랜드를 파는 음료 기업", 1886, null),
                    new CompanyUniverse.Entry("AAPL", Sector.TECH, "애플", "아이폰 기업"),
                    new CompanyUniverse.Entry("AMZN", Sector.CONSUMER, "아마존", "온라인 쇼핑과 AWS"),
                    new CompanyUniverse.Entry("ZZZZ", Sector.OTHER, "없는 회사", "SEC 에 없음")));
        }
    }

    @Autowired CompanyUniverseSync sync;
    @Autowired CompanyRepository companies;
    @Autowired FixtureSecClient sec;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        sec.calls.clear();
        jdbc.update("delete from company where ticker = 'AMZN'");
    }

    @Test
    @DisplayName("없는 기업은 등록, 있는 기업은 한글 이름·소개·설립연도 갱신, SEC 에 없는 티커는 실패 목록에 (나머지는 계속)")
    void appliesUniverse() {
        CompanyUniverseSync.Result r = sync.apply();

        assertThat(r.registered()).containsExactly("AMZN");
        assertThat(r.failed()).singleElement().satisfies(f -> {
            assertThat(f.ticker()).isEqualTo("ZZZZ");
            assertThat(f.reason()).startsWith("등록 실패");
        });

        Company amzn = companies.findByTicker("AMZN").orElseThrow();
        assertThat(amzn.getName()).isEqualTo("AMAZON COM INC");
        assertThat(amzn.getNameKo()).isEqualTo("아마존");
        assertThat(amzn.getDescriptionKo()).isEqualTo("온라인 쇼핑과 AWS");
        assertThat(amzn.getSector()).isEqualTo(Sector.CONSUMER);

        assertThat(companies.findByTicker("KO").orElseThrow().getDescriptionKo())
                .isEqualTo("콜라 등 음료 원액과 브랜드를 파는 음료 기업");
        assertThat(companies.findByTicker("KO").orElseThrow().getFoundedYear()).isEqualTo(1886);
        assertThat(amzn.getFoundedYear()).as("파일에 없으면 null").isNull();
        // 새 티커가 여러 개여도 SEC 티커 목록은 한 번만
        assertThat(sec.calls).filteredOn("tickers"::equals).hasSize(1);
    }

    @Test
    @DisplayName("두 번째 실행: 새로 등록할 것도 바뀐 것도 없으면 SEC 티커 목록도 안 받는다 (ZZZZ 는 계속 실패)")
    void idempotent() {
        sync.apply();
        sec.calls.clear();

        CompanyUniverseSync.Result again = sync.apply();

        assertThat(again.registered()).isEmpty();
        assertThat(again.updated()).isZero();
        assertThat(again.failed()).extracting(f -> f.ticker()).containsExactly("ZZZZ");
    }

    @Test
    @DisplayName("파일의 업종이 SIC 추정·기존 값보다 우선")
    void sectorFromFile() {
        jdbc.update("update company set sector = 'other' where ticker = 'AAPL'");
        sync.apply();
        assertThat(companies.findByTicker("AAPL").orElseThrow().getSector()).isEqualTo(Sector.TECH);
    }
}
