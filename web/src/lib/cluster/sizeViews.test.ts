import { describe, expect, it } from "vitest";
import dataset from "@/data/companies.json";
import regions from "@/data/regions.json";
import { SIZE_METRIC_ORDER } from "@/lib/company/sizeMetric";
import type { CompanyDataset, Region } from "@/types";
import { buildSizeViews } from "./sizeViews";

const { companies } = dataset as CompanyDataset;

describe("buildSizeViews", () => {
  it("높이 기준마다 묶음 결과가 있고, 모든 기업의 표시 방식이 정해진다", () => {
    const views = buildSizeViews(companies, regions as Region[]);
    expect(Object.keys(views).sort()).toEqual([...SIZE_METRIC_ORDER].sort());
    for (const id of SIZE_METRIC_ORDER) {
      expect(views[id].visibilityModes.size).toBe(companies.length);
    }
  });

  it("기업이 없어도 깨지지 않는다 (수집 전 서버)", () => {
    const views = buildSizeViews([], regions as Region[]);
    for (const id of SIZE_METRIC_ORDER) {
      expect(views[id].visibilityModes.size).toBe(0);
    }
  });
});
