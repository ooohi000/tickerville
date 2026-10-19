package com.usstockmap.server.common.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 에러 응답이 docs/api.md 모양 {"error": {"code", "message"}} 인지 확인 */
@WebMvcTest(GlobalExceptionHandlerTest.ProbeController.class)
@Import(GlobalExceptionHandlerTest.ProbeController.class)
@ActiveProfiles("test")
class GlobalExceptionHandlerTest {

    @RestController
    static class ProbeController {
        @GetMapping("/api/v1/probe/companies/{ticker}")
        String company(@PathVariable String ticker) {
            throw ApiException.companyNotFound(ticker);
        }

        @GetMapping("/api/v1/probe/limit")
        int limit(@RequestParam int limit) {
            return limit;
        }

        @GetMapping("/api/v1/probe/boom")
        String boom() {
            throw new IllegalStateException("secret internal detail");
        }
    }

    @Autowired
    MockMvcTester mvc;

    @Test
    @DisplayName("없는 티커는 404 COMPANY NOT FOUND")
    void unknownTickerIs404() {
        assertThat(mvc.get().uri("/api/v1/probe/companies/XYZ"))
            .hasStatus(404)
            .bodyJson()
            .isEqualTo("""
                { "error": { "code": "COMPANY_NOT_FOUND", "message": "ticker XYZ not found" } }
                """);
    }

    @Test
    @DisplayName("쿼리 형식이 틀리면 400 INVALID PARAMETER")
    void malformedQueryIs400() {
        assertThat(mvc.get().uri("/api/v1/probe/limit?limit=abc"))
            .hasStatus(400)
            .bodyJson()
            .extractingPath("$.error.code")
            .isEqualTo("INVALID_PARAMETER");
    }

    @Test
    @DisplayName("쿼리가 없어도 400 INVALID PARAMETER")
    void missingQueryIs400() {
        assertThat(mvc.get().uri("/api/v1/probe/limit"))
            .hasStatus(400)
            .bodyJson()
            .extractingPath("$.error.code")
            .isEqualTo("INVALID_PARAMETER");
    }

    @Test
    @DisplayName("예상 못한 오류는 500이고 내부 정보를 숨긴다")
    void unexpectedErrorIs500WithoutDetails() {
        assertThat(mvc.get().uri("/api/v1/probe/boom"))
            .hasStatus(500)
            .bodyJson()
            .isEqualTo("""
                { "error": { "code": "INTERNAL_ERROR", "message": "internal error" } }
                """);
    }
}
