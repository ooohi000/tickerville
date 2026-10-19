import { describe, expect, it } from "vitest";
import dataset from "@/data/companies.json";
import regionsData from "@/data/regions.json";
import type { Company, CompanyDataset, Region } from "@/types";
import { assignRegions } from "./assignRegions";

const make = (ticker: string, lat: number, lng: number, marketCapUsd = 1): Company => ({
  ticker,
  name: ticker,
  sector: "tech",
  hq: { city: "", state: "CA", lat, lng },
  marketCapUsd,
  relativeVolume: 1,
});

const region = (id: string, lat: number, lng: number, radiusKm: number): Region => ({
  id,
  label: id,
  lat,
  lng,
  radiusKm,
});

const tickers = (cs: Company[]) => cs.map((c) => c.ticker);

describe("assignRegions", () => {
  it("빈 입력이면 빈 결과", () => {
    expect(assignRegions([], [])).toEqual({ groups: [], standalone: [] });
    expect(assignRegions([make("A", 0, 0)], [])).toEqual({
      groups: [],
      standalone: [make("A", 0, 0)],
    });
  });

  it("반경 안은 소속, 밖은 standalone", () => {
    // 위도 0.1도 ≈ 11.1km
    const r = region("r", 0, 0, 20);
    const result = assignRegions([make("IN", 0.1, 0), make("OUT", 0.3, 0)], [r]);
    expect(tickers(result.groups[0].companies)).toEqual(["IN"]);
    expect(tickers(result.standalone)).toEqual(["OUT"]);
  });

  it("반경 경계값은 포함", () => {
    const r = region("r", 0, 0, 0);
    const result = assignRegions([make("SAME", 0, 0)], [r]);
    expect(tickers(result.groups[0].companies)).toEqual(["SAME"]);
  });

  it("반경이 겹치면 더 가까운 지역", () => {
    const west = region("west", 0, 0, 100);
    const east = region("east", 0, 1, 100); // 경도 1도 ≈ 111km
    const result = assignRegions([make("NEAR_EAST", 0, 0.7)], [west, east]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].region.id).toBe("east");
  });

  it("기업이 없는 지역은 groups에 없다", () => {
    const result = assignRegions([make("A", 0, 0)], [region("a", 0, 0, 10), region("empty", 50, 50, 10)]);
    expect(result.groups.map((g) => g.region.id)).toEqual(["a"]);
  });

  it("2개 이상이면 클러스터, 1개면 아님 (이름표용 그룹은 유지)", () => {
    const r1 = region("one", 0, 0, 10);
    const r2 = region("two", 10, 10, 10);
    const result = assignRegions([make("A", 0, 0), make("B", 10, 10), make("C", 10, 10)], [r1, r2]);
    expect(result.groups.find((g) => g.region.id === "one")!.isCluster).toBe(false);
    expect(result.groups.find((g) => g.region.id === "two")!.isCluster).toBe(true);
  });

  it("그룹 안과 standalone 모두 시총 내림차순", () => {
    const r = region("r", 0, 0, 10);
    const result = assignRegions(
      [make("S", 0, 0, 1), make("L", 0, 0, 9), make("M", 0, 0, 5), make("X1", 40, 40, 2), make("X2", 41, 41, 8)],
      [r],
    );
    expect(tickers(result.groups[0].companies)).toEqual(["L", "M", "S"]);
    expect(tickers(result.standalone)).toEqual(["X2", "X1"]);
  });

  it("샘플 데이터: 실리콘밸리 4, 시애틀 2, 뉴욕 1", () => {
    const { companies } = dataset as CompanyDataset;
    const result = assignRegions(companies, regionsData as Region[]);
    const byId = Object.fromEntries(result.groups.map((g) => [g.region.id, g]));

    expect(tickers(byId["silicon-valley"].companies)).toEqual(["NVDA", "AAPL", "GOOGL", "META"]);
    expect(byId["silicon-valley"].isCluster).toBe(true);
    expect(tickers(byId["seattle"].companies)).toEqual(["MSFT", "AMZN"]);
    expect(byId["new-york"].isCluster).toBe(false);
    expect(tickers(result.standalone).sort()).toEqual(["KO", "PLTR", "TSLA"]);
  });
});
