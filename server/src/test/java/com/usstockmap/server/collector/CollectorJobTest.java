package com.usstockmap.server.collector;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CollectorJobTest {

    final Clock clock = Clock.fixed(Instant.parse("2026-10-19T12:00:00Z"), ZoneOffset.UTC);

    @Test
    @DisplayName("실행 → 끝나면 결과·대상·시각이 상태에 남는다")
    void runsAndRecords() {
        CollectorJob<String> job = new CollectorJob<>("sec", t -> "done " + t, Runnable::run, clock);

        assertThat(job.start(CollectorJob.Trigger.MANUAL, List.of("AAPL"))).isTrue();

        CollectorJob.Status<String> s = job.status();
        assertThat(s.name()).isEqualTo("sec");
        assertThat(s.running()).isFalse();
        assertThat(s.result()).isEqualTo("done [AAPL]");
        assertThat(s.targets()).containsExactly("AAPL");
        assertThat(s.startedAt()).isEqualTo(clock.instant());
        assertThat(s.finishedAt()).isEqualTo(clock.instant());
    }

    @Test
    @DisplayName("돌고 있는 동안 또 시작하면 거절 (스케줄과 수동이 겹쳐도 한 번만), 끝나면 다시 가능")
    void rejectsWhileRunning() {
        List<Runnable> queued = new ArrayList<>();
        Executor later = queued::add;
        CollectorJob<String> job = new CollectorJob<>("fred", t -> "ok", later, clock);

        assertThat(job.start(CollectorJob.Trigger.SCHEDULE, List.of())).isTrue();
        assertThat(job.status().running()).isTrue();
        assertThat(job.start(CollectorJob.Trigger.MANUAL, List.of())).isFalse();

        queued.getFirst().run();
        assertThat(job.start(CollectorJob.Trigger.MANUAL, List.of())).isTrue();
    }

    @Test
    @DisplayName("수집이 통째로 터져도 상태에 에러가 남고 다음 실행은 가능")
    void recordsCrash() {
        CollectorJob<String> job = new CollectorJob<>("sec", t -> {
            throw new IllegalStateException("db down");
        }, Runnable::run, clock);

        job.start(CollectorJob.Trigger.SCHEDULE, List.of());

        assertThat(job.status().error()).contains("db down");
        assertThat(job.status().running()).isFalse();
        assertThat(job.start(CollectorJob.Trigger.SCHEDULE, List.of())).isTrue();
    }
}
