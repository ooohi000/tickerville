import type { BuildingDimensions } from "./buildingSpec";

/**
 * 간판 폰트 (public/fonts, SIL OFL). Black Han Sans — 한글 2,581자 + 영문·숫자·기호.
 * 원본 TTF 1MB → 한글 음절·영문만 남긴 woff 290KB (pyftsubset).
 */
export const SIGN_FONT_URL = "/fonts/BlackHanSans.woff";

/** 글자 폭 (글자 크기 배수). Black Han Sans 실측: 한글 ≈0.84~0.86, 영문 대문자 평균 ≈0.70, 숫자 0.6, 공백 0.3 */
const CHAR_WIDTH_EM = { hangul: 0.86, upper: 0.72, other: 0.6, space: 0.3 } as const;
/** 간판 판 좌우·상하 여백 (글자 크기 배수) */
export const SIGN_PADDING_EM = 0.35;
/** 한 줄이 이 폭(글자 크기 배수)을 넘고 띄어쓰기가 있으면 두 줄로 */
export const SIGN_MAX_LINE_EM = 5.2;
export const SIGN_LINE_HEIGHT = 1.1;

/** 글자 하나의 폭 (em) */
function charWidthEm(ch: string): number {
  const code = ch.codePointAt(0) ?? 0;
  if (ch === " ") return CHAR_WIDTH_EM.space;
  if ((code >= 0xac00 && code <= 0xd7a3) || (code >= 0x3131 && code <= 0x318e)) return CHAR_WIDTH_EM.hangul;
  if (ch >= "A" && ch <= "Z") return CHAR_WIDTH_EM.upper;
  return CHAR_WIDTH_EM.other;
}

/** 글자들 폭 합 (em). 간판 판 크기를 정하는 데만 쓴다 (렌더링은 폰트가 한다) */
export function estimateTextEm(text: string): number {
  let total = 0;
  for (const ch of text) total += charWidthEm(ch);
  return total;
}

/**
 * 간판 줄 나누기: 길고 띄어쓰기가 있으면 두 줄 (가운데에 가장 가까운 띄어쓰기에서).
 * "텍사스 인스트루먼트" → ["텍사스", "인스트루먼트"], "엔비디아" → ["엔비디아"]
 */
export function getSignLines(label: string): string[] {
  const text = label.trim();
  if (estimateTextEm(text) <= SIGN_MAX_LINE_EM || !text.includes(" ")) return [text];
  const spaces = [...text].flatMap((ch, i) => (ch === " " ? [i] : []));
  const chars = [...text];
  let best = spaces[0];
  let bestDiff = Infinity;
  for (const i of spaces) {
    const diff = Math.abs(estimateTextEm(chars.slice(0, i).join("")) - estimateTextEm(chars.slice(i + 1).join("")));
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return [chars.slice(0, best).join(""), chars.slice(best + 1).join("")];
}

export interface SignDimensions {
  lines: string[];
  fontSize: number;
  plateWidth: number;
  plateHeight: number;
  /** 간판 중심 y (건물 원점 기준) */
  centerY: number;
}

/** 간판 글자(한글 이름)와 건물 치수 → 간판 줄·크기·위치 */
export function getSignDimensions(label: string, building: BuildingDimensions): SignDimensions {
  const fontSize = building.signFontSize;
  const padding = fontSize * SIGN_PADDING_EM;
  const lines = getSignLines(label);
  const widestEm = Math.max(1, ...lines.map(estimateTextEm));
  const plateWidth = widestEm * fontSize + padding * 2;
  const plateHeight = fontSize * (1 + (lines.length - 1) * SIGN_LINE_HEIGHT) + padding * 2;
  return { lines, fontSize, plateWidth, plateHeight, centerY: building.labelY + plateHeight / 2 };
}

export interface BadgeLayout {
  text: string;
  radius: number;
  /** 간판 중심 기준 x (간판 오른쪽 위 모서리에 걸침) */
  x: number;
  y: number;
  fontSize: number;
}

/** 클러스터 대표 간판에 붙는 "+N" 동그라미 배지. 두 줄 간판이어도 한 줄 높이 기준으로 */
export function getBadgeLayout(sign: SignDimensions, hiddenCount: number): BadgeLayout {
  const radius = sign.fontSize * (1 + SIGN_PADDING_EM * 2) * 0.45;
  return {
    text: `+${hiddenCount}`,
    radius,
    x: sign.plateWidth / 2,
    y: sign.plateHeight / 2,
    fontSize: radius * 1.1,
  };
}
