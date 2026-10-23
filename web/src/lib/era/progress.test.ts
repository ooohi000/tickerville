import { describe, expect, it } from "vitest";
import {
  AFFINITIES,
  EMPTY_LOG,
  RANKS,
  affinityFor,
  analystTitle,
  applyRead,
  parseLog,
  rankFor,
  readByAdvisor,
  recordRead,
  sanitizeName,
  totalRead,
  untilNext,
  withJosa,
  type ReadingLog,
} from "./progress";

function logOf(entries: [string, string][]): ReadingLog {
  return { seen: Object.fromEntries(entries) };
}

describe("sanitizeName", () => {
  it("공백 정리 · 12자 · 비면 null", () => {
    expect(sanitizeName("  화이트  ")).toBe("화이트");
    expect(sanitizeName("a   b")).toBe("a b");
    expect(sanitizeName("가나다라마바사아자차카타파하")).toBe("가나다라마바사아자차카타");
    expect(sanitizeName("   ")).toBeNull();
    expect(sanitizeName(null)).toBeNull();
  });

  it("제어 문자는 지운다", () => {
    expect(sanitizeName("화\u0000이\u001f트")).toBe("화이트");
  });
});

describe("parseLog", () => {
  it("깨진 값은 빈 기록", () => {
    expect(parseLog(null)).toBe(EMPTY_LOG);
    expect(parseLog("{")).toBe(EMPTY_LOG);
    expect(parseLog('{"seen":3}')).toBe(EMPTY_LOG);
  });

  it("문자열 값만 남긴다", () => {
    expect(parseLog('{"seen":{"a-01":"a","b-01":5}}')).toEqual({ seen: { "a-01": "a" } });
  });
});

describe("recordRead · 집계", () => {
  it("같은 조언은 한 번만 센다", () => {
    const once = recordRead(EMPTY_LOG, "hamilton-01", "hamilton");
    expect(recordRead(once, "hamilton-01", "hamilton")).toBe(once);
    expect(totalRead(once)).toBe(1);
  });

  it("참모별로 센다", () => {
    const log = logOf([["h-1", "hamilton"], ["h-2", "hamilton"], ["f-1", "franklin"]]);
    expect(readByAdvisor(log, "hamilton")).toBe(2);
    expect(readByAdvisor(log, "franklin")).toBe(1);
    expect(readByAdvisor(log, "morgan")).toBe(0);
  });
});

describe("직급 · 친밀도", () => {
  it("경계값", () => {
    expect(rankFor(0).ko).toBe("주니어");
    expect(rankFor(29).ko).toBe("주니어");
    expect(rankFor(30).ko).toBe("시니어");
    expect(rankFor(100).ko).toBe("수석");
    expect(affinityFor(2).hearts).toBe(0);
    expect(affinityFor(3).ko).toBe("아는 사이");
    expect(affinityFor(15).hearts).toBe(3);
  });

  it("다음 단계까지 남은 수", () => {
    expect(untilNext(RANKS, 25)).toBe(5);
    expect(untilNext(RANKS, 150)).toBeNull();
    expect(untilNext(AFFINITIES, 0)).toBe(3);
  });
});

describe("applyRead", () => {
  it("직급이 오르는 순간만 promoted", () => {
    const entries = Array.from({ length: 29 }, (_, i) => [`x-${i}`, "x"] as [string, string]);
    const r = applyRead(logOf(entries), "y-1", "y");
    expect(r.promoted?.ko).toBe("시니어");
    expect(applyRead(r.log, "y-2", "y").promoted).toBeNull();
  });

  it("친밀도가 오르는 순간만 closer", () => {
    const log = logOf([["h-1", "hamilton"], ["h-2", "hamilton"]]);
    expect(applyRead(log, "h-3", "hamilton").closer?.ko).toBe("아는 사이");
    expect(applyRead(log, "f-1", "franklin").closer).toBeNull();
  });

  it("이미 읽은 조언은 아무것도 안 바뀐다", () => {
    const log = logOf([["h-1", "hamilton"]]);
    expect(applyRead(log, "h-1", "hamilton")).toEqual({ log, promoted: null, closer: null });
  });
});

describe("analystTitle", () => {
  it("이름이 있으면 앞에 붙인다", () => {
    expect(analystTitle("화이트")).toBe("화이트 애널리스트");
    expect(analystTitle(null)).toBe("애널리스트");
  });
});

describe("withJosa", () => {
  it("받침 있으면 과, 없으면 와", () => {
    expect(withJosa("해밀턴", "과", "와")).toBe("해밀턴과");
    expect(withJosa("벤저민 프랭클린", "과", "와")).toBe("벤저민 프랭클린과");
    expect(withJosa("존 보글", "과", "와")).toBe("존 보글과");
    expect(withJosa("찰리 멍거", "과", "와")).toBe("찰리 멍거와");
    expect(withJosa("Keynes", "과", "와")).toBe("Keynes와");
  });
});
