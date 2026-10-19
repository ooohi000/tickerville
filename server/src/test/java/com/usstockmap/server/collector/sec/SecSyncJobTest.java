package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SecSyncJobTest {

    final SecSyncService service = mock(SecSyncService.class);
    final Clock clock = Clock.fixed(Instant.parse("2026-10-19T12:00:00Z"), ZoneOffset.UTC);

    @Test
    @DisplayName("실행 → 끝나면 결과와 시각이 상태에 남는다")
    void runsAndRecords() {
        SecSyncResult result = new SecSyncResult(List.of("AAPL"), List.of());
        when(service.syncTickers(List.of("AAPL"))).thenReturn(result);
        SecSyncJob job = new SecSyncJob(service, Runnable::run, clock);

        assertThat(job.start(SecSyncJob.Trigger.MANUAL, List.of("AAPL"))).isTrue();

        SecSyncJob.Status s = job.status();
        assertThat(s.running()).isFalse();
        assertThat(s.result()).isEqualTo(result);
        assertThat(s.startedAt()).isEqualTo(clock.instant());
        assertThat(s.finishedAt()).isEqualTo(clock.instant());
        assertThat(s.trigger()).isEqualTo(SecSyncJob.Trigger.MANUAL);
    }

    @Test
    @DisplayName("빈 목록이면 전체 수집")
    void emptyMeansAll() {
        when(service.syncAll()).thenReturn(new SecSyncResult(List.of(), List.of()));
        new SecSyncJob(service, Runnable::run, clock).start(SecSyncJob.Trigger.SCHEDULE, List.of());
        verify(service).syncAll();
    }

    @Test
    @DisplayName("돌고 있는 동안 또 시작하면 거절 (스케줄과 수동이 겹쳐도 한 번만)")
    void rejectsWhileRunning() {
        List<Runnable> queued = new ArrayList<>();
        Executor later = queued::add; // 아직 실행 안 함
        SecSyncJob job = new SecSyncJob(service, later, clock);

        assertThat(job.start(SecSyncJob.Trigger.SCHEDULE, List.of())).isTrue();
        assertThat(job.status().running()).isTrue();
        assertThat(job.start(SecSyncJob.Trigger.MANUAL, List.of("AAPL"))).isFalse();

        when(service.syncAll()).thenReturn(new SecSyncResult(List.of(), List.of()));
        queued.getFirst().run();
        assertThat(job.start(SecSyncJob.Trigger.MANUAL, List.of())).isTrue(); // 끝나면 다시 가능
    }

    @Test
    @DisplayName("수집이 통째로 터져도 상태에 에러가 남고 다음 실행은 가능")
    void recordsCrash() {
        when(service.syncAll()).thenThrow(new IllegalStateException("db down"));
        SecSyncJob job = new SecSyncJob(service, Runnable::run, clock);

        job.start(SecSyncJob.Trigger.SCHEDULE, List.of());

        assertThat(job.status().error()).contains("db down");
        assertThat(job.status().running()).isFalse();
    }
}
