/** 상세 패널 숫자 표시. 값이 없으면 모두 "—" */
export const EMPTY = "—";

const MINUS = "−";
const n = (v: number) => v.toLocaleString("en-US");

function usable(v: number | null | undefined): v is number {
  return v !== null && v !== undefined && Number.isFinite(v);
}

/**
 * 달러 금액을 한국식 단위로: "4,668억 달러", "3조 8,400억 달러", "3,500만 달러", 손실은 "−120억 달러".
 * 1조 이상은 억 자리를 100억 단위로 반올림해 너무 길어지지 않게 한다.
 */
export function formatUsdKo(usd: number | null | undefined): string {
  if (!usable(usd)) return EMPTY;
  const sign = usd < 0 ? MINUS : "";
  const a = Math.abs(usd);
  return `${sign}${koreanAmount(a)} 달러`;
}

function koreanAmount(a: number): string {
  if (a >= 1e12 - 5e9) {
    let jo = Math.floor(a / 1e12);
    let eok = Math.round((a - jo * 1e12) / 1e10) * 100;
    if (eok >= 10000) {
      jo += 1;
      eok = 0;
    }
    return eok ? `${n(jo)}조 ${n(eok)}억` : `${n(jo)}조`;
  }
  if (a >= 1e8 - 5e3) {
    const eok = Math.round(a / 1e8);
    return eok >= 10000 ? "1조" : `${n(eok)}억`;
  }
  if (a >= 1e4) {
    const man = Math.round(a / 1e4);
    return man >= 10000 ? "1억" : `${n(man)}만`;
  }
  return n(Math.round(a));
}

/** 주당 금액(EPS): "$2.34", "−$0.12" */
export function formatPerShare(usd: number | null | undefined): string {
  if (!usable(usd)) return EMPTY;
  return `${usd < 0 ? MINUS : ""}$${Math.abs(usd).toFixed(2)}`;
}

/** 비율(0.253) → "25.3%". 이익률·부채비율 공통 */
export function formatRatio(ratio: number | null | undefined, digits = 1): string {
  if (!usable(ratio)) return EMPTY;
  const text = (Math.abs(ratio) * 100).toFixed(digits);
  return `${ratio < 0 && Number(text) !== 0 ? MINUS : ""}${text}%`;
}
