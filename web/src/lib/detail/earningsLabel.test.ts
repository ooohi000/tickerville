import { describe, expect, it } from "vitest";
import { daysUntil, describeLastEarnings, describeNextEarnings, formatDday, formatKoreanDate } from "./earningsLabel";

// 2026-10-20 09:55 KST = 2026-10-19 20:55 ET (아직 미국은 19일)
const now = new Date("2026-10-20T00:55:00Z");

describe("daysUntil / formatDday", () => {
  it("미국 동부 날짜 기준으로 센다", () => {
    expect(daysUntil("2026-10-19", now)).toBe(0);
    expect(daysUntil("2026-11-18", now)).toBe(30);
    expect(daysUntil("2026-10-18", now)).toBe(-1);
  });

  it("D-day 표기", () => {
    expect(formatDday(0)).toBe("D-day");
    expect(formatDday(3)).toBe("D-3");
    expect(formatDday(-2)).toBe("D+2");
  });

  it("서머타임 끝나는 주도 하루씩 정확히", () => {
    expect(daysUntil("2026-11-02", new Date("2026-10-31T16:00:00Z"))).toBe(2);
  });
});

describe("formatKoreanDate", () => {
  it("올해면 월·일, 아니면 연도까지", () => {
    expect(formatKoreanDate("2026-11-18", now)).toBe("11월 18일");
    expect(formatKoreanDate("2027-01-28", now)).toBe("2027년 1월 28일");
  });
});

describe("describeNextEarnings", () => {
  it("추정치는 반드시 '예상'", () => {
    expect(describeNextEarnings({ date: "2026-11-18", status: "EXPECTED", source: "ESTIMATE" }, now)?.text).toBe(
      "11월 18일 · D-30 · 예상",
    );
  });

  it("직접 확정한 날짜는 '확정'", () => {
    expect(describeNextEarnings({ date: "2026-10-22", status: "CONFIRMED", source: "MANUAL" }, now)).toMatchObject({
      dday: "D-3",
      status: "확정",
    });
  });

  it("날짜가 지났는데 아직 갱신 전이면 '발표 확인 중', 없으면 null", () => {
    expect(describeNextEarnings({ date: "2026-10-15", status: "EXPECTED", source: "ESTIMATE" }, now)).toMatchObject({
      dday: null,
      text: "10월 15일 · 발표 확인 중",
    });
    expect(describeNextEarnings(null, now)).toBeNull();
  });
});

describe("describeLastEarnings", () => {
  it("발표 시점과 한국 시간 안내", () => {
    expect(describeLastEarnings({ date: "2026-08-26", timing: "AMC" }, now)).toEqual({
      date: "8월 26일",
      timing: "장 마감 후",
      koreaHint: "한국 시간 다음 날 아침",
      text: "8월 26일 · 장 마감 후",
    });
  });

  it("시점을 모르면 날짜만", () => {
    expect(describeLastEarnings({ date: "2026-08-26", timing: null }, now)?.text).toBe("8월 26일");
    expect(describeLastEarnings(null, now)).toBeNull();
  });
});
