package com.usstockmap.server.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.collector.CollectorJob;
import com.usstockmap.server.collector.CollectorJobs;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** 관리자 API: 키 보호 + 수집기 실행 */
@WebMvcTest(value = AdminCollectorController.class, properties = "app.admin.api-key=test-admin-key")
@Import(AdminCollectorControllerTest.Config.class)
@ActiveProfiles("test")
class AdminCollectorControllerTest {

    static final String KEY = "test-admin-key";

    /** 실행 요청을 기록만 하는 가짜 수집 (실행은 queued 에 쌓기만) */
    @TestConfiguration
    static class Config {
        static final List<List<String>> RECEIVED = new ArrayList<>();
        static final List<Runnable> QUEUED = new ArrayList<>();

        @Bean
        CollectorJobs jobs() {
            return new CollectorJobs(List.of(
                    new CollectorJob<>("sec", t -> {
                        RECEIVED.add(t);
                        return "ok";
                    }, QUEUED::add, Clock.systemUTC()),
                    new CollectorJob<>("fred", t -> "ok", Runnable::run, Clock.systemUTC())));
        }
    }

    @Autowired
    MockMvcTester mvc;

    @BeforeEach
    void drain() {
        Config.QUEUED.forEach(Runnable::run); // 앞 테스트에서 남은 실행 정리
        Config.QUEUED.clear();
        Config.RECEIVED.clear();
    }

    @Test
    @DisplayName("키가 없거나 틀리면 401 UNAUTHORIZED (계약 에러 모양), 실행하지 않는다")
    void requiresKey() {
        assertThat(mvc.post().uri("/api/admin/collectors/sec"))
                .hasStatus(401)
                .bodyJson().extractingPath("$.error.code").isEqualTo("UNAUTHORIZED");
        assertThat(mvc.post().uri("/api/admin/collectors/sec").header("X-Admin-Key", "wrong")).hasStatus(401);
        assertThat(Config.QUEUED).isEmpty();
    }

    @Test
    @DisplayName("키가 맞으면 202, 대상 티커는 대문자로. 응답은 캐시 금지")
    void starts() {
        assertThat(mvc.post().uri("/api/admin/collectors/sec").header("X-Admin-Key", KEY)
                .contentType(MediaType.APPLICATION_JSON).content("{\"targets\":[\" aapl \"]}"))
                .hasStatus(202)
                .hasHeader("Cache-Control", "no-store")
                .bodyJson().extractingPath("$.running").isEqualTo(true);
        Config.QUEUED.getFirst().run();
        assertThat(Config.RECEIVED).containsExactly(List.of("AAPL"));
    }

    @Test
    @DisplayName("이미 돌고 있으면 409 CONFLICT, 모르는 수집기는 400")
    void conflictAndUnknown() {
        mvc.post().uri("/api/admin/collectors/sec").header("X-Admin-Key", KEY).exchange();

        assertThat(mvc.post().uri("/api/admin/collectors/sec").header("X-Admin-Key", KEY))
                .hasStatus(409).bodyJson().extractingPath("$.error.code").isEqualTo("CONFLICT");
        assertThat(mvc.post().uri("/api/admin/collectors/nope").header("X-Admin-Key", KEY))
                .hasStatus(400).bodyJson().extractingPath("$.error.code").isEqualTo("INVALID_PARAMETER");
    }

    @Test
    @DisplayName("전체 상태 목록: sec, fred")
    void statuses() {
        assertThat(mvc.get().uri("/api/admin/collectors").header("X-Admin-Key", KEY))
                .hasStatusOk()
                .bodyJson().extractingPath("$[*].name").asArray().containsExactly("sec", "fred");
    }
}
