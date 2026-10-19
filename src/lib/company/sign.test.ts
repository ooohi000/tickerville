import { describe, expect, it } from "vitest";
import dataset from "@/data/companies.json";
import regionsData from "@/data/regions.json";
import { assignRegions } from "@/lib/cluster/assignRegions";
import type { CompanyDataset, Region } from "@/types";
import { getBuildingDimensions } from "./buildingSpec";
import {
  SIGN_DETAIL_DISTANCE,
  getSignDimensions,
  getSignModes,
  isSignVisible,
} from "./sign";

const B = 1_000_000_000;

describe("getSignDimensions", () => {
  const mega = getBuildingDimensions(1_000 * B);

  it("티커가 길수록 간판이 넓다", () => {
    expect(getSignDimensions("GOOGL", mega).plateWidth).toBeGreaterThan(
      getSignDimensions("KO", mega).plateWidth,
    );
  });

  it("간판은 건물 꼭대기보다 위에 있다", () => {
    const s = getSignDimensions("NVDA", mega);
    expect(s.centerY - s.plateHeight / 2).toBeCloseTo(mega.labelY);
    expect(s.centerY).toBeGreaterThan(mega.totalHeight);
  });

  it("큰 등급일수록 간판 글자가 크다", () => {
    const small = getSignDimensions("ABC", getBuildingDimensions(1 * B));
    const big = getSignDimensions("ABC", mega);
    expect(big.fontSize).toBeGreaterThan(small.fontSize);
  });

  it("빈 티커도 판 크기가 0이 되지 않는다", () => {
    expect(getSignDimensions("", mega).plateWidth).toBeGreaterThan(0);
  });
});

describe("getSignModes", () => {
  const { companies } = dataset as CompanyDataset;
  const modes = getSignModes(assignRegions(companies, regionsData as Region[]));

  it("모든 기업에 모드가 있다", () => {
    expect(modes.size).toBe(companies.length);
  });

  it("클러스터 대표와 단독 기업은 always", () => {
    expect(modes.get("NVDA")).toBe("always"); // 실리콘밸리 대표
    expect(modes.get("MSFT")).toBe("always"); // 시애틀 대표
    expect(modes.get("TSLA")).toBe("always"); // 단독
  });

  it("1개뿐인 지역(뉴욕)은 클러스터가 아니라 always", () => {
    expect(modes.get("JPM")).toBe("always");
  });

  it("클러스터 일반 멤버는 near", () => {
    expect(modes.get("AAPL")).toBe("near");
    expect(modes.get("AMZN")).toBe("near");
  });
});

describe("isSignVisible", () => {
  it("always는 거리 상관없이 보인다", () => {
    expect(isSignVisible("always", 1000)).toBe(true);
  });

  it("near는 기준 거리 안에서만 (경계 포함)", () => {
    expect(isSignVisible("near", SIGN_DETAIL_DISTANCE)).toBe(true);
    expect(isSignVisible("near", SIGN_DETAIL_DISTANCE + 0.1)).toBe(false);
  });
});
