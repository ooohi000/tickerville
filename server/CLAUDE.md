# US Stock Map 서버 (server/) — 작업 규칙

SEC·FRED·한국수출입은행에서 매일 데이터를 모아 정리하고, 프론트에 조회 API를 내려주는 서버.
API 계약은 `../docs/api.md`가 단일 원본이다. 데이터 소스 결정은 `../docs/data-sources.md`.

## 스택 (버전 고정)
- Java 21, Spring Boot 4.1 (Spring Framework 7, Hibernate 7, **Jackson 3 = `tools.jackson.*` 패키지**)
- Gradle (Groovy DSL), Spring Data JPA + **QueryDSL 7.7 (OpenFeign 포크, `io.github.openfeign.querydsl`)**
- PostgreSQL 17 + Flyway, Redis 7
- 로컬 실행: `compose.yaml`을 Spring Boot가 자동으로 띄운다 (Docker 필요)
- 새 의존성은 이유를 말하고 허락받은 뒤 추가한다.

## 패키지 구조 (기능별)
```
com.usstockmap.server
  common/
    api/        에러 응답(ApiErrorResponse, ErrorCode, ApiException, GlobalExceptionHandler)
    config/     WebConfig(CORS·캐시 헤더), QuerydslConfig, ClockConfig, AppProperties(app.*)
    time/       MarketDates (계약 날짜 = 미국 동부)
  region/       지역 (classpath data/regions.json — 큐레이션 데이터라 DB 아님)
  company/      기업(Company)·지도용 지표(CompanySnapshot), GET /companies (상세는 다음)
  filing/       공시 목록·30일 집계 (다음)
  financial/    재무 정리 규칙 (순수): SecFact → PeriodNormalizer → FinancialStatementBuilder → MapMetricsCalculator. 개념 후보는 Metric, 규칙 버전 FinancialCalc.VERSION
  weather/      시장 날씨 지수(MarketWeather), GET /market-weather
  collector/    외부 수집기: sec/(CompanyFactsParser ✅, 클라이언트 다음), fred/, koreaexim/
```

## 코드 규칙
- **공통으로 뽑을 수 있는 건 최대한 공통으로.** 에러는 `ApiException` + `ErrorCode`로만 던지고 응답 변환은 `GlobalExceptionHandler` 한 곳.
- 응답 DTO는 `record`. 필드 이름·null 규칙은 `../docs/api.md` 그대로 (없는 값은 필드를 빼지 말고 `null`).
- 계층: Controller(얇게) → Service(규칙) → Repository(JPA, 동적 조건은 QueryDSL).
- 스키마는 Flyway만 바꾼다 (`src/main/resources/db/migration/V{번호}__{설명}.sql`). JPA는 `ddl-auto: validate`.
- 이미 적용된 V 파일은 고치지 않는다 — 바꿀 게 생기면 새 번호 파일.
- 목데이터는 `db/seed/R__*.sql` (upsert로 작성). `local` 프로필(기본)과 DB 테스트에서만 넣는다. 운영은 `prod` 프로필이라 안 들어간다.
- DB 타입 ↔ 자바: 금액 `bigint`↔`Long`, 비율·좌표 `double precision`↔`Double`, 날짜 `date`↔`LocalDate`, 시각 `timestamptz`↔`Instant`. 고정 길이 값은 `char` 대신 `varchar` + `check` (검증과 매핑을 단순하게).
- 섹터처럼 소문자 문자열 값은 enum + `AttributeConverter` (`SectorConverter`).
- 계산 규칙(매출 TTM, 공시 집계, 시장 날씨 지수)은 **순수 클래스**로 분리하고 단위 테스트를 붙인다.
- 외부 API 클라이언트는 인터페이스로 감싼다 (테스트에서 가짜로 바꿀 수 있게).

## SEC 접근 규칙 (어기면 IP 차단)
- 초당 10회 이하 (`app.sec.max-requests-per-second` = 8로 여유)
- 모든 요청에 `User-Agent: 앱이름 연락처이메일` (`app.sec.user-agent`, 이메일은 환경변수 `SEC_CONTACT_EMAIL`)
- 기간 판정은 `fy`·`fp`가 아니라 `start`·`end` 날짜로. 같은 기간은 `filed`가 최신인 값. 정기 보고서(10-K·10-Q) 값만
- 실제 응답 테스트 데이터: `src/test/resources/sec/companyfacts/{티커}.json` (`SecFixtures`). 규칙을 바꾸면 네 분기 합 = 연간 테스트가 먼저 잡는다

## 테스트
- 웹 계층은 `@WebMvcTest` 슬라이스 + `MockMvcTester` (`@ActiveProfiles("test")`)
- **테스트 메서드명은 영어, 한글 설명은 `@DisplayName`** (한글 메서드명은 환경에 따라 리포트 파일명이 깨진다)
- DB 테스트는 `@DbTest` 하나만 붙인다 (`support/`): JPA 슬라이스 + 진짜 PostgreSQL 17(zonky embedded, Docker 불필요) + Flyway(스키마+목데이터). 테스트마다 롤백
- 직접 만든 QueryDSL 리포지토리(`*QueryRepository`)는 JPA 슬라이스가 자동으로 안 올린다 → 테스트에서 `@Import`
- 단위 테스트(서비스·계산)는 스프링 없이 `mock()` + 생성자. 현재 시각은 `Clock` 빈, 날짜 변환은 `MarketDates`(미국 동부)
- `contract/WebSampleContractTest`: 서버 전체를 띄워 응답이 `web/src/data/*.json`과 같은지 확인. 응답 모양을 바꾸면 이 테스트가 먼저 깨진다
- PostgreSQL은 실패한 SQL 뒤 트랜잭션 전체가 막힌다 → 실패를 기대하는 경우는 테스트를 나누거나 `@ParameterizedTest`

## 명령어
- `./gradlew test` 테스트
- `./gradlew bootRun` 로컬 실행 (Docker로 PostgreSQL·Redis 자동)
- `./gradlew build` 빌드
