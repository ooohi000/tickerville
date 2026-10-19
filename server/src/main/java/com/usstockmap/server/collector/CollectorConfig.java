package com.usstockmap.server.collector;

import com.usstockmap.server.collector.fred.FredSyncResult;
import com.usstockmap.server.collector.fred.FredSyncService;
import com.usstockmap.server.collector.sec.SecSyncResult;
import com.usstockmap.server.collector.sec.SecSyncService;
import java.time.Clock;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * 수집기 실행기들 + 매일 스케줄. 실행 스레드는 하나라 수집기끼리도 순서대로 돈다 (외부 API 부담 최소).
 * 스케줄은 app.collector.schedule-enabled=true 일 때만 (prod).
 */
@Configuration(proxyBeanMethods = false)
public class CollectorConfig {

    public static final String SEC = "sec";
    public static final String FRED = "fred";

    @Bean(destroyMethod = "shutdownNow")
    ExecutorService collectorExecutor() {
        return Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "collector");
            t.setDaemon(true);
            return t;
        });
    }

    @Bean
    CollectorJob<SecSyncResult> secSyncJob(SecSyncService service, ExecutorService collectorExecutor, Clock clock) {
        return new CollectorJob<>(SEC,
                tickers -> tickers.isEmpty() ? service.syncAll() : service.syncTickers(tickers),
                collectorExecutor, clock);
    }

    @Bean
    CollectorJob<FredSyncResult> fredSyncJob(FredSyncService service, ExecutorService collectorExecutor, Clock clock) {
        return new CollectorJob<>(FRED, ignored -> service.sync(), collectorExecutor, clock);
    }

    @Bean
    CollectorJobs collectorJobs(List<CollectorJob<?>> jobs) {
        return new CollectorJobs(jobs);
    }

    @Configuration(proxyBeanMethods = false)
    @EnableScheduling
    @ConditionalOnProperty(prefix = "app.collector", name = "schedule-enabled", havingValue = "true")
    static class Schedule {

        private static final Logger log = LoggerFactory.getLogger(Schedule.class);
        private final CollectorJobs jobs;

        Schedule(CollectorJobs jobs) {
            this.jobs = jobs;
        }

        /** 평일 미국 동부 22:15 (EDGAR 접수 마감 뒤) */
        @Scheduled(cron = "${app.sec.sync-cron}", zone = "America/New_York")
        void secDaily() {
            start(SEC);
        }

        /** 평일 미국 동부 22:30 (STLFSI4 는 목요일 갱신, 매일 확인해도 요청 1번) */
        @Scheduled(cron = "${app.fred.sync-cron}", zone = "America/New_York")
        void fredDaily() {
            start(FRED);
        }

        private void start(String name) {
            if (!jobs.get(name).start(CollectorJob.Trigger.SCHEDULE, List.of())) {
                log.warn("{} skipped: previous run still in progress", name);
            }
        }
    }
}
