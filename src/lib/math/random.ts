/**
 * 시드 고정 난수 (mulberry32). 같은 시드면 항상 같은 순서로 나온다.
 * 구름·빗방울 배치가 새로고침할 때마다 바뀌지 않게 쓴다.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** [min, max) 범위 난수 */
export function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}
