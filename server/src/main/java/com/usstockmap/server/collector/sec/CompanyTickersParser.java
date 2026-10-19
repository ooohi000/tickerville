package com.usstockmap.server.collector.sec;

import java.util.HashMap;
import java.util.Map;
import tools.jackson.databind.JsonNode;

/** company_tickers.json → 티커(대문자) → CIK 10자리. 응답: { "0": { "cik_str": 320193, "ticker": "AAPL", ... }, ... } */
public final class CompanyTickersParser {

    private CompanyTickersParser() {
    }

    public static Map<String, String> parse(JsonNode root) {
        Map<String, String> out = new HashMap<>();
        for (JsonNode row : root) {
            if (row.hasNonNull("ticker") && row.hasNonNull("cik_str")) {
                out.put(row.get("ticker").asString().toUpperCase(), toCik(row.get("cik_str").asLong()));
            }
        }
        return out;
    }

    public static String toCik(long cik) {
        return String.format("%010d", cik);
    }
}
