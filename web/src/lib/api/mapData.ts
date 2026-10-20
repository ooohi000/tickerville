import sampleCompanies from "@/data/companies.json";
import sampleWeather from "@/data/marketWeather.json";
import sampleRegions from "@/data/regions.json";
import type { CompanyDataset, MarketWeather, Region } from "@/types";
import { ApiRequestError, type RequestOptions } from "./client";
import { fetchCompanies, fetchMarketWeather, fetchRegions } from "./endpoints";

/**
 * 지도 첫 화면에 필요한 데이터 한 묶음. 서버가 꺼져 있어도 화면이 뜨게 각각 따로 대체한다.
 * - companies·regions: 실패하면 번들된 샘플 JSON
 * - marketWeather: 아직 수집 전(503 DATA_NOT_READY)이면 기본 하늘(흐림 50), 그 외 실패는 샘플
 */
export type DataSource = "api" | "sample" | "default";

export interface MapData {
  dataset: CompanyDataset;
  regions: Region[];
  marketWeather: MarketWeather;
  source: { companies: DataSource; regions: DataSource; marketWeather: DataSource };
}

/** 시장 날씨를 아직 모를 때의 하늘 (구간 45~55 = 흐림, 계약 checklist "503이면 기본 하늘") */
export const DEFAULT_MARKET_WEATHER: MarketWeather = { value: 50, asOf: "" };

export const SAMPLE_MAP_DATA: MapData = {
  dataset: sampleCompanies as CompanyDataset,
  regions: sampleRegions as Region[],
  marketWeather: sampleWeather as MarketWeather,
  source: { companies: "sample", regions: "sample", marketWeather: "sample" },
};

export async function loadMapData(options?: RequestOptions): Promise<MapData> {
  const [companies, regions, weather] = await Promise.allSettled([
    fetchCompanies(options),
    fetchRegions(options),
    fetchMarketWeather(options),
  ]);

  const out: MapData = structuredClone(SAMPLE_MAP_DATA);
  if (companies.status === "fulfilled") {
    out.dataset = companies.value;
    out.source.companies = "api";
  }
  if (regions.status === "fulfilled") {
    out.regions = regions.value;
    out.source.regions = "api";
  }
  if (weather.status === "fulfilled") {
    out.marketWeather = weather.value;
    out.source.marketWeather = "api";
  } else if (isDataNotReady(weather.reason)) {
    out.marketWeather = DEFAULT_MARKET_WEATHER;
    out.source.marketWeather = "default";
  }
  return out;
}

/** 화면에 "샘플 데이터" 안내를 띄울지 (기업 목록이 샘플이면) */
export function isUsingSample(data: MapData): boolean {
  return data.source.companies !== "api";
}

function isDataNotReady(e: unknown): boolean {
  return e instanceof ApiRequestError && e.code === "DATA_NOT_READY";
}
