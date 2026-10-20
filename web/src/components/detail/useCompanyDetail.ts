"use client";

import { useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { fetchCompanyDetail, fetchFinancials } from "@/lib/api/endpoints";
import type { CompanyDetail, FinancialStatement } from "@/types";

export type CompanyDetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: CompanyDetail; quarters: FinancialStatement[] };

/** 분기 차트에 쓸 개수 (YoY 계산용으로 1년 더) */
const QUARTER_LIMIT = 12;

/**
 * 상세 패널 데이터: 기본 정보 + 최근 분기 재무제표. 브라우저에서 /api/v1 (rewrites → 서버)로 부른다.
 * 티커가 바뀌면 이전 결과는 버린다.
 */
export function useCompanyDetail(ticker: string): CompanyDetailState {
  const [state, setState] = useState<{ ticker: string; value: CompanyDetailState }>({
    ticker,
    value: { status: "loading" },
  });

  useEffect(() => {
    let cancelled = false;
    const options = { isServer: false };
    Promise.all([fetchCompanyDetail(ticker, options), fetchFinancials(ticker, "quarterly", QUARTER_LIMIT, options)])
      .then(([detail, quarters]) => {
        if (!cancelled) setState({ ticker, value: { status: "ready", detail, quarters } });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ ticker, value: { status: "error", message: errorMessage(e) } });
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  // 티커가 막 바뀐 첫 렌더에는 이전 기업 값 대신 로딩
  return state.ticker === ticker ? state.value : { status: "loading" };
}

function errorMessage(e: unknown): string {
  if (e instanceof ApiRequestError) {
    if (e.code === "NETWORK") return "서버에 연결할 수 없어요. 샘플 화면에서는 상세 정보가 없어요.";
    if (e.code === "COMPANY_NOT_FOUND") return "아직 등록되지 않은 기업이에요.";
  }
  return "상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
}
