import {
  MARKET_TIME_ZONE,
  NYSE_EARLY_CLOSES,
  NYSE_HOLIDAYS,
  SESSION_MINUTES,
} from "./marketCalendar";
import { addDays, fromZonedWallTime, toZonedParts, weekdayOf } from "./zonedTime";

/** 장 상태. pre=프리마켓, regular=정규장, after=애프터마켓, closed=그 외 */
export type MarketPhase = "pre" | "regular" | "after" | "closed";

export interface MarketSession {
  phase: MarketPhase;
  /** 미국 동부 오늘 날짜 */
  marketDate: string;
  /** 오늘 휴장 사유 (주말이면 "주말", 공휴일이면 이름). 거래일이면 null */
  closedReason: string | null;
  /** 오늘 조기 폐장이면 사유 */
  earlyCloseReason: string | null;
  /** 다음 상태 변화 */
  next: { phase: MarketPhase; at: Date };
}

/** 그 날(동부 날짜)이 거래일인가 */
export function isTradingDay(date: string): boolean {
  const wd = weekdayOf(date);
  return wd !== 0 && wd !== 6 && !(date in NYSE_HOLIDAYS);
}

/** 휴장 사유. 거래일이면 null */
export function closedReasonOf(date: string): string | null {
  const wd = weekdayOf(date);
  if (wd === 0 || wd === 6) return "주말";
  return NYSE_HOLIDAYS[date] ?? null;
}

/** 거래일 하루의 구간 경계 (분). 조기 폐장이면 정규장 13시, 애프터 17시 */
function boundariesOf(date: string): Array<[number, MarketPhase]> {
  const early = date in NYSE_EARLY_CLOSES;
  const close = early ? SESSION_MINUTES.earlyClose : SESSION_MINUTES.regularClose;
  const afterEnd = early ? 17 * 60 : SESSION_MINUTES.afterClose;
  return [
    [SESSION_MINUTES.preOpen, "pre"],
    [SESSION_MINUTES.regularOpen, "regular"],
    [close, "after"],
    [afterEnd, "closed"],
  ];
}

/** 다음 거래일의 프리마켓 시작 (오늘 이후) */
function nextTradingDayStart(fromDate: string): { phase: MarketPhase; at: Date } {
  let d = addDays(fromDate, 1);
  // 연휴가 아무리 길어도 2주 안에는 거래일이 있다
  for (let i = 0; i < 14 && !isTradingDay(d); i++) d = addDays(d, 1);
  return { phase: "pre", at: fromZonedWallTime(d, SESSION_MINUTES.preOpen, MARKET_TIME_ZONE) };
}

/** 지금 장 상태와 다음 변화 시각 */
export function getMarketSession(now: Date): MarketSession {
  const p = toZonedParts(now, MARKET_TIME_ZONE);
  const date = p.date;
  const minute = p.hour * 60 + p.minute;
  const closedReason = closedReasonOf(date);
  const earlyCloseReason = NYSE_EARLY_CLOSES[date] ?? null;

  if (closedReason) {
    return { phase: "closed", marketDate: date, closedReason, earlyCloseReason: null, next: nextTradingDayStart(date) };
  }

  const bounds = boundariesOf(date);
  let phase: MarketPhase = "closed";
  for (const [start, ph] of bounds) {
    if (minute >= start) phase = ph;
  }
  const upcoming = bounds.find(([start]) => start > minute);
  const next = upcoming
    ? { phase: upcoming[1], at: fromZonedWallTime(date, upcoming[0], MARKET_TIME_ZONE) }
    : nextTradingDayStart(date);

  return { phase, marketDate: date, closedReason: null, earlyCloseReason, next };
}
