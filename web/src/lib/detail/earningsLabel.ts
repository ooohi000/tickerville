import { MARKET_TIME_ZONE } from "@/lib/market/marketCalendar";
import { toZonedParts } from "@/lib/market/zonedTime";
import type { EarningsSummary, EarningsTiming } from "@/types";

export const TIMING_LABEL_KO: Readonly<Record<EarningsTiming, string>> = {
  BMO: "장 시작 전",
  DURING: "장중",
  AMC: "장 마감 후",
};

/** 한국에서 볼 때 언제쯤인지 (미국 동부 기준 발표 → 한국 시간). 서머타임과 무관하게 대략 맞는 표현 */
export const TIMING_KOREA_HINT: Readonly<Record<EarningsTiming, string>> = {
  BMO: "한국 시간 당일 밤",
  DURING: "한국 시간 밤~새벽",
  AMC: "한국 시간 다음 날 아침",
};

/** 미국 동부 기준 오늘부터 date 까지 남은 날 (지났으면 음수) */
export function daysUntil(date: string, now: Date): number {
  const today = toZonedParts(now, MARKET_TIME_ZONE).date;
  return Math.round((toUtcDay(date) - toUtcDay(today)) / 86_400_000);
}

function toUtcDay(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 0 → "D-day", 3 → "D-3", −1 → "D+1" */
export function formatDday(days: number): string {
  if (days === 0) return "D-day";
  return days > 0 ? `D-${days}` : `D+${-days}`;
}

/** "2026-11-18" → "11월 18일". 올해가 아니면 "2027년 1월 28일" */
export function formatKoreanDate(date: string, now: Date): string {
  const [y, m, d] = date.split("-").map(Number);
  const thisYear = toZonedParts(now, MARKET_TIME_ZONE).year;
  return `${y === thisYear ? "" : `${y}년 `}${m}월 ${d}일`;
}

export interface NextEarningsLabel {
  date: string; // "11월 18일"
  /** "D-29". 날짜가 지났는데 아직 다음 값이 갱신되지 않았으면 null */
  dday: string | null;
  /** "예상"(추정치, 계약상 표시 필수) · "확정" · "발표 확인 중"(날짜 지남) */
  status: string;
  /** 한 줄: "11월 18일 · D-29 · 예상" */
  text: string;
}

export function describeNextEarnings(next: EarningsSummary["next"], now: Date): NextEarningsLabel | null {
  if (!next) return null;
  const date = formatKoreanDate(next.date, now);
  const days = daysUntil(next.date, now);
  if (days < 0) {
    return { date, dday: null, status: "발표 확인 중", text: `${date} · 발표 확인 중` };
  }
  const dday = formatDday(days);
  const status = next.status === "CONFIRMED" ? "확정" : "예상";
  return { date, dday, status, text: `${date} · ${dday} · ${status}` };
}

export interface LastEarningsLabel {
  date: string;
  timing: string | null; // "장 마감 후"
  koreaHint: string | null; // "한국 시간 다음 날 아침"
  /** "8월 26일 · 장 마감 후" */
  text: string;
}

export function describeLastEarnings(last: EarningsSummary["lastReported"], now: Date): LastEarningsLabel | null {
  if (!last) return null;
  const date = formatKoreanDate(last.date, now);
  const timing = last.timing ? TIMING_LABEL_KO[last.timing] : null;
  return {
    date,
    timing,
    koreaHint: last.timing ? TIMING_KOREA_HINT[last.timing] : null,
    text: timing ? `${date} · ${timing}` : date,
  };
}
