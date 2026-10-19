package com.usstockmap.server.common.geo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class GeoTest {

    static final ZipCentroids ZIPS = new ZipCentroids();

    @Test
    @DisplayName("우편번호 중심점: 3.3만 개 로드, ZIP+4 도 앞 5자리로")
    void zipCentroids() {
        assertThat(ZIPS.size()).isGreaterThan(33_000);
        GeoPoint cupertino = ZIPS.find("95014-2083").orElseThrow();
        assertThat(cupertino.precision()).isEqualTo(GeoPoint.Precision.ZIP);
        // 애플 파크(37.3349, -122.009)와 10km 이내
        assertThat(cupertino.distanceKm(37.3349, -122.009)).isLessThan(10);
        assertThat(ZIPS.find("00000")).isEmpty();
        assertThat(ZIPS.find(null)).isEmpty();
    }

    @Test
    @DisplayName("거리: 뉴욕 ↔ LA 약 3,940km")
    void distance() {
        GeoPoint ny = new GeoPoint(40.7128, -74.0060, GeoPoint.Precision.ADDRESS);
        assertThat(ny.distanceKm(34.0522, -118.2437)).isBetween(3900.0, 3990.0);
        assertThat(ny.distanceKm(40.7128, -74.0060)).isZero();
    }

    @Test
    @DisplayName("주소 정리: 맨 앞 숫자 단어 → 숫자, 도시 이름 첫 글자만 대문자")
    void normalize() {
        assertThat(AddressNormalizer.street("ONE APPLE PARK WAY")).isEqualTo("1 APPLE PARK WAY");
        assertThat(AddressNormalizer.street("2788 SAN TOMAS EXPRESSWAY")).isEqualTo("2788 SAN TOMAS EXPRESSWAY");
        assertThat(AddressNormalizer.street("ONEIDA ST")).isEqualTo("ONEIDA ST");
        assertThat(AddressNormalizer.titleCase("SANTA CLARA")).isEqualTo("Santa Clara");
    }

    @Test
    @DisplayName("인구조사국 응답: x=경도, y=위도. 못 찾으면 empty")
    void censusParse() {
        JsonMapper json = JsonMapper.builder().build();
        var found = CensusGeocoder.parse(json.readTree("""
                {"result":{"addressMatches":[{"matchedAddress":"19505 BISCAYNE BLVD, AVENTURA, FL, 33180",
                  "coordinates":{"x":-80.146839,"y":25.957043}}]}}
                """));
        assertThat(found).contains(new GeoPoint(25.957043, -80.146839, GeoPoint.Precision.ADDRESS));
        assertThat(CensusGeocoder.parse(json.readTree("{\"result\":{\"addressMatches\":[]}}"))).isEmpty();
    }

    @Test
    @DisplayName("요청 주소: 정리한 주소·우편번호 5자리, URL 인코딩")
    void censusUrl() {
        assertThat(CensusGeocoder.url("ONE APPLE PARK WAY", "CUPERTINO", "CA", "95014-2083"))
                .contains("street=1+APPLE+PARK+WAY").contains("zip=95014&").contains("state=CA");
    }

    @Test
    @DisplayName("본사 위치: 정확한 주소 → 안 되면 우편번호 중심")
    void locatorFallsBackToZip() {
        GeoPoint exact = new GeoPoint(25.957, -80.147, GeoPoint.Precision.ADDRESS);
        HqLocator found = new HqLocator((s, c, st, z) -> Optional.of(exact), ZIPS);
        HqLocator notFound = new HqLocator((s, c, st, z) -> Optional.empty(), ZIPS);

        assertThat(found.locate("x", "y", "FL", "33180")).contains(exact);
        assertThat(notFound.locate("ONE APPLE PARK WAY", "CUPERTINO", "CA", "95014"))
                .get().extracting(GeoPoint::precision).isEqualTo(GeoPoint.Precision.ZIP);
        assertThat(notFound.locate("x", "y", "ZZ", null)).isEmpty();
    }
}
