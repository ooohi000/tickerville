package com.usstockmap.server.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.usstockmap.server.common.api.ApiException;
import com.usstockmap.server.common.api.ErrorCode;
import com.usstockmap.server.common.geo.AddressGeocoder;
import com.usstockmap.server.common.geo.GeoPoint;
import com.usstockmap.server.common.geo.HqLocator;
import com.usstockmap.server.common.geo.ZipCentroids;
import com.usstockmap.server.company.Company;
import com.usstockmap.server.company.CompanyRepository;
import com.usstockmap.server.company.Sector;
import com.usstockmap.server.support.DbTest;
import com.usstockmap.server.support.FixtureSecClient;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@DbTest
@Import({CompanyRegistrationService.class, HqLocator.class, ZipCentroids.class, CompanyRegistrationServiceTest.Config.class})
class CompanyRegistrationServiceTest {

    @TestConfiguration
    static class Config {
        @Bean
        FixtureSecClient secClient() {
            return new FixtureSecClient();
        }

        /** 지오코더는 못 찾는다고 가정 → 우편번호 중심으로 대체되는지 본다 */
        @Bean
        AddressGeocoder geocoder() {
            return (street, city, state, zip) -> Optional.empty();
        }
    }

    @Autowired CompanyRegistrationService registration;
    @Autowired CompanyRepository companies;
    @Autowired JdbcTemplate jdbc;

    @Test
    @DisplayName("티커로 등록: SEC 이름·본사(도시는 보기 좋게), 좌표는 우편번호 중심, 섹터는 업종 코드로 추정")
    void registersFromSec() {
        jdbc.update("delete from company where ticker = 'KO'"); // 목데이터에서 빼고 새로 등록해 본다

        var r = registration.register(new CompanyRegistrationService.Request("ko", "코카콜라", null));

        assertThat(r.ticker()).isEqualTo("KO");
        assertThat(r.name()).isEqualTo("COCA COLA CO");
        assertThat(r.hqCity()).isEqualTo("Atlanta");
        assertThat(r.hqState()).isEqualTo("GA");
        assertThat(r.sector()).isEqualTo("consumer");
        assertThat(r.locationPrecision()).isEqualTo(GeoPoint.Precision.ZIP);
        // 코카콜라 본사(애틀랜타 노스 애비뉴)와 10km 이내
        assertThat(new GeoPoint(r.lat(), r.lng(), GeoPoint.Precision.ZIP).distanceKm(33.7712, -84.3963)).isLessThan(10);

        Company saved = companies.findByTicker("KO").orElseThrow();
        assertThat(saved.getNameKo()).isEqualTo("코카콜라");
        assertThat(saved.getSector()).isEqualTo(Sector.CONSUMER);
    }

    @Test
    @DisplayName("섹터를 주면 그대로 (추정보다 우선)")
    void explicitSector() {
        jdbc.update("delete from company where ticker = 'AMZN'");
        assertThat(registration.register(new CompanyRegistrationService.Request("AMZN", null, "tech")).sector())
                .isEqualTo("tech");
    }

    @Test
    @DisplayName("이미 있는 티커는 409, SEC 에 없는 티커·모르는 섹터·빈 티커는 400")
    void errors() {
        assertCode(() -> registration.register(new CompanyRegistrationService.Request("AAPL", null, null)), ErrorCode.CONFLICT);
        assertCode(() -> registration.register(new CompanyRegistrationService.Request("ZZZZ", null, null)), ErrorCode.INVALID_PARAMETER);
        assertCode(() -> registration.register(new CompanyRegistrationService.Request(" ", null, null)), ErrorCode.INVALID_PARAMETER);
        jdbc.update("delete from company where ticker = 'TSLA'");
        assertCode(() -> registration.register(new CompanyRegistrationService.Request("TSLA", null, "cars")), ErrorCode.INVALID_PARAMETER);
    }

    private static void assertCode(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, ErrorCode code) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo(code));
    }
}
