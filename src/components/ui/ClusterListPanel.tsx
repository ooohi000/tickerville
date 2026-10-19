"use client";

import { useState } from "react";
import { getClusterListView } from "@/lib/cluster/clusterList";
import { displayName, formatUsdShort } from "@/lib/company/format";
import type { RegionGroup } from "@/types";
import styles from "./ClusterListPanel.module.css";

export interface ClusterListPanelProps {
  group: RegionGroup;
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  onClose: () => void;
}

/**
 * 지역 기업 목록 (매출순). 모바일은 아래 시트, 넓은 화면은 오른쪽 패널.
 * 항목을 누르면 그 건물을 선택한다 (줌인은 M6).
 */
export function ClusterListPanel({ group, selectedTicker, onSelect, onClose }: ClusterListPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const view = getClusterListView(group.companies, expanded);

  return (
    <aside className={styles.panel} aria-label={`${group.region.label} 기업 목록`}>
      <header className={styles.header}>
        <h2>
          {group.region.label} <span>{group.companies.length}개</span>
        </h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
          ×
        </button>
      </header>
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
              <span className={styles.cap} title="최근 4분기 매출">
                {c.revenueTtmUsd === null ? "—" : formatUsdShort(c.revenueTtmUsd)}
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
    </aside>
  );
}
