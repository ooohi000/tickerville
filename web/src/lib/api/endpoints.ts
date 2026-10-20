import type {
  CompanyDataset,
  CompanyDetail,
  FinancialStatement,
  MarketWeather,
  Region,
} from "@/types";
import { ApiRequestError, getJson, type RequestOptions } from "./client";
import { isCompanyDataset, isMarketWeather, isRegionList } from "./guards";

/** docs/api.md 의 공개 API 하나당 함수 하나. 응답 모양이 이상하면 BAD_RESPONSE */

export async function fetchCompanies(options?: RequestOptions): Promise<CompanyDataset> {
  return checked(await getJson<unknown>("/companies", options), isCompanyDataset, "/companies");
}

export async function fetchRegions(options?: RequestOptions): Promise<Region[]> {
  return checked(await getJson<unknown>("/regions", options), isRegionList, "/regions");
}

export async function fetchMarketWeather(options?: RequestOptions): Promise<MarketWeather> {
  return checked(await getJson<unknown>("/market-weather", options), isMarketWeather, "/market-weather");
}

export async function fetchCompanyDetail(ticker: string, options?: RequestOptions): Promise<CompanyDetail> {
  return getJson<CompanyDetail>(`/companies/${encodeURIComponent(ticker)}`, options);
}

export type FinancialPeriod = "quarterly" | "annual";

export async function fetchFinancials(
  ticker: string,
  period: FinancialPeriod = "quarterly",
  limit = 8,
  options?: RequestOptions,
): Promise<FinancialStatement[]> {
  const q = new URLSearchParams({ period, limit: String(limit) });
  return getJson<FinancialStatement[]>(`/companies/${encodeURIComponent(ticker)}/financials?${q}`, options);
}

function checked<T>(body: unknown, guard: (v: unknown) => v is T, path: string): T {
  if (!guard(body)) throw new ApiRequestError("BAD_RESPONSE", 200, `unexpected shape: ${path}`);
  return body;
}
