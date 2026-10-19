import { describe, expect, it } from "vitest";
import {
  EVENT_SCORE_MAX,
  EVENT_SCORE_MIN,
  HEAT_MAX_OPACITY,
  HEAT_MAX_RADIUS,
  HEAT_MIN_RADIUS,
  getEventHeat,
  getEventIntensity,
  getEventScore,
} from "./eventHeat";

describe("getEventScore", () => {
  it("8-K는 3점, Form 4는 1점", () => {
    expect(getEventScore({ material: 2, insider: 5 })).toBe(11);
  });

  it("음수·NaN은 0건으로 본다", () => {
    expect(getEventScore({ material: -1, insider: NaN })).toBe(0);
  });
});

describe("getEventIntensity", () => {
  it("기준 이하면 0, 최대 이상이면 1", () => {
    expect(getEventIntensity(EVENT_SCORE_MIN)).toBe(0);
    expect(getEventIntensity(0)).toBe(0);
    expect(getEventIntensity(EVENT_SCORE_MAX)).toBe(1);
    expect(getEventIntensity(500)).toBe(1);
  });

  it("로그 스케일: 기하 중간값이면 0.5", () => {
    const mid = Math.sqrt(EVENT_SCORE_MIN * EVENT_SCORE_MAX);
    expect(getEventIntensity(mid)).toBeCloseTo(0.5, 6);
  });

  it("점수가 클수록 강도가 커진다", () => {
    const values = [5, 8, 12, 20, 30, 45].map(getEventIntensity);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });
});

describe("getEventHeat", () => {
  it("조용한 기업은 원판 없음", () => {
    const h = getEventHeat({ material: 1, insider: 0 });
    expect(h.intensity).toBe(0);
    expect(h.radius).toBe(HEAT_MIN_RADIUS);
    expect(h.opacity).toBe(0);
  });

  it("공시가 몰리면 최대", () => {
    const h = getEventHeat({ material: 10, insider: 30 });
    expect(h.radius).toBe(HEAT_MAX_RADIUS);
    expect(h.opacity).toBe(HEAT_MAX_OPACITY);
  });

  it("중요 공시 1건이 내부자 신고 1건보다 열기를 더 올린다", () => {
    const base = { material: 2, insider: 4 };
    expect(getEventHeat({ ...base, material: 3 }).intensity).toBeGreaterThan(
      getEventHeat({ ...base, insider: 5 }).intensity,
    );
  });
});
