/**
 * 링 게이지 (이익률·자기자본비율). 0~100% 를 원 둘레의 채운 길이로.
 * 음수(적자)는 0 으로 채우고 negative 로 알려준다 (빨간 글씨로 표시). 100% 넘으면 꽉 찬 원.
 */
export interface RingArc {
  circumference: number;
  /** stroke-dasharray 첫 값 (채운 길이) */
  filled: number;
  negative: boolean;
}

export function getRingArc(ratio: number | null, radius: number): RingArc | null {
  if (ratio === null || !Number.isFinite(ratio)) return null;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, ratio));
  return { circumference, filled: circumference * clamped, negative: ratio < 0 };
}
