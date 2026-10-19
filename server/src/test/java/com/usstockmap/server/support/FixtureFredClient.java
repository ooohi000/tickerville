package com.usstockmap.server.support;

import com.usstockmap.server.collector.fred.FredClient;
import com.usstockmap.server.collector.fred.FredObservation;
import com.usstockmap.server.collector.fred.FredObservationsParser;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import tools.jackson.databind.json.JsonMapper;

/** 저장해둔 실제 FRED 응답(src/test/resources/fred/{시리즈}.json, 2026-10-19 수집)을 start 이후만 돌려준다 */
public class FixtureFredClient implements FredClient {

    public final List<String> calls = new ArrayList<>();

    @Override
    public List<FredObservation> observations(String seriesId, LocalDate start) {
        calls.add(seriesId + ":" + start);
        return all(seriesId).stream().filter(o -> !o.date().isBefore(start)).toList();
    }

    public static List<FredObservation> all(String seriesId) {
        try (InputStream in = FixtureFredClient.class.getResourceAsStream("/fred/" + seriesId + ".json")) {
            return FredObservationsParser.parse(JsonMapper.builder().build().readTree(in));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
