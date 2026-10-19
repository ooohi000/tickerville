package com.usstockmap.server.common.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** application.yml의 app.* 설정 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors, Sec sec, Admin admin, Fred fred) {

    public record Cors(List<String> allowedOrigins) {}

    /** SEC 접근 규칙: User-Agent에 앱 이름과 연락처, 초당 10회 이하 */
    public record Sec(String userAgent, int maxRequestsPerSecond, boolean scheduleEnabled, String syncCron) {}

    /** 관리자 API 키. 비어 있으면 관리자 API 전체 차단 */
    public record Admin(String apiKey) {
        public boolean enabled() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    public record Fred(String apiKey) {}
}
