package com.usstockmap.server.collector;

/**
 * 요청 사이 최소 간격을 지키는 단순 제한기 (초당 N회 = 1000/N ms 간격). 여러 스레드에서 불러도 순서대로.
 * SEC 처럼 "초당 몇 회 이하" 규칙이 있는 외부 API 공통.
 */
public class RateLimiter {

    /** 테스트에서 시간을 가짜로 바꾸기 위한 틈 */
    public interface Ticker {
        long nanoTime();

        void sleepNanos(long nanos) throws InterruptedException;

        Ticker SYSTEM = new Ticker() {
            @Override
            public long nanoTime() {
                return System.nanoTime();
            }

            @Override
            public void sleepNanos(long nanos) throws InterruptedException {
                Thread.sleep(nanos / 1_000_000, (int) (nanos % 1_000_000));
            }
        };
    }

    private final long intervalNanos;
    private final Ticker ticker;
    private long nextAllowed = Long.MIN_VALUE;

    public RateLimiter(int permitsPerSecond, Ticker ticker) {
        if (permitsPerSecond <= 0) {
            throw new IllegalArgumentException("permitsPerSecond must be > 0");
        }
        this.intervalNanos = 1_000_000_000L / permitsPerSecond;
        this.ticker = ticker;
    }

    public RateLimiter(int permitsPerSecond) {
        this(permitsPerSecond, Ticker.SYSTEM);
    }

    /** 다음 요청을 보내도 될 때까지 기다린다 */
    public synchronized void acquire() {
        long now = ticker.nanoTime();
        if (nextAllowed != Long.MIN_VALUE && now < nextAllowed) {
            try {
                ticker.sleepNanos(nextAllowed - now);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("interrupted while rate limiting", e);
            }
            now = nextAllowed;
        }
        nextAllowed = now + intervalNanos;
    }
}
