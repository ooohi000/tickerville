"use client";

import { useState } from "react";
import { formatGrowth } from "@/lib/company/growth";
import { formatUsdKo } from "@/lib/detail/money";
import type { QuarterPoint } from "@/lib/detail/quarterChart";
import styles from "./CompanyDetailPanel.module.css";

/**
 * 최근 분기 매출·순이익 막대 (같은 단위 = 같은 축). 0 기준선에서 위·아래(적자)로.
 * 막대에 마우스·포커스를 올리면 위 줄에 그 분기 값 (기본은 최신 분기, 최신 분기는 밝게).
 */
export function QuarterBars({ points }: { points: QuarterPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const values = points.flatMap((p) => [p.revenue, p.netIncome]).filter((v): v is number => v !== null);
  if (points.length === 0 || values.length === 0) {
    return <p className={styles.muted}>분기 데이터 없음</p>;
  }

  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const pct = (v: number) => `${(Math.abs(v) / span) * 100}%`;
  const zero = `${(max / span) * 100}%`;
  const shownIndex = active ?? points.length - 1;
  const shown = points[shownIndex];

  return (
    <div className={styles.bars}>
      <p className={styles.readout} aria-live="polite">
        <span className={styles.faint}>{shown.label}</span> 매출 <b>{formatUsdKo(shown.revenue)}</b>
        {shown.revenueYoy !== null && <span className={styles.up}> {formatGrowth(shown.revenueYoy)}</span>} · 순이익{" "}
        <b className={shown.netIncome !== null && shown.netIncome < 0 ? styles.down : undefined}>
          {formatUsdKo(shown.netIncome)}
        </b>
      </p>
      <div className={styles.plot}>
        <div className={styles.zeroLine} style={{ top: zero }} />
        {points.map((p, i) => (
          <button
            type="button"
            key={p.key}
            className={i === shownIndex ? `${styles.col} ${styles.colActive}` : styles.col}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            aria-label={`${p.label} 매출 ${formatUsdKo(p.revenue)}, 순이익 ${formatUsdKo(p.netIncome)}`}
          >
            {[p.revenue, p.netIncome].map((v, k) =>
              v === null ? (
                <span key={k} className={styles.barSlot} />
              ) : (
                <span key={k} className={styles.barSlot}>
                  <span
                    className={`${styles.bar} ${k === 0 ? styles.barRevenue : styles.barProfit} ${v < 0 ? styles.barLoss : ""}`}
                    style={v >= 0 ? { bottom: `calc(100% - ${zero})`, height: pct(v) } : { top: zero, height: pct(v) }}
                  />
                </span>
              ),
            )}
          </button>
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true">
        {points.map((p, i) => (
          <span key={p.key} className={i === shownIndex ? styles.axisActive : undefined}>
            {p.label.replace(/^FY(\d\d) Q/, "$1Q")}
          </span>
        ))}
      </div>
    </div>
  );
}
