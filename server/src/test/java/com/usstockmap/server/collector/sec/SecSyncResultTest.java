package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SecSyncResultTest {

    @Test
    @DisplayName("목록 맞추기 결과: 새 등록 티커 + 등록 실패가 수집 실패보다 앞에")
    void withUniverse() {
        var sync = new SecSyncResult(List.of("AAPL"), List.of(new SecSyncResult.Failure("META", "404")));

        var merged = sync.withUniverse(List.of("NFLX"), List.of(new SecSyncResult.Failure("ZZZZ", "등록 실패: x")));

        assertThat(merged.registered()).containsExactly("NFLX");
        assertThat(merged.succeeded()).containsExactly("AAPL");
        assertThat(merged.failed()).extracting(SecSyncResult.Failure::ticker).containsExactly("ZZZZ", "META");
    }
}
