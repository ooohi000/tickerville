package com.usstockmap.server.support;

import com.usstockmap.server.collector.sec.CompanyTickersParser;
import com.usstockmap.server.collector.CollectorHttpException;
import com.usstockmap.server.collector.sec.SecClient;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * 저장해둔 실제 SEC 응답(src/test/resources/sec/)을 돌려주는 가짜 클라이언트. 네트워크 없음.
 * 파일이 없는 기업(META 등)은 SEC 404 처럼 실패한다. 호출 기록은 calls 로 확인.
 */
public class FixtureSecClient implements SecClient {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    public final List<String> calls = new ArrayList<>();
    private final Map<String, String> cikToTicker;

    public FixtureSecClient() {
        cikToTicker = CompanyTickersParser.parse(companyTickers()).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getValue, Map.Entry::getKey, (a, b) -> a));
        calls.clear();
    }

    @Override
    public JsonNode companyTickers() {
        calls.add("tickers");
        return read("/sec/company_tickers.json");
    }

    @Override
    public JsonNode submissions(String cik) {
        calls.add("submissions:" + cik);
        return read("/sec/submissions/" + tickerOf(cik) + ".json");
    }

    @Override
    public JsonNode companyFacts(String cik) {
        calls.add("companyfacts:" + cik);
        return read("/sec/companyfacts/" + tickerOf(cik) + ".json");
    }

    private String tickerOf(String cik) {
        String t = cikToTicker.get(cik);
        if (t == null) {
            throw new CollectorHttpException("not found " + cik, 404, null);
        }
        return t;
    }

    private static JsonNode read(String path) {
        try (InputStream in = FixtureSecClient.class.getResourceAsStream(path)) {
            if (in == null) {
                throw new CollectorHttpException("not found " + path, 404, null);
            }
            return JSON.readTree(in);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
