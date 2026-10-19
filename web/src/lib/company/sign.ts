import type { BuildingDimensions } from "./buildingSpec";

/** 간판 폰트 (public/fonts, SIL OFL) — 영문 대문자·숫자·기호만 */
export const SIGN_FONT_URL = "/fonts/BebasNeue.woff";

/** Bebas Neue 대문자 한 글자 폭 ≈ 글자 크기의 0.45배 (여유 있게 잡은 값) */
export const SIGN_CHAR_WIDTH_EM = 0.45;
/** 간판 판 좌우·상하 여백 (글자 크기 배수) */
export const SIGN_PADDING_EM = 0.35;

export interface SignDimensions {
  fontSize: number;
  plateWidth: number;
  plateHeight: number;
  /** 간판 중심 y (건물 원점 기준) */
  centerY: number;
}

/** 티커 길이와 건물 치수 → 간판 크기·위치 */
export function getSignDimensions(ticker: string, building: BuildingDimensions): SignDimensions {
  const fontSize = building.signFontSize;
  const padding = fontSize * SIGN_PADDING_EM;
  const plateWidth = Math.max(1, ticker.length) * fontSize * SIGN_CHAR_WIDTH_EM + padding * 2;
  const plateHeight = fontSize + padding * 2;
  return { fontSize, plateWidth, plateHeight, centerY: building.labelY + plateHeight / 2 };
}

export interface BadgeLayout {
  text: string;
  radius: number;
  /** 간판 중심 기준 x (간판 오른쪽 위 모서리에 걸침) */
  x: number;
  y: number;
  fontSize: number;
}

/** 클러스터 대표 간판에 붙는 "+N" 동그라미 배지 */
export function getBadgeLayout(sign: SignDimensions, hiddenCount: number): BadgeLayout {
  const radius = sign.plateHeight * 0.45;
  return {
    text: `+${hiddenCount}`,
    radius,
    x: sign.plateWidth / 2,
    y: sign.plateHeight / 2,
    fontSize: radius * 1.1,
  };
}
