"use client";

import { useState } from "react";
import { formatGrowth } from "@/lib/company/growth";
import { formatUsdKo } from "@/lib/detail/money";
import { getChartRange, type QuarterPoint } from "@/lib/detail/quarterChart";
import styles from "./CompanyDetailPanel.module.css";

const W = 288;
const H = 96;
const LABEL_H = 14;
const GAP = 2;
const RADIUS = 4;

export interface QuarterBarsProps {
  title: string;
  points: QuarterPoint[];
  field: "revenue" | "netIncome";
  color: string;
  /** 음수 막대 색 (적자). 없으면 color */
  negativeColor?: string;
}

/**
 * 분기 막대 하나짜리 차트 (한 지표 = 한 차트, 축 하나). 0 기준선에서 위·아래로.
 * 막대에 마우스·포커스를 올리면 위 줄에 그 분기 값이 나온다 (기본은 최신 분기).
 */
export function QuarterBars({ title, points, field, color, negativeColor = color }: QuarterBarsProps) {
  const [active, setActive] = useState<number | null>(null);
  const range = getChartRange(points, field);
  if (!range || points.length === 0) {
    return (
      <section className={styles.chart}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.muted}>데이터 없음</p>
      </section>
    );
  }

  const shown = points[active ?? points.length - 1];
  const plotH = H - LABEL_H;
  const span = range.max - range.min || 1;
  const y = (v: number) => ((range.max - v) / span) * plotH;
  const zeroY = y(0);
  const slot = W / points.length;
  const barW = Math.max(4, slot - GAP * 2);
  const value = shown[field];

  return (
    <section className={styles.chart}>
      <div className={styles.chartHead}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.readout} aria-live="polite">
          <span className={styles.muted}>{shown.label}</span> <strong>{formatUsdKo(value)}</strong>
          {field === "revenue" && shown.revenueYoy !== null && (
            <span className={styles.muted}> · 전년 대비 {formatGrowth(shown.revenueYoy)}</span>
          )}
          {field === "netIncome" && value !== null && value < 0 && <span className={styles.loss}> 적자</span>}
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`${title} 최근 ${points.length}분기`}>
        <line x1={0} x2={W} y1={zeroY} y2={zeroY} className={styles.baseline} />
        {points.map((p, i) => {
          const v = p[field];
          const x = i * slot + GAP;
          const isActive = (active ?? points.length - 1) === i;
          const bar =
            v === null ? null : (
              <path
                d={barPath(x, barW, zeroY, y(v), RADIUS)}
                fill={v < 0 ? negativeColor : color}
                opacity={isActive ? 1 : 0.55}
              />
            );
          return (
            <g
              key={p.key}
              tabIndex={0}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
              aria-label={`${p.label} ${formatUsdKo(v)}`}
            >
              {/* 막대보다 넓은 투명 영역 = 마우스 잡기 쉬운 칸 */}
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              {bar}
              <text x={x + barW / 2} y={H - 3} textAnchor="middle" className={styles.axisLabel}>
                {p.label.replace(/^FY(\d\d) /, "$1")}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

/** 0 기준선에서 값 쪽 끝만 둥근 막대 (위로든 아래로든) */
function barPath(x: number, w: number, zeroY: number, valueY: number, r: number): string {
  const h = Math.abs(zeroY - valueY);
  const rr = Math.min(r, h, w / 2);
  if (valueY <= zeroY) {
    // 위로: 위쪽 모서리 둥글게
    return `M${x},${zeroY} V${valueY + rr} Q${x},${valueY} ${x + rr},${valueY} H${x + w - rr} Q${x + w},${valueY} ${x + w},${valueY + rr} V${zeroY} Z`;
  }
  return `M${x},${zeroY} V${valueY - rr} Q${x},${valueY} ${x + rr},${valueY} H${x + w - rr} Q${x + w},${valueY} ${x + w},${valueY - rr} V${zeroY} Z`;
}
