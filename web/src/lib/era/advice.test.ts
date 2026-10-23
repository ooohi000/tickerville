import { describe, expect, it } from "vitest";
import { ERA_IDS, ADVICE_TOTAL } from "./eras";
import { formatAdviceSource, loadAdviceBook, validateAdviceBook, type AdviceBook } from "./advice";

describe("조언 데이터 (src/data/advice)", () => {
  it.each(ERA_IDS)("%s: 형식이 맞고 40개 이상", async (era) => {
    const book = await loadAdviceBook(era);
    expect(book.era).toBe(era);
    expect(validateAdviceBook(book)).toEqual([]);
    expect(book.quotes.length).toBeGreaterThanOrEqual(40);
  });

  it("전체 조언 수가 ADVICE_TOTAL 과 같다", async () => {
    let n = 0;
    for (const era of ERA_IDS) n += (await loadAdviceBook(era)).quotes.length;
    expect(n).toBe(ADVICE_TOTAL);
  });

  it("모든 참모가 조언을 하나 이상 갖는다", async () => {
    for (const era of ERA_IDS) {
      const book = await loadAdviceBook(era);
      const used = new Set(book.quotes.map((q) => q.advisor));
      for (const a of book.advisors) expect(used.has(a.id), `${era} ${a.id}`).toBe(true);
    }
  });

  it("가짜로 확인된 유명 문장은 들어 있지 않다", async () => {
    const banned = [/sucker born every minute/i, /stay irrational longer/i, /penny saved is a penny earned/i, /investment in knowledge pays/i];
    for (const era of ERA_IDS) {
      const book = await loadAdviceBook(era);
      for (const q of book.quotes) for (const b of banned) expect(q.text.en).not.toMatch(b);
    }
  });
});

describe("validateAdviceBook", () => {
  const base: AdviceBook = {
    era: "1905",
    advisors: [{ id: "a", name: { ko: "가", en: "A" }, years: "1900–1950", role: { ko: "역할" }, relation: { ko: "관계" }, relationSource: "https://example.com" }],
    quotes: [
      { id: "a-01", advisor: "a", text: { en: "x", ko: "엑스" }, plain: { ko: "풀이" }, source: { title: "T", year: 1900, type: "book" }, confidence: "primary" },
    ],
  };

  it("정상이면 빈 배열", () => {
    expect(validateAdviceBook(base)).toEqual([]);
  });

  it("중복 id · 없는 참모 · 빈 번역을 잡는다", () => {
    const q = base.quotes[0];
    const bad: AdviceBook = { ...base, quotes: [q, { ...q }, { ...q, id: "b-01", advisor: "b", text: { en: "y", ko: " " } }] };
    const problems = validateAdviceBook(bad);
    expect(problems).toContain("a-01: id 중복");
    expect(problems).toContain("b-01: 없는 참모 b");
    expect(problems).toContain("b-01: 원문·번역 비어 있음");
  });
});

describe("formatAdviceSource", () => {
  it("책 이름 · 연도 · 짧은 위치", () => {
    expect(formatAdviceSource({ title: "The Empire of Business", year: 1902, type: "book", locator: "p. 17" })).toBe("『The Empire of Business』 1902 · p. 17");
  });

  it("위치 설명이 길면 생략", () => {
    expect(formatAdviceSource({ title: "T", year: 1900, type: "book", locator: "x".repeat(41) })).toBe("『T』 1900");
  });
});
