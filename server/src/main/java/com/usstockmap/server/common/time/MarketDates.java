package com.usstockmap.server.common.time;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** 계약의 날짜는 미국 동부 기준 (docs/api.md 공통 규칙). 날짜 변환은 여기 한 곳에서만. */
public final class MarketDates {

    public static final ZoneId MARKET_ZONE = ZoneId.of("America/New_York");

    private MarketDates() {
    }

    public static LocalDate toMarketDate(Instant instant) {
        return LocalDate.ofInstant(instant, MARKET_ZONE);
    }

    public static LocalDate today(Clock clock) {
        return LocalDate.now(clock.withZone(MARKET_ZONE));
    }
}
