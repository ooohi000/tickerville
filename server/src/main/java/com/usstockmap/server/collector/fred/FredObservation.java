package com.usstockmap.server.collector.fred;

import java.math.BigDecimal;
import java.time.LocalDate;

/** FRED 시리즈 관측값 하나 (macro_observation 한 줄) */
public record FredObservation(LocalDate date, BigDecimal value) {
}
