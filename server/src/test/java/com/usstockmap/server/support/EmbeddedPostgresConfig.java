package com.usstockmap.server.support;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import java.io.UncheckedIOException;
import javax.sql.DataSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * 테스트용 진짜 PostgreSQL 17 (Docker 없이 바이너리로 실행).
 * 테스트 JVM 하나에 서버 하나만 띄워서 모든 DB 테스트가 같이 쓴다.
 * 주의: PostgreSQL은 root 계정으로 실행되지 않는다 (일반 사용자로 ./gradlew test).
 */
@TestConfiguration(proxyBeanMethods = false)
public class EmbeddedPostgresConfig {

    private static EmbeddedPostgres postgres;

    private static synchronized EmbeddedPostgres postgres() {
        if (postgres == null) {
            try {
                postgres = EmbeddedPostgres.builder().start();
            } catch (IOException e) {
                throw new UncheckedIOException("embedded PostgreSQL failed to start", e);
            }
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try {
                    postgres.close();
                } catch (IOException ignored) {
                    // 테스트 종료 시점이라 무시
                }
            }));
        }
        return postgres;
    }

    @Bean
    DataSource dataSource() {
        return postgres().getPostgresDatabase();
    }
}
