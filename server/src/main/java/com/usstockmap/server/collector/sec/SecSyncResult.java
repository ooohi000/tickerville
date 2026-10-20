package com.usstockmap.server.collector.sec;

import java.util.ArrayList;
import java.util.List;

/**
 * 수집 한 번의 결과. 실패한 기업은 이유와 함께 (다른 기업 수집은 계속).
 * registered: 이번에 universe.csv 에서 새로 등록된 티커 (티커 지정 실행이면 빈 목록)
 */
public record SecSyncResult(List<String> registered, List<String> succeeded, List<Failure> failed) {

    public SecSyncResult(List<String> succeeded, List<Failure> failed) {
        this(List.of(), succeeded, failed);
    }

    public record Failure(String ticker, String reason) {
    }

    /** 목록 맞추기 결과를 앞에 붙인다 (등록 실패도 failed 에) */
    public SecSyncResult withUniverse(List<String> newlyRegistered, List<Failure> universeFailures) {
        List<Failure> all = new ArrayList<>(universeFailures);
        all.addAll(failed);
        return new SecSyncResult(List.copyOf(newlyRegistered), succeeded, List.copyOf(all));
    }
}
