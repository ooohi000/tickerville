package com.usstockmap.server.collector.sec;

import java.util.List;

/** 수집 한 번의 결과. 실패한 기업은 이유와 함께 (다른 기업 수집은 계속) */
public record SecSyncResult(List<String> succeeded, List<Failure> failed) {

    public record Failure(String ticker, String reason) {
    }
}
