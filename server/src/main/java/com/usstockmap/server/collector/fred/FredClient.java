package com.usstockmap.server.collector.fred;

import java.time.LocalDate;
import java.util.List;

/** FRED 공개 API. 실제는 HttpFredClient, 테스트는 저장해둔 응답 */
public interface FredClient {

    /** start 이후 관측값 (날짜 오름차순, 빈 값 "." 은 빠짐) */
    List<FredObservation> observations(String seriesId, LocalDate start);
}
