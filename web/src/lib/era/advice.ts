import type { EraId } from "./eras";

/**
 * 참모·멘토 조언 데이터 (src/data/advice/{era}.json).
 * 원칙: 실제로 남긴 글만, 출처와 함께. 대통령에게 한 말처럼 꾸미지 않는다.
 * 글은 언어별 칸(text.en 원문, text.ko 번역)으로 둬서 나중에 ja 를 채우면 된다.
 */
export type Localized = { ko: string; en?: string; ja?: string };

export interface Advisor {
  id: string;
  name: { ko: string; en: string };
  years: string;
  role: Localized;
  relation: Localized;
  relationSource: string;
}

export interface AdviceSource {
  title: string;
  year: number;
  type: string;
  locator?: string;
  url?: string;
}

export interface Advice {
  id: string;
  advisor: string;
  text: { en: string; ko: string; ja?: string };
  /** 지금 기업을 보는 사람에게 쉬운 한 줄 풀이 */
  plain: Localized;
  source: AdviceSource;
  /** primary = 원문과 맞춰 봄, secondary = 믿을 만한 2차 자료로 확인 */
  confidence: "primary" | "secondary";
  kind?: "story";
}

export interface AdviceBook {
  era: EraId;
  advisors: Advisor[];
  quotes: Advice[];
}

/** 처음 조언 버튼을 누를 때만 그 시대 묶음을 받는다 (번들에 다 넣지 않음) */
const LOADERS: Record<EraId, () => Promise<{ default: unknown }>> = {
  "1795": () => import("@/data/advice/1795.json"),
  "1863": () => import("@/data/advice/1863.json"),
  "1905": () => import("@/data/advice/1905.json"),
  "1935": () => import("@/data/advice/1935.json"),
  "2026": () => import("@/data/advice/2026.json"),
};

export async function loadAdviceBook(era: EraId): Promise<AdviceBook> {
  const mod = await LOADERS[era]();
  return mod.default as AdviceBook;
}

/** 데이터 검사: 틀린 점을 문장으로 돌려준다 (빈 배열이면 정상) */
export function validateAdviceBook(book: AdviceBook): string[] {
  const problems: string[] = [];
  const advisorIds = new Set(book.advisors.map((a) => a.id));
  const seen = new Set<string>();
  for (const q of book.quotes) {
    if (seen.has(q.id)) problems.push(`${q.id}: id 중복`);
    seen.add(q.id);
    if (!advisorIds.has(q.advisor)) problems.push(`${q.id}: 없는 참모 ${q.advisor}`);
    if (!q.text.en?.trim() || !q.text.ko?.trim()) problems.push(`${q.id}: 원문·번역 비어 있음`);
    if (!q.plain.ko?.trim()) problems.push(`${q.id}: 풀이 비어 있음`);
    if (!q.source.title || !Number.isInteger(q.source.year)) problems.push(`${q.id}: 출처 부족`);
    if (q.confidence !== "primary" && q.confidence !== "secondary") problems.push(`${q.id}: confidence 값`);
  }
  for (const a of book.advisors) {
    if (!/^https?:\/\//.test(a.relationSource)) problems.push(`${a.id}: 관계 출처 주소`);
  }
  return problems;
}

/** 출처 한 줄: "『The Empire of Business』 1902 · p. 17" */
export function formatAdviceSource(s: AdviceSource): string {
  const loc = s.locator && s.locator.length <= 40 ? ` · ${s.locator}` : "";
  return `『${s.title}』 ${s.year}${loc}`;
}
