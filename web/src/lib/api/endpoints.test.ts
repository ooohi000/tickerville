import { describe, expect, it } from "vitest";
import sampleCompanies from "@/data/companies.json";
import { fetchCompanies, fetchCompanyDetail, fetchFinancials, fetchMarketWeather } from "./endpoints";
import { fakeFetcher } from "./testFetcher";

const server = { isServer: true, env: {} };

describe("endpoints", () => {
  it("기업 목록: 계약 모양이면 그대로", async () => {
    const fetcher = fakeFetcher({ "/api/v1/companies": { body: sampleCompanies } });
    const data = await fetchCompanies({ ...server, fetcher });
    expect(data.companies).toHaveLength(sampleCompanies.companies.length);
  });

  it("모양이 다르면 BAD_RESPONSE (엉뚱한 응답으로 화면이 깨지지 않게)", async () => {
    const fetcher = fakeFetcher({
      "/api/v1/companies": { body: { companies: "nope" } },
      "/api/v1/market-weather": { body: { value: "x" } },
    });
    await expect(fetchCompanies({ ...server, fetcher })).rejects.toMatchObject({ code: "BAD_RESPONSE" });
    await expect(fetchMarketWeather({ ...server, fetcher })).rejects.toMatchObject({ code: "BAD_RESPONSE" });
  });

  it("상세·재무제표 경로와 쿼리 (티커는 주소용으로 인코딩)", async () => {
    const fetcher = fakeFetcher({
      "/api/v1/companies/BRK.B": { body: {} },
      "/api/v1/companies/NVDA/financials?period=annual&limit=3": { body: [] },
    });
    await fetchCompanyDetail("BRK.B", { ...server, fetcher });
    await fetchFinancials("NVDA", "annual", 3, { ...server, fetcher });
    expect(fetcher.calls).toEqual([
      "http://localhost:8080/api/v1/companies/BRK.B",
      "http://localhost:8080/api/v1/companies/NVDA/financials?period=annual&limit=3",
    ]);
  });
});
