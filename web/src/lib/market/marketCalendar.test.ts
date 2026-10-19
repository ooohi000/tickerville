import { describe, expect, it } from "vitest";
import { CALENDAR_YEARS, NYSE_EARLY_CLOSES, NYSE_HOLIDAYS } from "./marketCalendar";
import { weekdayOf } from "./zonedTime";

describe("NYSE 일정 데이터", () => {
  const all = [...Object.keys(NYSE_HOLIDAYS), ...Object.keys(NYSE_EARLY_CLOSES)];

  it("휴장·조기 폐장일은 전부 평일", () => {
    for (const d of all) expect([0, 6], d).not.toContain(weekdayOf(d));
  });

  it("휴장일과 조기 폐장일이 겹치지 않는다", () => {
    for (const d of Object.keys(NYSE_EARLY_CLOSES)) expect(NYSE_HOLIDAYS[d], d).toBeUndefined();
  });

  it("등록된 연도만 들어 있다", () => {
    for (const d of all) expect(CALENDAR_YEARS as readonly number[]).toContain(Number(d.slice(0, 4)));
  });

  it("올해 일정이 등록돼 있다 (실패하면 NYSE 발표 보고 다음 해 추가)", () => {
    expect(CALENDAR_YEARS as readonly number[]).toContain(new Date().getUTCFullYear());
  });
});
