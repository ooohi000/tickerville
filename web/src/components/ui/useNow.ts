"use client";

import { useSyncExternalStore } from "react";

/** 이 간격(ms)마다 한 번만 다시 그린다. 화면 시계는 분 단위라 10초면 충분 */
const TICK_MS = 10_000;

function subscribe(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 1_000);
  return () => window.clearInterval(id);
}

/** 개발용 `?now=2026-11-27T12:00-05:00` → 그 시각으로 고정 (휴장일·조기 폐장 미리보기) */
function readOverride(): number | null {
  const raw = new URLSearchParams(window.location.search).get("now");
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

function getSnapshot(): number {
  return readOverride() ?? Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

function getServerSnapshot(): null {
  return null;
}

/**
 * 현재 시각 (ms). 서버 렌더와 첫 화면에서는 null → 시계는 브라우저에서만 그린다 (hydration 어긋남 없음).
 * 같은 TICK 안에서는 같은 값을 돌려줘서 불필요하게 다시 그리지 않는다.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
