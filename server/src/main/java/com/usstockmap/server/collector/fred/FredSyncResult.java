package com.usstockmap.server.collector.fred;

import java.time.LocalDate;

/** FRED 수집 결과: 받은 관측값 수, 다시 계산한 시장 날씨 주 수, 최신 값 */
public record FredSyncResult(String seriesId, int fetched, int weatherWeeks, LocalDate latestAsOf,
                             Double latestValue, String skippedReason) {

    static FredSyncResult skipped(String reason) {
        return new FredSyncResult(null, 0, 0, null, null, reason);
    }
}
