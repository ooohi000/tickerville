/**
 * 놀이 요소: 애널리스트 이름 · 직급(읽은 조언 수) · 참모 친밀도(그 참모 조언을 읽은 수).
 * 모두 이 브라우저에만 저장한다 (로그인 없음, 서버로 보내지 않음).
 * 같은 조언을 여러 번 봐도 한 번만 센다 → 버튼 연타로 올릴 수 없다.
 */

/** 읽은 조언: 조언 id → 참모 id */
export interface ReadingLog {
  seen: Record<string, string>;
}

export const EMPTY_LOG: ReadingLog = { seen: {} };

export interface Rank {
  min: number;
  ko: string;
  en: string;
}

/** 직급: 읽은 조언 수 (전체 시대 합, 385개 중) */
export const RANKS: readonly Rank[] = [
  { min: 0, ko: "주니어", en: "JUNIOR" },
  { min: 30, ko: "시니어", en: "SENIOR" },
  { min: 100, ko: "수석", en: "CHIEF" },
];

export interface Affinity {
  min: number;
  ko: string;
  /** 하트 수 0~3 */
  hearts: number;
}

/** 참모 친밀도: 그 참모의 조언을 몇 개 읽었나 */
export const AFFINITIES: readonly Affinity[] = [
  { min: 0, ko: "처음 만남", hearts: 0 },
  { min: 3, ko: "아는 사이", hearts: 1 },
  { min: 8, ko: "믿는 참모", hearts: 2 },
  { min: 15, ko: "오랜 동지", hearts: 3 },
];

export const MAX_NAME_LENGTH = 12;

/** 이름 정리: 앞뒤 공백·연속 공백·제어 문자 제거, 12자까지. 비면 null */
export function sanitizeName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join("").trim();
}

/** 저장된 문자열 → 기록 (깨졌으면 빈 기록) */
export function parseLog(raw: string | null): ReadingLog {
  if (!raw) return EMPTY_LOG;
  try {
    const v = JSON.parse(raw) as { seen?: unknown };
    if (!v || typeof v.seen !== "object" || v.seen === null) return EMPTY_LOG;
    const seen: Record<string, string> = {};
    for (const [k, a] of Object.entries(v.seen)) if (typeof a === "string") seen[k] = a;
    return { seen };
  } catch {
    return EMPTY_LOG;
  }
}

export function recordRead(log: ReadingLog, adviceId: string, advisorId: string): ReadingLog {
  if (log.seen[adviceId] === advisorId) return log;
  return { seen: { ...log.seen, [adviceId]: advisorId } };
}

export function totalRead(log: ReadingLog): number {
  return Object.keys(log.seen).length;
}

export function readByAdvisor(log: ReadingLog, advisorId: string): number {
  let n = 0;
  for (const a of Object.values(log.seen)) if (a === advisorId) n++;
  return n;
}

function levelFor<T extends { min: number }>(levels: readonly T[], count: number): T {
  let out = levels[0];
  for (const l of levels) if (count >= l.min) out = l;
  return out;
}

export function rankFor(count: number): Rank {
  return levelFor(RANKS, count);
}

export function affinityFor(count: number): Affinity {
  return levelFor(AFFINITIES, count);
}

/** 다음 단계까지 남은 수 (마지막 단계면 null) */
export function untilNext(levels: readonly { min: number }[], count: number): number | null {
  const next = levels.find((l) => l.min > count);
  return next ? next.min - count : null;
}

/** 조언 하나를 읽었을 때 바뀐 것 — 승진·친밀도 오름을 화면에 알리려고 */
export interface ReadOutcome {
  log: ReadingLog;
  promoted: Rank | null;
  closer: Affinity | null;
}

export function applyRead(log: ReadingLog, adviceId: string, advisorId: string): ReadOutcome {
  const next = recordRead(log, adviceId, advisorId);
  if (next === log) return { log, promoted: null, closer: null };
  const rankBefore = rankFor(totalRead(log));
  const rankAfter = rankFor(totalRead(next));
  const affBefore = affinityFor(readByAdvisor(log, advisorId));
  const affAfter = affinityFor(readByAdvisor(next, advisorId));
  return {
    log: next,
    promoted: rankAfter !== rankBefore ? rankAfter : null,
    closer: affAfter !== affBefore ? affAfter : null,
  };
}

/** 애널리스트 호칭: "화이트 애널리스트" / 이름 없으면 "애널리스트" */
export function analystTitle(name: string | null): string {
  return name ? `${name} 애널리스트` : "애널리스트";
}

/** 받침에 맞는 조사: withJosa("해밀턴", "과", "와") → "해밀턴과". 한글이 아니면 뒤쪽(받침 없음) 조사 */
export function withJosa(word: string, withFinal: string, withoutFinal: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasFinal ? withFinal : withoutFinal}`;
}
