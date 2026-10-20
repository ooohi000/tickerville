import { describe, expect, it } from "vitest";
import sampleCompanies from "@/data/companies.json";
import sampleRegions from "@/data/regions.json";
import { DEFAULT_MARKET_WEATHER, SAMPLE_MAP_DATA, isUsingSample, loadMapData } from "./mapData";
import { fakeFetcher } from "./testFetcher";

const server = { isServer: true, env: {} };
const apiCompanies = { ...sampleCompanies, asOf: "2026-10-19" };

describe("loadMapData", () => {
  it("서버가 다 주면 전부 api", async () => {
    const fetcher = fakeFetcher({
      "/api/v1/companies": { body: apiCompanies },
      "/api/v1/regions": { body: sampleRegions },
      "/api/v1/market-weather": { body: { value: 82.8, asOf: "2026-10-09" } },
    });
    const data = await loadMapData({ ...server, fetcher });

    expect(data.source).toEqual({ companies: "api", regions: "api", marketWeather: "api" });
    expect(data.dataset.asOf).toBe("2026-10-19");
    expect(data.marketWeather).toEqual({ value: 82.8, asOf: "2026-10-09" });
    expect(isUsingSample(data)).toBe(false);
  });

  it("서버가 꺼져 있으면 전부 샘플 — 화면은 그대로 뜬다", async () => {
    const data = await loadMapData({ ...server, fetcher: fakeFetcher({}) });

    expect(data).toEqual(SAMPLE_MAP_DATA);
    expect(isUsingSample(data)).toBe(true);
  });

  it("시장 날씨만 아직 수집 전(503 DATA_NOT_READY)이면 기본 하늘(흐림), 나머지는 api", async () => {
    const fetcher = fakeFetcher({
      "/api/v1/companies": { body: apiCompanies },
      "/api/v1/regions": { body: sampleRegions },
      "/api/v1/market-weather": {
        status: 503,
        body: { error: { code: "DATA_NOT_READY", message: "market weather not collected yet" } },
      },
    });
    const data = await loadMapData({ ...server, fetcher });

    expect(data.marketWeather).toEqual(DEFAULT_MARKET_WEATHER);
    expect(data.source.marketWeather).toBe("default");
    expect(data.source.companies).toBe("api");
  });

  it("샘플을 돌려줘도 원본 샘플 객체는 바뀌지 않는다 (요청끼리 섞이지 않게)", async () => {
    const data = await loadMapData({ ...server, fetcher: fakeFetcher({}) });
    data.dataset.companies.pop();
    expect(SAMPLE_MAP_DATA.dataset.companies).toHaveLength(sampleCompanies.companies.length);
  });
});
