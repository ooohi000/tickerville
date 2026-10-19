import { describe, expect, it } from "vitest";
import { getMarketSession, isTradingDay } from "./marketClock";

/** 동부 시각 문자열로 순간 만들기 (2026-10 은 EDT, UTC−4) */
const edt = (local: string) => new Date(`${local}-04:00`);
const est = (local: string) => new Date(`${local}-05:00`);

describe("isTradingDay", () => {
  it("평일 / 주말 / 공휴일", () => {
    expect(isTradingDay("2026-10-19")).toBe(true);
    expect(isTradingDay("2026-10-18")).toBe(false);
    expect(isTradingDay("2026-11-26")).toBe(false); // 추수감사절
  });
});

describe("getMarketSession", () => {
  it.each([
    ["2026-10-19T03:59", "closed", "pre", "2026-10-19T04:00"],
    ["2026-10-19T04:00", "pre", "regular", "2026-10-19T09:30"],
    ["2026-10-19T09:30", "regular", "after", "2026-10-19T16:00"],
    ["2026-10-19T15:59", "regular", "after", "2026-10-19T16:00"],
    ["2026-10-19T16:00", "after", "closed", "2026-10-19T20:00"],
    ["2026-10-19T20:00", "closed", "pre", "2026-10-20T04:00"],
  ] as const)("동부 %s → %s, 다음 %s (%s)", (local, phase, nextPhase, nextLocal) => {
    const s = getMarketSession(edt(local));
    expect(s.phase).toBe(phase);
    expect(s.next.phase).toBe(nextPhase);
    expect(s.next.at.getTime()).toBe(edt(nextLocal).getTime());
  });

  it("한국 오후 2시 53분(월) = 동부 새벽 1시 53분 → 장 마감, 오늘 4시에 프리마켓", () => {
    const s = getMarketSession(new Date("2026-10-19T14:53:00+09:00"));
    expect(s.marketDate).toBe("2026-10-19");
    expect(s.phase).toBe("closed");
    expect(s.closedReason).toBeNull();
    expect(s.next.at.getTime()).toBe(edt("2026-10-19T04:00").getTime());
  });

  it("금요일 저녁 → 주말 건너뛰고 월요일 프리마켓", () => {
    const s = getMarketSession(edt("2026-10-23T21:00"));
    expect(s.next.at.getTime()).toBe(edt("2026-10-26T04:00").getTime());
  });

  it("토요일은 주말 휴장", () => {
    const s = getMarketSession(edt("2026-10-24T12:00"));
    expect(s.phase).toBe("closed");
    expect(s.closedReason).toBe("주말");
  });

  it("추수감사절 휴장 → 다음 날(조기 폐장일) 프리마켓", () => {
    const s = getMarketSession(est("2026-11-26T10:00"));
    expect(s.phase).toBe("closed");
    expect(s.closedReason).toBe("추수감사절");
    expect(s.next.at.getTime()).toBe(est("2026-11-27T04:00").getTime());
  });

  it("조기 폐장일: 13시에 정규장 끝, 17시에 애프터 끝", () => {
    const noon = getMarketSession(est("2026-11-27T12:00"));
    expect(noon.phase).toBe("regular");
    expect(noon.earlyCloseReason).toBe("추수감사절 다음 날");
    expect(noon.next.at.getTime()).toBe(est("2026-11-27T13:00").getTime());

    expect(getMarketSession(est("2026-11-27T13:30")).phase).toBe("after");
    expect(getMarketSession(est("2026-11-27T17:00")).phase).toBe("closed");
  });

  it("연휴(크리스마스 금요일) → 다음 주 월요일", () => {
    const s = getMarketSession(est("2026-12-24T18:00"));
    expect(s.next.at.getTime()).toBe(est("2026-12-28T04:00").getTime());
  });

  it("서머타임 끝나는 주말을 지나도 다음 개장 시각이 맞다", () => {
    const s = getMarketSession(edt("2026-10-30T21:00")); // 금, 11-01 에 표준시로
    expect(s.next.at.getTime()).toBe(est("2026-11-02T04:00").getTime());
  });
});
