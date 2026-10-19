import { describe, expect, it } from "vitest";
import type { ApiError, CompanyDataset, CompanyDetail, FinancialStatement } from "./index";

/**
 * docs/api.md 예시가 타입과 맞는지 확인한다.
 * 타입이 바뀌어 예시가 안 맞으면 `npx tsc --noEmit`에서 깨진다 → 문서도 같이 고칠 것.
 */
const financial = {
  fiscalYear: 2026,
  fiscalPeriod: "Q2",
  periodEnd: "2026-07-26",
  filedAt: "2026-08-27",
  revenue: 46_700_000_000,
  grossProfit: 33_800_000_000,
  operatingIncome: 28_400_000_000,
  netIncome: 26_400_000_000,
  epsDiluted: 1.08,
  totalAssets: 140_700_000_000,
  totalLiabilities: 40_600_000_000,
  totalEquity: 100_100_000_000,
  operatingCashFlow: 15_400_000_000,
  capitalExpenditure: 1_900_000_000,
  freeCashFlow: 13_500_000_000,
} satisfies FinancialStatement;

const dataset = {
  asOf: "2026-10-16",
  companies: [
    {
      ticker: "NVDA",
      name: "NVIDIA",
      nameKo: "엔비디아",
      sector: "tech",
      hq: { city: "Santa Clara", state: "CA", lat: 37.3707, lng: -121.9638 },
      marketCapUsd: 4_000_000_000_000,
      relativeVolume: 1.3,
      memo: null,
    },
  ],
} satisfies CompanyDataset;

const detail = {
  company: dataset.companies[0],
  profile: null,
  latestAnnual: null,
  latestQuarter: financial,
} satisfies CompanyDetail;

const error = {
  error: { code: "COMPANY_NOT_FOUND", message: "ticker XYZ not found" },
} satisfies ApiError;

describe("API 계약 예시", () => {
  it("잉여현금흐름 = 영업현금흐름 − 설비투자", () => {
    expect(financial.freeCashFlow).toBe(
      financial.operatingCashFlow - financial.capitalExpenditure,
    );
  });

  it("상세 응답의 company는 목록 항목과 같은 모양", () => {
    expect(Object.keys(detail.company).sort()).toEqual(Object.keys(dataset.companies[0]).sort());
  });

  it("에러 코드", () => {
    expect(error.error.code).toBe("COMPANY_NOT_FOUND");
  });
});
