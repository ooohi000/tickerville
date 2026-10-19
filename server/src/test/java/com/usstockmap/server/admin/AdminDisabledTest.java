package com.usstockmap.server.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.collector.CollectorJobs;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** 관리자 키를 설정하지 않으면(기본값) 아무 키로도 못 들어간다 */
@WebMvcTest(value = AdminCollectorController.class, properties = "app.admin.api-key=")
@ActiveProfiles("test")
class AdminDisabledTest {

    @Autowired
    MockMvcTester mvc;

    @MockitoBean
    CollectorJobs jobs;

    @Test
    @DisplayName("키 미설정 = 관리자 API 꺼짐 (빈 키로도 401)")
    void disabledWithoutKey() {
        assertThat(mvc.get().uri("/api/admin/collectors").header("X-Admin-Key", "")).hasStatus(401);
        assertThat(mvc.get().uri("/api/admin/collectors").header("X-Admin-Key", "anything")).hasStatus(401);
    }
}
