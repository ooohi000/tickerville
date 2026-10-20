"use client";

import { useState } from "react";
import { getClusterListView } from "@/lib/cluster/clusterList";
import { displayName, formatUsdShort } from "@/lib/company/format";
import { formatGrowth, isHighGrowth } from "@/lib/company/growth";
import { SIZE_METRICS, getSizeValue, type SizeMetricId } from "@/lib/company/sizeMetric";
import type { RegionGroup } from "@/types";
import styles from "./ClusterListPanel.module.css";
import { SidePanel } from "./SidePanel";

export interface ClusterListPanelProps {
  group: RegionGroup;
  /** 숫자 열에 보여줄 지표 = 현재 건물 높이 기준 */
  sizeMetric: SizeMetricId;
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  onClose: () => void;
}

/**
 * 지역 기업 목록 (현재 건물 높이 기준순). 모바일은 아래 시트, 넓은 화면은 오른쪽 패널.
 * 항목을 누르면 그 기업의 상세 패널을 연다 (상세에서 "← 목록"으로 돌아온다).
 */
export function ClusterListPanel({
  group,
  sizeMetric,
  selectedTicker,
  onSelect,
  onClose,
}: ClusterListPanelProps) {
  const metric = SIZE_METRICS[sizeMetric];
  const [expanded, setExpanded] = useState(false);
  const view = getClusterListView(group.companies, expanded);

  return (
    <SidePanel
      ariaLabel={`${group.region.label} 기업 목록`}
      title={
        <>
          {group.region.label} <span>{group.companies.length}개</span>
        </>
      }
      onClose={onClose}
    >
      <ol className={styles.list}>
        {view.items.map((c) => (
          <li key={c.ticker}>
            <button
              type="button"
              className={`${styles.item} ${selectedTicker === c.ticker ? styles.selected : ""}`}
              onClick={() => onSelect(c.ticker)}
            >
              <span className={styles.ticker}>{c.ticker}</span>
              <span className={styles.name}>{displayName(c)}</span>
              <span className={styles.cap} title={metric.description}>
                {formatMetric(getSizeValue(c, sizeMetric))}
                {isHighGrowth(c.revenueGrowthYoy) && (
                  <span className={styles.growth} title="매출 성장률 (최근 4분기, 전년 대비)">
                    {formatGrowth(c.revenueGrowthYoy)}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {view.remaining > 0 && (
        <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
          더보기 {view.remaining}개
        </button>
      )}
    </SidePanel>
  );
}

/** 적자는 −$5B처럼, 값 없음은 — */
function formatMetric(v: number | null): string {
  if (v === null) return "—";
  return v < 0 ? `−${formatUsdShort(-v)}` : formatUsdShort(v);
}
