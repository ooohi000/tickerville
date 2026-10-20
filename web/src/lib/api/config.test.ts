import { describe, expect, it } from "vitest";
import { DEFAULT_API_URL, resolveApiBase, rewriteDestination } from "./config";

describe("resolveApiBase", () => {
  it("브라우저는 같은 주소(빈 문자열) — rewrites 가 서버로 넘긴다", () => {
    expect(resolveApiBase(false, { TICKERVILLE_API_URL: "https://api.example.com" })).toBe("");
  });

  it("서버는 환경변수, 없으면 localhost:8080, 끝 슬래시 제거", () => {
    expect(resolveApiBase(true, {})).toBe(DEFAULT_API_URL);
    expect(resolveApiBase(true, { TICKERVILLE_API_URL: "  " })).toBe(DEFAULT_API_URL);
    expect(resolveApiBase(true, { TICKERVILLE_API_URL: "https://api.example.com/" })).toBe("https://api.example.com");
  });

  it("rewrites 대상은 서버 주소 + /api/v1/:path*", () => {
    expect(rewriteDestination({})).toBe("http://localhost:8080/api/v1/:path*");
  });
});
