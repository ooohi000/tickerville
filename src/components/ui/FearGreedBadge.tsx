"use client";

import { getWeatherSpec } from "@/lib/weather/weather";
import type { FearGreed } from "@/types";
import styles from "./FearGreedBadge.module.css";

/** 하늘이 왜 이런 날씨인지 알려주는 작은 표시 (화면 왼쪽 위) */
export function FearGreedBadge({ data }: { data: FearGreed }) {
  const spec = getWeatherSpec(data.value);
  return (
    <div className={styles.badge} data-weather={spec.weather}>
      <span className={styles.title}>공포·탐욕</span>
      <strong className={styles.value}>{Math.round(data.value)}</strong>
      <span className={styles.label}>{spec.label}</span>
      {data.asOf && <span className={styles.asOf}>{data.asOf}</span>}
    </div>
  );
}
