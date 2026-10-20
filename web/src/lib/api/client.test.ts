import { describe, expect, it } from "vitest";
import { ApiRequestError, getJson } from "./client";
import { fakeFetcher } from "./testFetcher";

const server = { isServer: true, env: {} };

describe("getJson", () => {
  it("서버에서는 localhost:8080/api/v1 + 경로", async () => {
    const fetcher = fakeFetcher({ "/api/v1/regions": { body: [] } });
    await getJson("/regions", { ...server, fetcher });
    expect(fetcher.calls).toEqual(["http://localhost:8080/api/v1/regions"]);
  });

  it("브라우저에서는 같은 주소 /api/v1 + 경로", async () => {
    const fetcher = fakeFetcher({ "/api/v1/regions": { body: [] } });
    await getJson("/regions", { isServer: false, fetcher });
    expect(fetcher.calls).toEqual(["/api/v1/regions"]);
  });

  it("계약 에러 모양이면 code·status·message 를 그대로", async () => {
    const fetcher = fakeFetcher({
      "/api/v1/companies/ZZZZ": {
        status: 404,
        body: { error: { code: "COMPANY_NOT_FOUND", message: "ticker ZZZZ not found" } },
      },
    });
    const err = await getJson("/companies/ZZZZ", { ...server, fetcher }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err).toMatchObject({ code: "COMPANY_NOT_FOUND", status: 404, message: "ticker ZZZZ not found" });
  });

  it("서버가 꺼져 있으면 NETWORK", async () => {
    const err = await getJson("/companies", { ...server, fetcher: fakeFetcher({}) }).catch((e) => e);
    expect(err).toMatchObject({ code: "NETWORK", status: null });
  });

  it("JSON 이 아닌 실패 응답은 INTERNAL_ERROR, JSON 이 아닌 성공 응답은 BAD_RESPONSE", async () => {
    const fetcher = fakeFetcher({
      "/api/v1/a": { status: 502, body: "<html>Bad Gateway</html>" },
      "/api/v1/b": { status: 200, body: "<html>ok?</html>" },
    });
    await expect(getJson("/a", { ...server, fetcher })).rejects.toMatchObject({ code: "INTERNAL_ERROR", status: 502 });
    await expect(getJson("/b", { ...server, fetcher })).rejects.toMatchObject({ code: "BAD_RESPONSE" });
  });

  it("응답이 늦으면 시간 초과로 NETWORK", async () => {
    const slow = (async (_: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("timeout", "TimeoutError")));
      })) as typeof fetch;
    await expect(getJson("/companies", { ...server, fetcher: slow, timeoutMs: 20 })).rejects.toMatchObject({
      code: "NETWORK",
    });
  });
});
