import type { Company } from "@/types";
import type { TierRanges } from "./tier";

/** 건물 높이 기준. 화면 토글로 바꾼다 */
export type SizeMetricId = "revenue" | "netIncome" | "totalAssets" | "publicFloat";

export interface SizeMetric {
  id: SizeMetricId;
  /** 토글 버튼 이름 */
  label: string;
  /** 목록 패널 숫자 옆 설명 */
  description: string;
  /** 오래된 값 등 주의 문구. 없으면 null */
  note: string | null;
  getValue: (c: Company) => number | null;
  ranges: TierRanges;
}

const M = 1_000_000;
const B = 1_000_000_000;

/**
 * 지표별 설정. 등급 경계는 초안 — 실제 데이터 분포 보고 조정.
 * 새 기준을 추가할 땐 여기에 한 항목만 늘리면 토글·건물·정렬이 모두 따라온다.
 */
export const SIZE_METRICS: Readonly<Record<SizeMetricId, SizeMetric>> = {
  revenue: {
    id: "revenue",
    label: "매출",
    description: "최근 4분기 매출",
    note: null,
    getValue: (c) => c.revenueTtmUsd,
    ranges: { small: [50 * M, 1 * B], mid: [1 * B, 10 * B], large: [10 * B, 100 * B], mega: [100 * B, 1_000 * B] },
  },
  netIncome: {
    id: "netIncome",
    label: "순이익",
    description: "최근 4분기 순이익",
    note: "적자 기업은 가장 작은 건물",
    getValue: (c) => c.netIncomeTtmUsd,
    ranges: { small: [5 * M, 200 * M], mid: [200 * M, 2 * B], large: [2 * B, 20 * B], mega: [20 * B, 200 * B] },
  },
  totalAssets: {
    id: "totalAssets",
    label: "총자산",
    description: "최근 분기말 총자산",
    note: null,
    getValue: (c) => c.totalAssetsUsd,
    ranges: { small: [100 * M, 5 * B], mid: [5 * B, 50 * B], large: [50 * B, 500 * B], mega: [500 * B, 5_000 * B] },
  },
  publicFloat: {
    id: "publicFloat",
    label: "공시상 시총",
    description: "연간 공시의 유동 시가총액",
    note: "연 1회 공시 기준이라 현재 시총과 다를 수 있어요",
    getValue: (c) => c.publicFloatUsd,
    ranges: { small: [300 * M, 2 * B], mid: [2 * B, 10 * B], large: [10 * B, 200 * B], mega: [200 * B, 5_000 * B] },
  },
};

/** 토글 버튼 순서 */
export const SIZE_METRIC_ORDER: readonly SizeMetricId[] = ["revenue", "netIncome", "totalAssets", "publicFloat"];

export const DEFAULT_SIZE_METRIC: SizeMetricId = "revenue";

export function getSizeValue(company: Company, metric: SizeMetricId): number | null {
  return SIZE_METRICS[metric].getValue(company);
}
