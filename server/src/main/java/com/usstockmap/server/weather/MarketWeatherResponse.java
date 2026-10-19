package com.usstockmap.server.weather;

import java.time.LocalDate;

/** 계약 `MarketWeather` (web/src/data/marketWeather.json 과 같은 모양). 0~100, 높을수록 안정. */
public record MarketWeatherResponse(double value, LocalDate asOf) {

    public static MarketWeatherResponse from(MarketWeather w) {
        return new MarketWeatherResponse(w.getValue(), w.getAsOf());
    }
}
