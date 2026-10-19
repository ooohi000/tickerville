import { createRng, randRange } from "@/lib/math/random";

/**
 * 하늘 연출 배치 계산. 값은 초안 — 집에서 화면 보고 조정.
 * 지도는 x ≈ -59~51, z ≈ -32~33 (usStates 미리보기 기준) → 조금 넉넉하게 덮는다.
 */
export const SKY_BOUNDS = { minX: -65, maxX: 60, minZ: -40, maxZ: 40 } as const;
export const CLOUD_ALTITUDE = { min: 16, max: 24 } as const;

/** 구름 한 덩어리 = 동글동글한 덩이(puff) 여러 개. 로우폴리 느낌 */
export interface CloudPuff {
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface CloudLayout {
  x: number;
  y: number;
  z: number;
  puffs: CloudPuff[];
}

const PUFFS_PER_CLOUD = { min: 3, max: 6 } as const;

/** 구름 개수만큼 위치·모양을 만든다. 같은 시드면 같은 배치 */
export function getCloudLayout(count: number, seed = 1): CloudLayout[] {
  const rng = createRng(seed);
  const clouds: CloudLayout[] = [];
  for (let i = 0; i < Math.max(0, Math.floor(count)); i++) {
    const puffCount = Math.floor(randRange(rng, PUFFS_PER_CLOUD.min, PUFFS_PER_CLOUD.max + 1));
    const puffs: CloudPuff[] = [];
    for (let j = 0; j < puffCount; j++) {
      puffs.push({
        x: randRange(rng, -2.5, 2.5),
        y: randRange(rng, -0.3, 0.6),
        z: randRange(rng, -1.2, 1.2),
        radius: randRange(rng, 1.2, 2.2),
      });
    }
    clouds.push({
      x: randRange(rng, SKY_BOUNDS.minX, SKY_BOUNDS.maxX),
      y: randRange(rng, CLOUD_ALTITUDE.min, CLOUD_ALTITUDE.max),
      z: randRange(rng, SKY_BOUNDS.minZ, SKY_BOUNDS.maxZ),
      puffs,
    });
  }
  return clouds;
}

/** 빗방울 개수, 낙하 속도(단위/초), 빗줄기 길이 */
export const RAIN = { drops: 1500, speed: 40, length: 0.8, top: 26, bottom: 0 } as const;

/** 빗방울 시작 위치 [x, y, z, x, y, z, ...] */
export function getRainDropPositions(count: number = RAIN.drops, seed = 2): Float32Array {
  const rng = createRng(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = randRange(rng, SKY_BOUNDS.minX, SKY_BOUNDS.maxX);
    out[i * 3 + 1] = randRange(rng, RAIN.bottom, RAIN.top);
    out[i * 3 + 2] = randRange(rng, SKY_BOUNDS.minZ, SKY_BOUNDS.maxZ);
  }
  return out;
}

/** y를 낙하시키고 바닥 아래로 가면 위로 되돌린다 */
export function fallY(y: number, dt: number, speed: number = RAIN.speed): number {
  const next = y - speed * dt;
  const range = RAIN.top - RAIN.bottom;
  return next < RAIN.bottom ? next + range : next;
}

/** 번개: 주기마다 짧게 두 번 번쩍 */
export const LIGHTNING = { interval: 7, flashes: [0, 0.18], duration: 0.08, peak: 3 } as const;

/** 시간(초) → 번개 밝기 0~peak. 대부분 0 */
export function getLightningIntensity(timeSec: number): number {
  // 음수일 때만 보정 (+interval 후 %를 하면 부동소수점 오차로 경계값이 밀린다)
  const r = timeSec % LIGHTNING.interval;
  const t = r < 0 ? r + LIGHTNING.interval : r;
  for (const start of LIGHTNING.flashes) {
    const dt = t - start;
    if (dt >= 0 && dt < LIGHTNING.duration) {
      // 번쩍 켜졌다가 빠르게 꺼진다
      return LIGHTNING.peak * (1 - dt / LIGHTNING.duration);
    }
  }
  return 0;
}
