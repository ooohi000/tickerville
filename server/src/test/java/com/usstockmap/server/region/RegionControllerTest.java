package com.usstockmap.server.region;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** docs/api.md GET /api/v1/regions 계약 확인 */
@WebMvcTest(RegionController.class)
@Import(RegionCatalog.class)
@ActiveProfiles("test")
class RegionControllerTest {

    @Autowired
    MockMvcTester mvc;

    @Test
    @DisplayName("지역 목록을 계약 모양으로 내려준다")
    void returnsRegionsInContractShape() {
        var res = assertThat(mvc.get().uri("/api/v1/regions")).hasStatusOk();
        res.bodyJson().extractingPath("$[0].id").isEqualTo("silicon-valley");
        res.bodyJson().extractingPath("$[0].label").isEqualTo("실리콘밸리");
        res.bodyJson().extractingPath("$[0].lat").isEqualTo(37.4);
        res.bodyJson().extractingPath("$[0].radiusKm").isEqualTo(40.0);
        res.bodyJson().extractingPath("$[*].id").asArray().hasSize(17).contains("austin", "atlanta");
    }

    @Test
    @DisplayName("캐시 헤더는 5분 공개")
    void setsPublicFiveMinuteCache() {
        assertThat(mvc.get().uri("/api/v1/regions"))
            .hasHeader("Cache-Control", "max-age=300, public");
    }

    @Test
    @DisplayName("허용된 프론트 주소는 CORS 통과")
    void allowsConfiguredOrigin() {
        assertThat(mvc.get().uri("/api/v1/regions").header("Origin", "http://localhost:3000"))
            .hasStatusOk()
            .hasHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    }

    @Test
    @DisplayName("모르는 주소는 CORS 거부")
    void rejectsUnknownOrigin() {
        assertThat(mvc.get().uri("/api/v1/regions").header("Origin", "https://evil.example"))
            .hasStatus(403);
    }
}
