package com.usstockmap.server.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.usstockmap.server.admin.CompanyUniverseSync;
import com.usstockmap.server.collector.fred.FredSyncService;
import com.usstockmap.server.collector.sec.SecSyncService;
import java.time.Clock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.scheduling.config.ScheduledTaskHolder;

class CollectorScheduleTest {

    final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(SecSyncService.class, () -> mock(SecSyncService.class))
            .withBean(FredSyncService.class, () -> mock(FredSyncService.class))
            .withBean(CompanyUniverseSync.class, () -> mock(CompanyUniverseSync.class))
            .withBean(Clock.class, Clock::systemUTC)
            .withPropertyValues("app.sec.sync-cron=0 15 22 * * MON-FRI", "app.fred.sync-cron=0 30 22 * * MON-FRI")
            .withUserConfiguration(CollectorConfig.class);

    @Test
    @DisplayName("기본(local·test)은 스케줄 없음 — 실행기 sec·fred 는 있다 (수동 실행용)")
    void offByDefault() {
        runner.run(ctx -> {
            assertThat(ctx.getBean(CollectorJobs.class).statuses())
                    .extracting(CollectorJob.Status::name).containsExactlyInAnyOrder("sec", "fred");
            assertThat(ctx).doesNotHaveBean(ScheduledTaskHolder.class);
        });
    }

    @Test
    @DisplayName("app.collector.schedule-enabled=true (prod) 면 SEC·FRED 매일 작업 2개")
    void onWhenEnabled() {
        runner.withPropertyValues("app.collector.schedule-enabled=true").run(ctx -> {
            var tasks = ctx.getBeansOfType(ScheduledTaskHolder.class).values().stream()
                    .flatMap(h -> h.getScheduledTasks().stream()).map(t -> t.getTask().toString()).toList();
            assertThat(tasks).hasSize(2).anyMatch(t -> t.contains("secDaily")).anyMatch(t -> t.contains("fredDaily"));
        });
    }
}
