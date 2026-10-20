import type { Fetcher } from "./client";

/** 테스트용 가짜 fetch: 경로 → 응답(상태·본문). 없는 경로는 네트워크 오류 */
export function fakeFetcher(routes: Record<string, { status?: number; body: unknown } | "network-error">): Fetcher & {
  calls: string[];
} {
  const calls: string[] = [];
  const f = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    const route = routes[path];
    if (!route || route === "network-error") throw new TypeError("fetch failed");
    return new Response(typeof route.body === "string" ? route.body : JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as Fetcher & { calls: string[] };
  f.calls = calls;
  return f;
}
