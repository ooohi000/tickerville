package com.usstockmap.server.collector.fred;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import tools.jackson.databind.JsonNode;

/** FRED series/observations JSON → 관측값. 값이 "." (발표 안 됨)인 날은 버린다 */
public final class FredObservationsParser {

    private FredObservationsParser() {
    }

    public static List<FredObservation> parse(JsonNode root) {
        List<FredObservation> out = new ArrayList<>();
        for (JsonNode o : root.path("observations")) {
            String date = o.path("date").asString(null);
            String value = o.path("value").asString(null);
            if (date == null || value == null || value.isBlank() || value.equals(".")) {
                continue;
            }
            try {
                out.add(new FredObservation(LocalDate.parse(date), new BigDecimal(value)));
            } catch (RuntimeException ignored) {
                // 숫자가 아닌 값은 건너뛴다
            }
        }
        out.sort(Comparator.comparing(FredObservation::date));
        return out;
    }
}
