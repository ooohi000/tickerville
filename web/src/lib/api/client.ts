import type { ApiErrorCode } from "@/types";
import { API_PREFIX, DEFAULT_TIMEOUT_MS, resolveApiBase } from "./config";

/** 서버 응답이 실패했을 때. code 는 계약(docs/api.md) 에러 코드, 네트워크·시간 초과는 NETWORK */
export class ApiRequestError extends Error {
  constructor(
    readonly code: ApiErrorCode | "NETWORK" | "BAD_RESPONSE",
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export type Fetcher = typeof fetch;

export interface RequestOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  /** 테스트용. 기본은 실행 위치(서버/브라우저)로 판단 */
  isServer?: boolean;
  env?: Record<string, string | undefined>;
}

/** GET /api/v1{path} → JSON. 실패하면 ApiRequestError (계약 에러 모양을 읽어 code 를 채운다) */
export async function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isServer = options.isServer ?? typeof window === "undefined";
  const base = resolveApiBase(isServer, options.env ?? process.env);
  const url = `${base}${API_PREFIX}${path}`;
  const fetcher = options.fetcher ?? fetch;

  let res: Response;
  try {
    res = await fetcher(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (e) {
    throw new ApiRequestError("NETWORK", null, `${url}: ${(e as Error).message}`);
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const code = readErrorCode(body) ?? "INTERNAL_ERROR";
    throw new ApiRequestError(code, res.status, readErrorMessage(body) ?? `${res.status} ${url}`);
  }
  if (body === null) {
    throw new ApiRequestError("BAD_RESPONSE", res.status, `not JSON: ${url}`);
  }
  return body as T;
}

function readErrorCode(body: unknown): ApiErrorCode | null {
  const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
  return typeof code === "string" ? (code as ApiErrorCode) : null;
}

function readErrorMessage(body: unknown): string | null {
  const message = (body as { error?: { message?: unknown } } | null)?.error?.message;
  return typeof message === "string" ? message : null;
}
