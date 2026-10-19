import { describe, expect, it } from "vitest";
import dataset from "@/data/companies.json";
import regionsData from "@/data/regions.json";
import type { CompanyDataset, Region } from "@/types";
import { assignRegions } from "./assignRegions";
import {
  DETAIL_DISTANCE,
  getHiddenCounts,
  getVisibilityModes,
  isExpanded,
  isVisibleAt,
} from "./visibility";

const { companies } = dataset as CompanyDataset;
const assignment = assignRegions(companies, regionsData as Region[]);

describe("getVisibilityModes", () => {
  const modes = getVisibilityModes(assignment);

  it("모든 기업에 모드가 있다", () => {
    expect(modes.size).toBe(companies.length);
  });

  it("클러스터 대표와 단독 기업은 always", () => {
    expect(modes.get("NVDA")).toBe("always");
    expect(modes.get("MSFT")).toBe("always");
    expect(modes.get("TSLA")).toBe("always");
  });

  it("1개뿐인 지역(뉴욕)은 클러스터가 아니라 always", () => {
    expect(modes.get("JPM")).toBe("always");
  });

  it("클러스터 일반 멤버는 near", () => {
    expect(modes.get("AAPL")).toBe("near");
    expect(modes.get("AMZN")).toBe("near");
  });
});

describe("isVisibleAt / isExpanded", () => {
  it("always는 거리 상관없이 보인다", () => {
    expect(isVisibleAt("always", 1000)).toBe(true);
  });

  it("near는 펼쳐진 거리 안에서만 (경계 포함)", () => {
    expect(isVisibleAt("near", DETAIL_DISTANCE)).toBe(true);
    expect(isVisibleAt("near", DETAIL_DISTANCE + 0.1)).toBe(false);
    expect(isExpanded(DETAIL_DISTANCE + 0.1)).toBe(false);
  });
});

describe("getHiddenCounts", () => {
  const counts = getHiddenCounts(assignment);

  it("클러스터 대표에만 숨은 개수가 붙는다", () => {
    expect(counts.get("NVDA")).toBe(3);
    expect(counts.get("MSFT")).toBe(1);
  });

  it("멤버, 단독 기업, 1개뿐인 지역에는 없다", () => {
    expect(counts.has("AAPL")).toBe(false);
    expect(counts.has("TSLA")).toBe(false);
    expect(counts.has("JPM")).toBe(false);
  });
});
