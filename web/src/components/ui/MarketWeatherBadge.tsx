"use client";

import { getWeatherSpec } from "@/lib/weather/weather";
import type { MarketWeather } from "@/types";
import styles from "./MarketWeatherBadge.module.css";

/** 하늘이 왜 이런 날씨인지 알려주는 작은 표시 (화면 왼쪽 위) */
export function MarketWeatherBadge({ data }: { data: MarketWeather }) {
  const spec = getWeatherSpec(data.value);
  return (
    <div className={styles.badge} data-weather={spec.weather}>
      <span className={styles.title}>시장 날씨</span>
      <strong className={styles.value}>{Math.round(data.value)}</strong>
      <span className={styles.label}>{spec.label}</span>
      {data.asOf && <span className={styles.asOf}>{data.asOf}</span>}
    </div>
  );
}
