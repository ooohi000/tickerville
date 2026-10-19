import { describe, expect, it } from "vitest";
import { addDays, fromZonedWallTime, toZonedParts, weekdayOf } from "./zonedTime";

const NY = "America/New_York";

describe("toZonedParts", () => {
  it("서머타임(EDT, UTC−4) 기간", () => {
    const p = toZonedParts(new Date("2026-10-19T05:53:00Z"), NY);
    expect(p).toMatchObject({ date: "2026-10-19", hour: 1, minute: 53, weekday: 1 });
  });

  it("표준시(EST, UTC−5) 기간", () => {
    const p = toZonedParts(new Date("2026-12-01T14:30:00Z"), NY);
    expect(p).toMatchObject({ date: "2026-12-01", hour: 9, minute: 30 });
  });

  it("자정은 0시 (24시가 아님)", () => {
    expect(toZonedParts(new Date("2026-10-19T04:00:00Z"), NY).hour).toBe(0);
  });

  it("서울은 같은 순간 다른 날짜", () => {
    expect(toZonedParts(new Date("2026-10-19T20:00:00Z"), "Asia/Seoul").date).toBe("2026-10-20");
  });
});

describe("fromZonedWallTime", () => {
  it("동부 09:30 → UTC (서머타임 13:30, 표준시 14:30)", () => {
    expect(fromZonedWallTime("2026-10-19", 570, NY).toISOString()).toBe("2026-10-19T13:30:00.000Z");
    expect(fromZonedWallTime("2026-12-01", 570, NY).toISOString()).toBe("2026-12-01T14:30:00.000Z");
  });

  it("서머타임이 바뀌는 날(2026-03-08, 11-01)도 맞다", () => {
    expect(fromZonedWallTime("2026-03-08", 570, NY).toISOString()).toBe("2026-03-08T13:30:00.000Z");
    expect(fromZonedWallTime("2026-11-01", 570, NY).toISOString()).toBe("2026-11-01T14:30:00.000Z");
  });

  it("toZonedParts 와 왕복하면 같은 벽시계", () => {
    const at = fromZonedWallTime("2027-07-15", 16 * 60, NY);
    expect(toZonedParts(at, NY)).toMatchObject({ date: "2027-07-15", hour: 16, minute: 0 });
  });
});

describe("addDays / weekdayOf", () => {
  it("달·해 넘김", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("요일", () => {
    expect(weekdayOf("2026-10-19")).toBe(1); // 월
    expect(weekdayOf("2026-10-18")).toBe(0); // 일
  });
});
