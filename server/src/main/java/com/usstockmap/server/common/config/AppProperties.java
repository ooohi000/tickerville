package com.usstockmap.server.common.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** application.yml의 app.* 설정 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors, Sec sec, Fred fred, Collector collector, Admin admin) {

    public record Cors(List<String> allowedOrigins) {}

    /** SEC 접근 규칙: User-Agent에 앱 이름과 연락처, 초당 10회 이하 */
    public record Sec(String userAgent, int maxRequestsPerSecond, String syncCron) {}

    /** 관리자 API 키. 비어 있으면 관리자 API 전체 차단 */
    public record Admin(String apiKey) {
        public boolean enabled() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    /** FRED API 키(무료 발급). 비어 있으면 FRED 수집은 건너뛴다 */
    public record Fred(String apiKey, String syncCron) {
        public boolean enabled() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    /** 매일 수집 스케줄 on/off (prod 에서만 켠다) */
    public record Collector(boolean scheduleEnabled) {}
}
