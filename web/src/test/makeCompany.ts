import type { Company } from "@/types";

/**
 * 테스트용 기업 하나. 필요한 필드만 덮어쓴다.
 * Company에 필드가 늘면 여기 기본값만 추가하면 모든 테스트가 따라온다.
 */
export function makeCompany(overrides: Partial<Company> & Pick<Company, "ticker">): Company {
  return {
    name: overrides.ticker,
    sector: "tech",
    hq: { city: "", state: "CA", lat: 0, lng: 0 },
    revenueTtmUsd: 1,
    netIncomeTtmUsd: null,
    totalAssetsUsd: null,
    operatingMarginTtm: null,
    revenueGrowthYoy: null,
    publicFloatUsd: null,
    publicFloatAsOf: null,
    filings30d: { material: 0, insider: 0 },
    ...overrides,
  };
}
