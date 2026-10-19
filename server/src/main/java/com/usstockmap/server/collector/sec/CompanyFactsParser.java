package com.usstockmap.server.collector.sec;

import com.usstockmap.server.financial.MapMetricsCalculator;
import com.usstockmap.server.financial.Metric;
import com.usstockmap.server.financial.SecFact;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import tools.jackson.databind.JsonNode;

/**
 * SEC companyfacts JSON → 필요한 개념만 SecFact 목록으로. 순수 변환 (네트워크 없음).
 * 응답 모양: facts.{taxonomy}.{concept}.units.{unit}[] = { start?, end, val, accn, fy, fp, form, filed }
 */
public final class CompanyFactsParser {

    /** 저장할 개념. us-gaap 은 Metric 후보 전체, dei 는 공시상 시총·발행주식수 */
    public static final Map<String, Set<String>> CONCEPTS = Map.of(
            Metric.TAXONOMY, Metric.allConcepts(),
            MapMetricsCalculator.DEI, Set.of(MapMetricsCalculator.PUBLIC_FLOAT, "EntityCommonStockSharesOutstanding"));

    private CompanyFactsParser() {
    }

    public static List<SecFact> parse(JsonNode root) {
        List<SecFact> out = new ArrayList<>();
        JsonNode facts = root.path("facts");
        CONCEPTS.forEach((taxonomy, concepts) -> {
            JsonNode tax = facts.path(taxonomy);
            for (String concept : concepts) {
                JsonNode units = tax.path(concept).path("units");
                for (String unit : units.propertyNames()) {
                    for (JsonNode r : units.get(unit)) {
                        SecFact f = toFact(taxonomy, concept, unit, r);
                        if (f != null) {
                            out.add(f);
                        }
                    }
                }
            }
        });
        return out;
    }

    /** 필수 값(end·val·accn·form·filed)이 빠진 줄은 버린다 */
    private static SecFact toFact(String taxonomy, String concept, String unit, JsonNode r) {
        if (!r.hasNonNull("end") || !r.hasNonNull("val") || !r.hasNonNull("accn")
                || !r.hasNonNull("form") || !r.hasNonNull("filed")) {
            return null;
        }
        return new SecFact(
                taxonomy,
                concept,
                unit,
                r.hasNonNull("start") ? LocalDate.parse(r.get("start").asString()) : null,
                LocalDate.parse(r.get("end").asString()),
                r.get("val").decimalValue(),
                r.get("accn").asString(),
                r.get("form").asString(),
                LocalDate.parse(r.get("filed").asString()),
                r.hasNonNull("fy") ? r.get("fy").asInt() : null,
                r.hasNonNull("fp") ? r.get("fp").asString() : null);
    }
}
