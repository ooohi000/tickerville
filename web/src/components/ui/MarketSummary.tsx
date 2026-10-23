"use client";

import { getMarketSession } from "@/lib/market/marketClock";
import { PHASE_SPECS } from "@/lib/market/format";
import { WEATHER_ICON, getWeatherSpec } from "@/lib/weather/weather";
import type { MarketWeather } from "@/types";
import { useNow } from "./useNow";

/** 작은 화면 한 줄 요약: "● 장 마감 · ☀️ 83" (자세한 건 펼치면 MarketClockBadge·MarketWeatherBadge) */
export function MarketSummary({ weather }: { weather: MarketWeather }) {
  const now = useNow();
  const w = getWeatherSpec(weather.value);
  const phase = now === null ? null : PHASE_SPECS[getMarketSession(new Date(now)).phase];
  return (
    <>
      {phase && (
        <>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: phase.color }} />
          <span>{phase.label}</span>
          <span aria-hidden="true">·</span>
        </>
      )}
      <span aria-label={`시장 날씨 ${Math.round(weather.value)} ${w.label}`}>
        {WEATHER_ICON[w.weather]} {Math.round(weather.value)}
      </span>
    </>
  );
}
