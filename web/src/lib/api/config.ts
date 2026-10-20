/**
 * 서버(Spring) 주소. 두 가지 길:
 * - Next 서버(서버 컴포넌트·빌드)에서 부를 때: TICKERVILLE_API_URL (기본 http://localhost:8080) 로 직접
 * - 브라우저에서 부를 때: 같은 주소의 /api/v1/... → next.config 의 rewrites 가 서버로 넘겨준다 (CORS·주소 노출 없음)
 */
export const DEFAULT_API_URL = "http://localhost:8080";
export const API_PREFIX = "/api/v1";

/** 서버 컴포넌트·빌드 때 너무 오래 기다리지 않게 (서버가 꺼져 있으면 바로 샘플 데이터로) */
export const DEFAULT_TIMEOUT_MS = 3000;

export function resolveApiBase(isServer: boolean, env: Record<string, string | undefined>): string {
  if (!isServer) return "";
  const raw = env.TICKERVILLE_API_URL?.trim();
  return (raw && raw.length > 0 ? raw : DEFAULT_API_URL).replace(/\/+$/, "");
}

/** next.config rewrites 가 쓰는 대상 주소 (항상 서버 쪽 값) */
export function rewriteDestination(env: Record<string, string | undefined>): string {
  return `${resolveApiBase(true, env)}${API_PREFIX}/:path*`;
}
