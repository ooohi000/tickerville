package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.time.Clock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.scheduling.config.ScheduledTaskHolder;

class SecSyncScheduleTest {

    final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(SecSyncService.class, () -> mock(SecSyncService.class))
            .withBean(Clock.class, Clock::systemUTC)
            .withPropertyValues("app.sec.sync-cron=0 15 22 * * MON-FRI")
            .withUserConfiguration(SecSyncConfig.class);

    @Test
    @DisplayName("기본(local·test)은 매일 수집 스케줄 없음 — 실행기는 있다 (수동 실행용)")
    void offByDefault() {
        runner.run(ctx -> {
            assertThat(ctx).hasSingleBean(SecSyncJob.class);
            assertThat(ctx).doesNotHaveBean(ScheduledTaskHolder.class);
        });
    }

    @Test
    @DisplayName("app.sec.schedule-enabled=true (prod) 면 평일 22:15(동부) 작업이 하나 등록된다")
    void onWhenEnabled() {
        runner.withPropertyValues("app.sec.schedule-enabled=true").run(ctx -> {
            var tasks = ctx.getBeansOfType(ScheduledTaskHolder.class).values().stream()
                    .flatMap(h -> h.getScheduledTasks().stream()).toList();
            assertThat(tasks).hasSize(1);
            assertThat(tasks.getFirst().getTask().toString()).contains("daily");
        });
    }
}
