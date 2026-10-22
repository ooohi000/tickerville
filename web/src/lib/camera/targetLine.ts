/**
 * 조준선: 고른 건물(화면 좌표)에서 상세 패널까지 잇는 선의 양 끝.
 * - 패널이 건물보다 아래에 있으면 (휴대폰 아래 시트) 세로로 패널 위쪽 끝까지
 * - 패널이 오른쪽에 있으면 (데스크톱) 가로로 패널 왼쪽 끝까지 — 패널 높이 안으로 맞춤
 * - 건물이 화면 밖이거나 패널에 가려지면 선 없음
 */
export interface ScreenPoint {
  x: number;
  y: number;
}

export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface TargetLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** 티커·좌표 글자 자리 (조준 표시 오른쪽 위) */
  labelX: number;
  labelY: number;
  orientation: "horizontal" | "vertical";
}

/** 패널 끝에서 선이 닿는 곳을 모서리에서 이만큼 안쪽으로 (꺾쇠와 겹치지 않게) */
export const PANEL_INSET = 24;
/** 화면 가장자리에서 이만큼 안쪽까지만 건물을 "보인다"로 본다 */
export const VIEWPORT_MARGIN = 8;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function computeTargetLine(
  target: ScreenPoint | null,
  viewport: { width: number; height: number },
  panel: ScreenRect | null,
): TargetLine | null {
  if (!target || !panel) return null;
  const { x, y } = target;
  const m = VIEWPORT_MARGIN;
  if (x < m || y < m || x > viewport.width - m || y > viewport.height - m) return null;
  const insidePanel = x >= panel.left && x <= panel.right && y >= panel.top && y <= panel.bottom;
  if (insidePanel) return null;

  const label = { labelX: x + 20, labelY: y - 20 };
  if (panel.top > y) {
    return {
      x1: x,
      y1: y,
      x2: clamp(x, panel.left + PANEL_INSET, panel.right - PANEL_INSET),
      y2: panel.top,
      ...label,
      orientation: "vertical",
    };
  }
  if (panel.left > x) {
    return {
      x1: x,
      y1: y,
      x2: panel.left,
      y2: clamp(y, panel.top + PANEL_INSET, panel.bottom - PANEL_INSET),
      ...label,
      orientation: "horizontal",
    };
  }
  return null;
}

/** 37.371, -121.964 → "37.37N 121.96W" (조준선 옆 작은 글씨) */
export function formatLatLng(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}${ns} ${Math.abs(lng).toFixed(2)}${ew}`;
}
