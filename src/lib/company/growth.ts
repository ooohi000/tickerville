/** 매출 성장률이 이 이상이면 "고성장" → 건물 옆 공사 크레인. 집에서 실제 분포 보고 조정 */
export const HIGH_GROWTH_THRESHOLD = 0.25;

export function isHighGrowth(revenueGrowthYoy: number | null): boolean {
  return (
    revenueGrowthYoy !== null &&
    Number.isFinite(revenueGrowthYoy) &&
    revenueGrowthYoy >= HIGH_GROWTH_THRESHOLD
  );
}

/** +25%, −3% 처럼 표시 */
export function formatGrowth(revenueGrowthYoy: number | null): string {
  if (revenueGrowthYoy === null || !Number.isFinite(revenueGrowthYoy)) return "—";
  const pct = Math.round(revenueGrowthYoy * 100);
  return pct > 0 ? `+${pct}%` : pct < 0 ? `−${Math.abs(pct)}%` : "0%";
}

export interface CraneLayout {
  /** 건물 중심 기준 크레인 기둥 위치 (건물 모서리 바깥) */
  x: number;
  z: number;
  /** 기둥 높이 = 팔 높이. 옥상 바로 위, 간판보다 아래 */
  mastHeight: number;
  /** 건물 쪽으로 뻗는 팔 길이. 첨탑이 있는 중심까지는 닿지 않는다 */
  jibLength: number;
  /** 반대쪽 짧은 팔 (균형추) */
  counterLength: number;
  /** 팔이 건물 중심을 향하는 기본 각도 (y축 회전, 라디안) */
  baseAngle: number;
  /** 기본 각도에서 좌우로 흔들리는 폭 (라디안) */
  swing: number;
}

/** 기둥이 건물 모서리에서 떨어진 거리 */
const CRANE_GAP = 0.35;
/** 팔이 옥상(몸통 꼭대기)보다 떠 있는 높이. 간판 간격(LABEL_GAP 0.5)보다 작아야 한다 */
export const CRANE_ABOVE_ROOF = 0.25;

/**
 * 건물 크기에 맞춘 크레인 배치.
 * 팔은 옥상 바로 위에서 건물 쪽으로 좌우로 흔들린다 (벽·간판·첨탑을 피하도록).
 */
export function getCraneLayout(building: {
  width: number;
  depth: number;
  bodyHeight: number;
}): CraneLayout {
  const x = building.width / 2 + CRANE_GAP;
  const z = building.depth / 2 + CRANE_GAP;
  const toCenter = Math.hypot(x, z);
  return {
    x,
    z,
    mastHeight: building.bodyHeight + CRANE_ABOVE_ROOF,
    jibLength: toCenter * 0.7,
    counterLength: building.width * 0.4,
    // 팔 기본 방향(+x)을 기둥 → 건물 중심(-x, -z) 방향으로 돌린다
    baseAngle: Math.atan2(z, -x),
    swing: 0.6,
  };
}
