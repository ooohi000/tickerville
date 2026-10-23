import type { Company, CompanyDataset, MarketWeather, Region } from "@/types";

/**
 * 서버 응답 모양 최소 확인. 계약은 서버 테스트(WebSampleContractTest)가 지키고,
 * 여기서는 "엉뚱한 응답(HTML 오류 페이지 등)으로 화면이 깨지지 않게"만 본다.
 */
export function isCompanyDataset(v: unknown): v is CompanyDataset {
  const d = v as CompanyDataset | null;
  return !!d && typeof d.asOf === "string" && Array.isArray(d.companies) && d.companies.every(isCompany);
}

function isCompany(v: unknown): v is Company {
  const c = v as Company | null;
  return (
    !!c &&
    typeof c.ticker === "string" &&
    typeof c.name === "string" &&
    !!c.hq &&
    Number.isFinite(c.hq.lat) &&
    Number.isFinite(c.hq.lng) &&
    !!c.filings30d &&
    (c.founded == null || Number.isInteger(c.founded.year))
  );
}

export function isMarketWeather(v: unknown): v is MarketWeather {
  const w = v as MarketWeather | null;
  return !!w && Number.isFinite(w.value) && typeof w.asOf === "string";
}

export function isRegionList(v: unknown): v is Region[] {
  return (
    Array.isArray(v) &&
    v.every((r) => typeof r?.id === "string" && Number.isFinite(r?.lat) && Number.isFinite(r?.radiusKm))
  );
}
