package com.usstockmap.server.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.usstockmap.server.support.EmbeddedPostgresConfig;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * 서버 전체(컨트롤러 → 서비스 → QueryDSL → 진짜 PostgreSQL + 목데이터)를 띄워서
 * 응답이 프론트 정적 파일(web/src/data/*.json)과 같은 모양·값인지 확인한다.
 * → 프론트가 파일 읽기를 API 호출로 바꿔도 화면이 그대로라는 보장.
 * 서버만 따로 빌드할 때(web 폴더 없음)는 건너뛴다.
 */
@SpringBootTest(properties = "spring.flyway.locations=classpath:db/migration,classpath:db/seed")
@AutoConfigureMockMvc
@Import(EmbeddedPostgresConfig.class)
@ActiveProfiles("test")
class WebSampleContractTest {

    static final Path WEB_DATA = Path.of("..", "web", "src", "data");
    /** 샘플 파일에는 "SAMPLE" 같은 자리표시가 들어가 있어 값 비교에서 뺀다 */
    static final Set<String> PLACEHOLDER_FIELDS = Set.of("publicFloatAsOf");

    final JsonMapper json = JsonMapper.builder().build();

    @Autowired
    MockMvcTester mvc;

    @Test
    @DisplayName("/companies 응답 = web companies.json (필드 구성과 값, 기업마다)")
    void companiesMatchWebSample() throws Exception {
        JsonNode web = readWebSample("companies.json");
        JsonNode api = json.readTree(mvc.get().uri("/api/v1/companies").exchange().getResponse().getContentAsString());

        assertThat(api.get("asOf").asString()).matches("\\d{4}-\\d{2}-\\d{2}");

        Map<String, JsonNode> apiByTicker = new HashMap<>();
        api.get("companies").forEach(c -> apiByTicker.put(c.get("ticker").asString(), c));
        assertThat(apiByTicker).hasSize(web.get("companies").size());

        for (JsonNode expected : web.get("companies")) {
            String ticker = expected.get("ticker").asString();
            JsonNode actual = apiByTicker.get(ticker);
            assertThat(actual).as(ticker).isNotNull();
            assertSameFields(ticker, expected, actual);
        }
    }

    @Test
    @DisplayName("/market-weather 응답 = web marketWeather.json (필드 구성과 값)")
    void marketWeatherMatchesWebSample() throws Exception {
        JsonNode web = readWebSample("marketWeather.json");
        JsonNode api = json.readTree(mvc.get().uri("/api/v1/market-weather").exchange().getResponse().getContentAsString());

        assertThat(fieldNames(api)).isEqualTo(fieldNames(web));
        assertThat(api.get("value").asDouble()).isEqualTo(web.get("value").asDouble());
        assertThat(api.get("asOf").asString()).matches("\\d{4}-\\d{2}-\\d{2}");
    }

    /** 웹 샘플에 있는 필드는 서버에도 전부 있고 값이 같아야 한다 (서버에만 있는 선택 필드 memo 는 허용) */
    private void assertSameFields(String path, JsonNode expected, JsonNode actual) {
        for (String field : fieldNames(expected)) {
            String at = path + "." + field;
            assertThat(actual.has(field)).as(at + " 필드가 없음").isTrue();
            if (PLACEHOLDER_FIELDS.contains(field)) {
                continue;
            }
            JsonNode e = expected.get(field);
            JsonNode a = actual.get(field);
            if (e.isObject()) {
                assertSameFields(at, e, a);
            } else if (e.isNumber()) {
                assertThat(a.isNumber()).as(at).isTrue();
                assertThat(a.decimalValue()).as(at).isEqualByComparingTo(e.decimalValue());
            } else {
                assertThat(a).as(at).isEqualTo(e);
            }
        }
    }

    private static Set<String> fieldNames(JsonNode node) {
        Set<String> names = new java.util.TreeSet<>();
        Iterator<String> it = node.propertyNames().iterator();
        it.forEachRemaining(names::add);
        return names;
    }

    private JsonNode readWebSample(String file) throws Exception {
        Path path = WEB_DATA.resolve(file);
        assumeTrue(Files.exists(path), "web 폴더가 없어 건너뜀: " + path);
        return json.readTree(Files.readString(path));
    }
}
