import type { Company } from "@/types";

/** 목록 패널에 처음 보여줄 개수. 나머지는 "더보기" */
export const LIST_PREVIEW_COUNT = 5;

export interface ClusterListView {
  items: Company[];
  /** 접혀 있어서 안 보이는 개수. 0이면 "더보기" 버튼 없음 */
  remaining: number;
}

/** 이미 시총순인 목록을 펼침 여부에 따라 자른다 */
export function getClusterListView(
  companies: readonly Company[],
  expanded: boolean,
  limit = LIST_PREVIEW_COUNT,
): ClusterListView {
  if (expanded || companies.length <= limit) {
    return { items: [...companies], remaining: 0 };
  }
  return { items: companies.slice(0, limit), remaining: companies.length - limit };
}
