import type { FilingActivity } from "@/types";

/**
 * 최근 30일 공시 활동 → 건물 주변 땅 원판("열기").
 * 중요 사건 공시(8-K)는 내부자 거래 신고(Form 4)보다 무겁게 친다.
 */
export const MATERIAL_WEIGHT = 3;
export const INSIDER_WEIGHT = 1;

/** 점수가 이 값 이하면 원판 없음 (조용한 기업) */
export const EVENT_SCORE_MIN = 4;
/** 이 값 이상이면 최대 강도. 집에서 실제 분포 보고 조정 */
export const EVENT_SCORE_MAX = 48;

/** 원판 반지름 범위 (월드 단위). 집에서 조정 */
export const HEAT_MIN_RADIUS = 0.8;
export const HEAT_MAX_RADIUS = 2.4;
/** 최대 강도일 때 불투명도 */
export const HEAT_MAX_OPACITY = 0.75;
/** 단일 색상, 진하기는 불투명도·크기로 표현. 집에서 조정 */
export const HEAT_COLOR = "#ff6b35";

export interface EventHeat {
  /** 가중 합계 점수 */
  score: number;
  /** 0~1. 0이면 원판을 그리지 않는다 */
  intensity: number;
  radius: number;
  opacity: number;
  color: string;
}

const safeCount = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function getEventScore(f: FilingActivity): number {
  return safeCount(f.material) * MATERIAL_WEIGHT + safeCount(f.insider) * INSIDER_WEIGHT;
}

/** 점수 → 강도 0~1 (로그 스케일). 몇 건 차이보다 "평소의 몇 배"가 보이게 */
export function getEventIntensity(score: number): number {
  if (!Number.isFinite(score) || score <= EVENT_SCORE_MIN) return 0;
  if (score >= EVENT_SCORE_MAX) return 1;
  return (
    (Math.log(score) - Math.log(EVENT_SCORE_MIN)) /
    (Math.log(EVENT_SCORE_MAX) - Math.log(EVENT_SCORE_MIN))
  );
}

export function getEventHeat(filings: FilingActivity): EventHeat {
  const score = getEventScore(filings);
  const intensity = getEventIntensity(score);
  return {
    score,
    intensity,
    radius: HEAT_MIN_RADIUS + intensity * (HEAT_MAX_RADIUS - HEAT_MIN_RADIUS),
    opacity: intensity * HEAT_MAX_OPACITY,
    color: HEAT_COLOR,
  };
}
