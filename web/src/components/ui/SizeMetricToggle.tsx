"use client";

import { SIZE_METRICS, SIZE_METRIC_ORDER, type SizeMetricId } from "@/lib/company/sizeMetric";
import styles from "./SizeMetricToggle.module.css";

export interface SizeMetricToggleProps {
  value: SizeMetricId;
  onChange: (id: SizeMetricId) => void;
}

/** "건물 높이 기준" 선택. 지표 목록은 SIZE_METRICS 설정에서 자동으로 만든다 */
export function SizeMetricToggle({ value, onChange }: SizeMetricToggleProps) {
  const note = SIZE_METRICS[value].note;
  return (
    <div className={styles.wrap}>
      <div className={styles.group} role="radiogroup" aria-label="건물 높이 기준">
        <span className={styles.title}>건물 높이</span>
        {SIZE_METRIC_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            className={`${styles.option} ${value === id ? styles.active : ""}`}
            onClick={() => onChange(id)}
          >
            {SIZE_METRICS[id].label}
          </button>
        ))}
      </div>
      {note && <p className={styles.note}>{note}</p>}
    </div>
  );
}
