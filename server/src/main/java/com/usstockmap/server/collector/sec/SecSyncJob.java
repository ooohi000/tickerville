package com.usstockmap.server.collector.sec;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * SEC 수집 실행기. 스케줄·관리자 수동 실행 모두 여기로 — 동시에 두 번 돌지 않게 (SEC 초당 제한도 지키고).
 * 수동 실행은 백그라운드로 돌리고 상태를 조회한다 (기업이 많으면 몇 분 걸림).
 * 서버를 여러 대 띄우게 되면 Redis 잠금으로 바꾼다.
 */
public class SecSyncJob {

    private static final Logger log = LoggerFactory.getLogger(SecSyncJob.class);

    public enum Trigger { SCHEDULE, MANUAL }

    /** 마지막(또는 진행 중) 실행 상태 */
    public record Status(boolean running, Trigger trigger, List<String> requestedTickers, Instant startedAt,
                         Instant finishedAt, SecSyncResult result, String error) {
        static final Status IDLE = new Status(false, null, List.of(), null, null, null, null);
    }

    private final SecSyncService service;
    private final Executor executor;
    private final Clock clock;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicReference<Status> status = new AtomicReference<>(Status.IDLE);

    public SecSyncJob(SecSyncService service, Executor executor, Clock clock) {
        this.service = service;
        this.executor = executor;
        this.clock = clock;
    }

    /**
     * 백그라운드로 시작. 이미 돌고 있으면 false.
     * @param tickers 비어 있으면 전체
     */
    public boolean start(Trigger trigger, List<String> tickers) {
        if (!running.compareAndSet(false, true)) {
            return false;
        }
        status.set(new Status(true, trigger, List.copyOf(tickers), clock.instant(), null, null, null));
        try {
            executor.execute(() -> run(trigger, tickers));
        } catch (RuntimeException e) {
            finish(null, e);
            throw e;
        }
        return true;
    }

    public Status status() {
        return status.get();
    }

    private void run(Trigger trigger, List<String> tickers) {
        log.info("SEC sync start ({}, {})", trigger, tickers.isEmpty() ? "all" : tickers);
        try {
            SecSyncResult result = tickers.isEmpty() ? service.syncAll() : service.syncTickers(tickers);
            finish(result, null);
        } catch (RuntimeException e) {
            log.error("SEC sync crashed", e);
            finish(null, e);
        }
    }

    private void finish(SecSyncResult result, RuntimeException error) {
        Status s = status.get();
        status.set(new Status(false, s.trigger(), s.requestedTickers(), s.startedAt(), clock.instant(), result,
                error == null ? null : error.toString()));
        running.set(false);
    }
}
