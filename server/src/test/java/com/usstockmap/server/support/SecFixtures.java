package com.usstockmap.server.support;

import com.usstockmap.server.collector.sec.CompanyFactsParser;
import com.usstockmap.server.financial.SecFact;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * 실제 SEC 응답(2026-10-19 수집, 필요한 개념·2019년 이후만 남김) 테스트 데이터.
 * src/test/resources/sec/companyfacts/{TICKER}.json — AAPL AMZN JPM KO NVDA PLTR TSLA
 */
public final class SecFixtures {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private SecFixtures() {
    }

    public static JsonNode companyFactsJson(String ticker) {
        String path = "/sec/companyfacts/" + ticker + ".json";
        try (InputStream in = SecFixtures.class.getResourceAsStream(path)) {
            if (in == null) {
                throw new IllegalArgumentException("no fixture: " + path);
            }
            return JSON.readTree(in);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static List<SecFact> companyFacts(String ticker) {
        return CompanyFactsParser.parse(companyFactsJson(ticker));
    }
}
