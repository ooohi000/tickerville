package com.usstockmap.server.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import com.usstockmap.server.common.config.QuerydslConfig;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * DB 테스트 공통 설정. JPA 슬라이스 + 진짜 PostgreSQL + Flyway(스키마 + 목데이터).
 * 각 테스트는 트랜잭션 안에서 돌고 끝나면 롤백된다. 목데이터는 Flyway가 미리 넣어 둔 상태.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@DataJpaTest(properties = "spring.flyway.locations=classpath:db/migration,classpath:db/seed")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({EmbeddedPostgresConfig.class, QuerydslConfig.class})
@ActiveProfiles("test")
public @interface DbTest {
}
