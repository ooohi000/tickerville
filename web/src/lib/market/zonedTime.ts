/** 시간대 변환. 브라우저·Node 내장 Intl 만 쓴다 (라이브러리 없음). 서머타임 자동 반영. */

export interface ZonedParts {
  year: number;
  month: number; // 1~12
  day: number;
  hour: number; // 0~23
  minute: number;
  /** 0=일 ~ 6=토 */
  weekday: number;
  /** "YYYY-MM-DD" */
  date: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** 순간(Date) → 그 시간대의 벽시계 값 */
export function toZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts: Record<string, string> = {};
  for (const p of formatterFor(timeZone).formatToParts(instant)) parts[p.type] = p.value;
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return {
    year,
    month,
    day,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/** 그 시간대의 "YYYY-MM-DD 몇 분째" 벽시계 → 순간(Date). 서머타임 경계는 두 번 보정 */
export function fromZonedWallTime(date: string, minuteOfDay: number, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, 0, minuteOfDay);
  let guess = wallAsUtc;
  for (let i = 0; i < 2; i++) {
    const p = toZonedParts(new Date(guess), timeZone);
    const shownAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wallAsUtc - shownAsUtc;
  }
  return new Date(guess);
}

/** "YYYY-MM-DD" 에 n일 더하기 (달력 날짜만, 시간대 무관) */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" 의 요일 (0=일) */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
