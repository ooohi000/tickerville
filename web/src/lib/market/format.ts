import type { MarketPhase } from "./marketClock";
import { toZonedParts } from "./zonedTime";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** "10월 19일 (월) 오전 1:53" — Intl 한국어 출력은 환경마다 미묘하게 달라서 직접 조립 */
export function formatWallClock(instant: Date, timeZone: string): string {
  const p = toZonedParts(instant, timeZone);
  const ampm = p.hour < 12 ? "오전" : "오후";
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const mm = String(p.minute).padStart(2, "0");
  return `${p.month}월 ${p.day}일 (${WEEKDAY_KO[p.weekday]}) ${ampm} ${h12}:${mm}`;
}

/** 남은 시간 "14분" · "2시간 14분" · "1일 3시간". 1분 미만은 "곧" */
export function formatRemaining(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "곧";
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`;
  if (hours > 0) return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  return `${minutes}분`;
}

/** 장 상태 표시 설정. 색·문구는 여기 한 곳에서 */
export const PHASE_SPECS: Record<MarketPhase, { label: string; color: string }> = {
  pre: { label: "프리마켓", color: "#f5c542" },
  regular: { label: "정규장", color: "#46c26b" },
  after: { label: "애프터마켓", color: "#8b7cf6" },
  closed: { label: "장 마감", color: "#6f7c8d" },
};

/** "마감까지 2시간 14분" 처럼 다음 변화 문구. 다음 상태 기준으로 동사를 고른다 */
export function formatNextChange(next: MarketPhase, ms: number): string {
  const verb: Record<MarketPhase, string> = {
    pre: "프리마켓까지",
    regular: "개장까지",
    after: "정규장 마감까지",
    closed: "애프터 마감까지",
  };
  return `${verb[next]} ${formatRemaining(ms)}`;
}
