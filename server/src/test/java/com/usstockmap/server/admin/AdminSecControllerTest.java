package com.usstockmap.server.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.usstockmap.server.collector.sec.SecSyncJob;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** 관리자 API: 키 보호 + 수집 실행 */
@WebMvcTest(value = AdminSecController.class, properties = "app.admin.api-key=test-admin-key")
@ActiveProfiles("test")
class AdminSecControllerTest {

    static final String KEY = "test-admin-key";

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    SecSyncJob job;

    @Test
    @DisplayName("키가 없거나 틀리면 401 UNAUTHORIZED (계약 에러 모양), 실행하지 않는다")
    void requiresKey() {
        assertThat(mvc.post().uri("/api/admin/sec-sync"))
                .hasStatus(401)
                .bodyJson().extractingPath("$.error.code").isEqualTo("UNAUTHORIZED");
        assertThat(mvc.post().uri("/api/admin/sec-sync").header("X-Admin-Key", "wrong")).hasStatus(401);
        org.mockito.Mockito.verifyNoInteractions(job);
    }

    @Test
    @DisplayName("키가 맞으면 202, 티커는 대문자로. 응답은 캐시 금지")
    void startsSync() {
        when(job.start(eq(SecSyncJob.Trigger.MANUAL), any())).thenReturn(true);
        when(job.status()).thenReturn(new SecSyncJob.Status(true, SecSyncJob.Trigger.MANUAL, List.of("AAPL"),
                Instant.parse("2026-10-19T12:00:00Z"), null, null, null));

        assertThat(mvc.post().uri("/api/admin/sec-sync").header("X-Admin-Key", KEY)
                .contentType(MediaType.APPLICATION_JSON).content("{\"tickers\":[\" aapl \"]}"))
                .hasStatus(202)
                .hasHeader("Cache-Control", "no-store")
                .bodyJson().extractingPath("$.running").isEqualTo(true);
        verify(job).start(SecSyncJob.Trigger.MANUAL, List.of("AAPL"));
    }

    @Test
    @DisplayName("본문이 없으면 전체 수집")
    void startsAllWithoutBody() {
        when(job.start(eq(SecSyncJob.Trigger.MANUAL), any())).thenReturn(true);
        when(job.status()).thenReturn(new SecSyncJob.Status(true, SecSyncJob.Trigger.MANUAL, List.of(), null, null,
                null, null));

        assertThat(mvc.post().uri("/api/admin/sec-sync").header("X-Admin-Key", KEY)).hasStatus(202);
        verify(job).start(SecSyncJob.Trigger.MANUAL, List.of());
    }

    @Test
    @DisplayName("이미 돌고 있으면 409 CONFLICT")
    void conflictWhenRunning() {
        when(job.start(any(), any())).thenReturn(false);

        assertThat(mvc.post().uri("/api/admin/sec-sync").header("X-Admin-Key", KEY))
                .hasStatus(409)
                .bodyJson().extractingPath("$.error.code").isEqualTo("CONFLICT");
    }

    @Test
    @DisplayName("공개 API(/api/v1)는 키 없이 그대로")
    void publicApiUnaffected() {
        // 이 슬라이스엔 공개 컨트롤러가 없어 404 (401 이 아니면 됨)
        assertThat(mvc.get().uri("/api/v1/regions")).hasStatus(404);
    }
}
