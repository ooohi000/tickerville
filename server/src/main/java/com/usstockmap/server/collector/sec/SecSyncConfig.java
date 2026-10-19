package com.usstockmap.server.collector.sec;

import java.time.Clock;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/** 수집 실행기(스레드 하나) + 매일 스케줄 (app.sec.schedule-enabled=true 일 때만, prod 프로필) */
@Configuration(proxyBeanMethods = false)
public class SecSyncConfig {

    @Bean(destroyMethod = "shutdownNow")
    ExecutorService secSyncExecutor() {
        return Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "sec-sync");
            t.setDaemon(true);
            return t;
        });
    }

    @Bean
    SecSyncJob secSyncJob(SecSyncService service, ExecutorService secSyncExecutor, Clock clock) {
        return new SecSyncJob(service, secSyncExecutor, clock);
    }

    @Configuration(proxyBeanMethods = false)
    @EnableScheduling
    @ConditionalOnProperty(prefix = "app.sec", name = "schedule-enabled", havingValue = "true")
    static class Schedule {

        private static final Logger log = LoggerFactory.getLogger(Schedule.class);
        private final SecSyncJob job;

        Schedule(SecSyncJob job) {
            this.job = job;
        }

        /** 평일 미국 동부 22:15 (EDGAR 접수 마감 뒤) — 오늘 공시까지 반영 */
        @Scheduled(cron = "${app.sec.sync-cron}", zone = "America/New_York")
        void daily() {
            if (!job.start(SecSyncJob.Trigger.SCHEDULE, java.util.List.of())) {
                log.warn("SEC sync skipped: previous run still in progress");
            }
        }
    }
}
