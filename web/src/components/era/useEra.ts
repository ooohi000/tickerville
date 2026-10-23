"use client";

import { useEffect } from "react";
import { createStoredValue } from "@/components/ui/storedValue";
import { DEFAULT_ERA, getEra, isEraId, type EraId, type EraSpec } from "@/lib/era/eras";

/** 고른 시대 테마. 이 브라우저에만 기억한다 (없거나 이상하면 기본값) */
const eraStore = createStoredValue<EraId>("tickerville.era", {
  fallback: DEFAULT_ERA,
  parse: (raw) => (isEraId(raw) ? raw : DEFAULT_ERA),
  serialize: (id) => id,
});

/** "그 해에 없던 기업 흐리게" 켜기·끄기 (기본 켜짐) */
const fadeStore = createStoredValue<boolean>("tickerville.eraFade", {
  fallback: true,
  parse: (raw) => raw !== "off",
  serialize: (on) => (on ? "on" : "off"),
});

export const setEra = eraStore.set;
export const setEraFade = fadeStore.set;
export const useEraFade = fadeStore.use;

export function useEra(): EraSpec {
  return getEra(eraStore.use());
}

/** <html data-era="1905"> — 패널 스킨 CSS 가 이 값을 본다 */
export function EraRoot() {
  const era = useEra();
  useEffect(() => {
    document.documentElement.dataset.era = era.id;
  }, [era.id]);
  return null;
}
