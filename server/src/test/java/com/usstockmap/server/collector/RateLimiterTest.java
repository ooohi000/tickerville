package com.usstockmap.server.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RateLimiterTest {

    /** 가짜 시계: sleep 하면 시간이 그만큼 흐른다 */
    static class FakeTicker implements RateLimiter.Ticker {
        long now = 0;
        final List<Long> sleeps = new ArrayList<>();

        @Override
        public long nanoTime() {
            return now;
        }

        @Override
        public void sleepNanos(long nanos) {
            sleeps.add(nanos);
            now += nanos;
        }
    }

    @Test
    @DisplayName("초당 8회 = 125ms 간격. 몰아서 부르면 그만큼 기다린다")
    void spacesRequests() {
        FakeTicker t = new FakeTicker();
        RateLimiter limiter = new RateLimiter(8, t);

        limiter.acquire();
        limiter.acquire();
        limiter.acquire();

        assertThat(t.sleeps).containsExactly(125_000_000L, 125_000_000L);
    }

    @Test
    @DisplayName("이미 간격이 지났으면 기다리지 않는다")
    void noWaitWhenIdle() {
        FakeTicker t = new FakeTicker();
        RateLimiter limiter = new RateLimiter(8, t);

        limiter.acquire();
        t.now += 200_000_000L;
        limiter.acquire();

        assertThat(t.sleeps).isEmpty();
    }

    @Test
    @DisplayName("10초 동안 몰아서 불러도 초당 8회를 넘지 않는다")
    void neverExceedsRate() {
        FakeTicker t = new FakeTicker();
        RateLimiter limiter = new RateLimiter(8, t);
        List<Long> times = new ArrayList<>();
        for (int i = 0; i < 80; i++) {
            limiter.acquire();
            times.add(t.now);
        }
        for (int i = 8; i < times.size(); i++) {
            assertThat(times.get(i) - times.get(i - 8)).isGreaterThanOrEqualTo(1_000_000_000L);
        }
    }

    @Test
    @DisplayName("0 이하는 설정 실수")
    void rejectsZero() {
        assertThatThrownBy(() -> new RateLimiter(0)).isInstanceOf(IllegalArgumentException.class);
    }
}
