"use client";

import { useSyncExternalStore } from "react";

/**
 * 이 브라우저에만 기억하는 작은 값 (localStorage). 시대 테마·흐림 켜기·첫 방문 안내가 같이 쓴다.
 * - 저장이 막혀 있어도(사생활 보호 모드 등) 이번 방문 동안은 메모리로 유지
 * - 같은 값을 보는 컴포넌트는 모두 같이 바뀐다 (useSyncExternalStore)
 * - 서버 렌더에서는 fallback (hydration 어긋남 없음)
 */
export interface StoredValue<T> {
  use: () => T;
  set: (value: T) => void;
}

export function createStoredValue<T>(
  key: string,
  options: { fallback: T; parse: (raw: string | null) => T; serialize: (value: T) => string },
): StoredValue<T> {
  const listeners = new Set<() => void>();
  let memory: { value: T } | null = null;
  // 같은 저장 문자열이면 같은 객체를 돌려준다 (useSyncExternalStore 는 매번 새 객체면 무한 렌더)
  let cache: { raw: string | null; value: T } | null = null;

  const read = (): T => {
    if (memory) return memory.value;
    try {
      const raw = window.localStorage.getItem(key);
      if (cache && cache.raw === raw) return cache.value;
      const value = options.parse(raw);
      cache = { raw, value };
      return value;
    } catch {
      return options.fallback;
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    // 다른 탭에서 바꾸면 따라간다
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        memory = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  const set = (value: T) => {
    memory = { value };
    try {
      window.localStorage.setItem(key, options.serialize(value));
    } catch {
      // 기억 못 해도 이번 방문 동안은 memory 로 유지
    }
    for (const l of listeners) l();
  };

  const serverSnapshot = () => options.fallback;
  return { use: () => useSyncExternalStore(subscribe, read, serverSnapshot), set };
}
