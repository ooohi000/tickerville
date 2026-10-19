package com.usstockmap.server.collector;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 수집기 실행기 (SEC·FRED·환율 공통). 스케줄·관리자 수동 실행 모두 여기로 — 같은 수집이 동시에 두 번 돌지 않게.
 * 백그라운드로 돌리고 상태를 조회한다. 서버를 여러 대 띄우게 되면 Redis 잠금으로 바꾼다.
 *
 * @param <R> 수집 결과 (SecSyncResult, FredSyncResult …)
 */
public class CollectorJob<R> {

    private static final Logger log = LoggerFactory.getLogger(CollectorJob.class);

    public enum Trigger { SCHEDULE, MANUAL }

    /** 마지막(또는 진행 중) 실행 상태. targets = 대상(티커 등), 비면 전체 */
    public record Status<R>(String name, boolean running, Trigger trigger, List<String> targets, Instant startedAt,
                            Instant finishedAt, R result, String error) {
    }

    private final String name;
    private final Function<List<String>, R> task;
    private final Executor executor;
    private final Clock clock;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicReference<Status<R>> status;

    public CollectorJob(String name, Function<List<String>, R> task, Executor executor, Clock clock) {
        this.name = name;
        this.task = task;
        this.executor = executor;
        this.clock = clock;
        this.status = new AtomicReference<>(new Status<>(name, false, null, List.of(), null, null, null, null));
    }

    /** 백그라운드로 시작. 이미 돌고 있으면 false */
    public boolean start(Trigger trigger, List<String> targets) {
        if (!running.compareAndSet(false, true)) {
            return false;
        }
        status.set(new Status<>(name, true, trigger, List.copyOf(targets), clock.instant(), null, null, null));
        try {
            executor.execute(() -> run(trigger, targets));
        } catch (RuntimeException e) {
            finish(null, e);
            throw e;
        }
        return true;
    }

    public Status<R> status() {
        return status.get();
    }

    public String name() {
        return name;
    }

    private void run(Trigger trigger, List<String> targets) {
        log.info("{} start ({}, {})", name, trigger, targets.isEmpty() ? "all" : targets);
        try {
            finish(task.apply(targets), null);
        } catch (RuntimeException e) {
            log.error("{} crashed", name, e);
            finish(null, e);
        }
    }

    private void finish(R result, RuntimeException error) {
        Status<R> s = status.get();
        status.set(new Status<>(name, false, s.trigger(), s.targets(), s.startedAt(), clock.instant(), result,
                error == null ? null : error.toString()));
        running.set(false);
    }
}
