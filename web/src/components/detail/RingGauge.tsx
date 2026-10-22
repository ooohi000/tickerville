import { getRingArc } from "@/lib/detail/gauge";
import { formatRatio } from "@/lib/detail/money";
import styles from "./CompanyDetailPanel.module.css";

const R = 34;

/** HUD 링 게이지 하나 (이익률·자기자본비율). 값이 없으면 빈 링 + — */
export function RingGauge({ label, ratio }: { label: string; ratio: number | null }) {
  const arc = getRingArc(ratio, R);
  const text = formatRatio(ratio, 0);
  return (
    <div className={styles.gauge}>
      <div className={styles.gaugeRing}>
        <svg viewBox="0 0 84 84" role="img" aria-label={`${label} ${formatRatio(ratio)}`}>
          <circle cx="42" cy="42" r={R} className={styles.gaugeTrack} />
          {arc && arc.filled > 0 && (
            <circle
              cx="42"
              cy="42"
              r={R}
              className={styles.gaugeFill}
              strokeDasharray={`${arc.filled} ${arc.circumference}`}
              transform="rotate(-90 42 42)"
            />
          )}
        </svg>
        <span className={arc?.negative ? `${styles.gaugeValue} ${styles.down}` : styles.gaugeValue}>{text}</span>
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
