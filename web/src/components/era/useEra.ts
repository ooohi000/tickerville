"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_ERA, getEra, isEraId, type EraId, type EraSpec } from "@/lib/era/eras";

/**
 * 고른 시대 테마. 이 브라우저에만 기억한다 (localStorage, 실패하면 기본값).
 * 화면 전체가 같은 값을 보도록 작은 저장소 하나 + useSyncExternalStore.
 */
const STORAGE_KEY = "tickerville.era";
const listeners = new Set<() => void>();
let memory: EraId | null = null;

function read(): EraId {
  if (memory) return memory;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (isEraId(v)) return v;
  } catch {
    // 사생활 보호 모드 등: 기억 못 해도 화면은 그대로
  }
  return DEFAULT_ERA;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      memory = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setEra(id: EraId) {
  memory = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // 저장 실패해도 이번 방문 동안은 memory 로 유지
  }
  for (const l of listeners) l();
}

export function useEra(): EraSpec {
  const id = useSyncExternalStore(subscribe, read, () => DEFAULT_ERA);
  return getEra(id);
}

/** "그 시대에 없던 기업 흐리게" 켜기·끄기 (기본 켜짐). 같은 방식으로 이 브라우저에만 */
const FADE_KEY = "tickerville.eraFade";
const fadeListeners = new Set<() => void>();
let fadeMemory: boolean | null = null;

function readFade(): boolean {
  if (fadeMemory !== null) return fadeMemory;
  try {
    return window.localStorage.getItem(FADE_KEY) !== "off";
  } catch {
    return true;
  }
}

function subscribeFade(listener: () => void) {
  fadeListeners.add(listener);
  return () => {
    fadeListeners.delete(listener);
  };
}

export function setEraFade(on: boolean) {
  fadeMemory = on;
  try {
    window.localStorage.setItem(FADE_KEY, on ? "on" : "off");
  } catch {
    // 기억 못 해도 이번 방문 동안은 유지
  }
  for (const l of fadeListeners) l();
}

export function useEraFade(): boolean {
  return useSyncExternalStore(subscribeFade, readFade, () => true);
}

/** <html data-era="1905"> — 패널 스킨 CSS 가 이 값을 본다 */
export function EraRoot() {
  const era = useEra();
  useEffect(() => {
    document.documentElement.dataset.era = era.id;
  }, [era.id]);
  return null;
}
