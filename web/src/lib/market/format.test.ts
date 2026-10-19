import { describe, expect, it } from "vitest";
import { formatNextChange, formatRemaining, formatWallClock } from "./format";

describe("formatWallClock", () => {
  const at = new Date("2026-10-19T05:53:00Z");

  it("뉴욕 / 서울 같은 순간", () => {
    expect(formatWallClock(at, "America/New_York")).toBe("10월 19일 (월) 오전 1:53");
    expect(formatWallClock(at, "Asia/Seoul")).toBe("10월 19일 (월) 오후 2:53");
  });

  it("정오는 오후 12시, 자정은 오전 12시", () => {
    expect(formatWallClock(new Date("2026-10-19T16:00:00Z"), "America/New_York")).toBe("10월 19일 (월) 오후 12:00");
    expect(formatWallClock(new Date("2026-10-19T04:05:00Z"), "America/New_York")).toBe("10월 19일 (월) 오전 12:05");
  });
});

describe("formatRemaining", () => {
  it.each([
    [30_000, "곧"],
    [14 * 60_000, "14분"],
    [2 * 3600_000, "2시간"],
    [(2 * 60 + 14) * 60_000, "2시간 14분"],
    [24 * 3600_000, "1일"],
    [(27 * 60 + 59) * 60_000, "1일 3시간"],
  ])("%d ms → %s", (ms, text) => {
    expect(formatRemaining(ms)).toBe(text);
  });
});

describe("formatNextChange", () => {
  it("다음 상태에 맞는 문구", () => {
    expect(formatNextChange("regular", 60 * 60_000)).toBe("개장까지 1시간");
    expect(formatNextChange("after", 14 * 60_000)).toBe("정규장 마감까지 14분");
  });
});
