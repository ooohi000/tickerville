import { mixHex } from "./color";
import { analystTitle } from "./progress";

/**
 * 시대 테마: 대통령(또는 애널리스트)을 고르면 그 시대 참모가 기업을 보고하고 조언한다.
 * 지도·건물 모양은 그대로, 패널 스킨(색·글씨체·문구)과 하늘·땅·바다 색만 바뀐다.
 * 색 토큰은 SidePanel.module.css 의 [data-era] 블록, 장면 색은 여기 scene 이 원본.
 * 기획: docs/spec.md "시대 테마"
 */

export const ERA_IDS = ["1795", "1863", "1905", "1935", "2026"] as const;
export type EraId = (typeof ERA_IDS)[number];

/** 처음 들어온 사람이 보는 테마 (지금 HUD) */
export const DEFAULT_ERA: EraId = "2026";

export interface EraScene {
  /** 하늘색: 시장 날씨 색을 이 색 쪽으로 섞는다 (null 이면 날씨 색 그대로) */
  sky: string | null;
  /** 0~1, 하늘을 sky 쪽으로 얼마나 섞을지 */
  skyMix: number;
  land: string;
  border: string;
  sea: string;
}

export interface EraSpec {
  id: EraId;
  year: number;
  /** 고르는 사람이 맡는 역할 — 대통령 4명 + 현재 애널리스트 */
  leader: { ko: string; en: string };
  /** 첫 화면 인사에서 부르는 호칭: "링컨 대통령님" */
  addressKo: string;
  roleKo: string;
  periodKo: string;
  /** 패널 머리 위 작은 글씨 (스킨마다 다르다) */
  eyebrow: string;
  /** 보고 말투: {name} 자리에 기업 이름 */
  briefingKo: string;
  /** 조언 버튼 / 조언 묶음 이름 */
  adviceButtonKo: string;
  adviceLabelKo: string;
  /** public/personas 이미지 이름 (전신 .webp, 얼굴 -face.webp) */
  image: string;
  /** 보고서 도장 (상세 패널을 열 때 찍힌다) */
  stamp: EraStamp;
  scene: EraScene;
}

export interface EraStamp {
  label: string;
  /** seal = 밀랍 동그라미, rect = 사각 고무도장, round = 동그란 금박 */
  shape: "seal" | "rect" | "round";
  color: string;
}

/** 지금 지도 색 (UsMap · 바다) — 2026 은 이것 그대로 */
export const BASE_SCENE: EraScene = {
  sky: null,
  skyMix: 0,
  land: "#7fae6a",
  border: "#4f7a45",
  sea: "#2a5a7a",
};

export const ERAS: Record<EraId, EraSpec> = {
  "1795": {
    id: "1795",
    year: 1795,
    leader: { ko: "조지 워싱턴", en: "George Washington" },
    addressKo: "워싱턴 대통령님",
    roleKo: "초대 대통령",
    periodKo: "건국기",
    eyebrow: "LEDGER OF COMPANIES · 1795",
    briefingKo: "워싱턴 대통령께 올리는 {name} 기록",
    adviceButtonKo: "참모의 조언 듣기",
    adviceLabelKo: "참모의 조언",
    image: "washington",
    stamp: { label: "SEALED", shape: "seal", color: "#9b2a1f" },
    scene: { sky: "#e9dcc0", skyMix: 0.55, land: "#a9a46c", border: "#6b5a34", sea: "#6f8f8a" },
  },
  "1863": {
    id: "1863",
    year: 1863,
    leader: { ko: "에이브러햄 링컨", en: "Abraham Lincoln" },
    addressKo: "링컨 대통령님",
    roleKo: "16대 대통령",
    periodKo: "철도와 전신",
    eyebrow: "TELEGRAM · 1863",
    briefingKo: "링컨 대통령께 드리는 전보 — {name}",
    adviceButtonKo: "참모 전보 받기",
    adviceLabelKo: "참모의 조언",
    image: "lincoln",
    stamp: { label: "RECEIVED", shape: "rect", color: "#1f3a5a" },
    scene: { sky: "#cfc6ad", skyMix: 0.45, land: "#98966a", border: "#4a4036", sea: "#4c6672" },
  },
  "1905": {
    id: "1905",
    year: 1905,
    leader: { ko: "시어도어 루스벨트", en: "Theodore Roosevelt" },
    addressKo: "시어도어 루스벨트 대통령님",
    roleKo: "26대 대통령",
    periodKo: "산업혁명",
    eyebrow: "THE TICKERVILLE GAZETTE",
    briefingKo: "루스벨트 대통령 책상 위의 1면 — {name}",
    adviceButtonKo: "오늘의 사설 한 줄",
    adviceLabelKo: "거물들의 조언",
    image: "t-roosevelt",
    stamp: { label: "APPROVED", shape: "rect", color: "#8b1e1e" },
    scene: { sky: "#9a968c", skyMix: 0.6, land: "#8c8a73", border: "#4a473d", sea: "#4f5f66" },
  },
  "1935": {
    id: "1935",
    year: 1935,
    leader: { ko: "프랭클린 루스벨트", en: "Franklin D. Roosevelt" },
    addressKo: "프랭클린 루스벨트 대통령님",
    roleKo: "32대 대통령",
    periodKo: "대공황과 뉴딜",
    eyebrow: "◆ FIRESIDE REPORT ◆",
    briefingKo: "루스벨트 대통령께 드리는 노변 보고 — {name}",
    adviceButtonKo: "라디오 한마디",
    adviceLabelKo: "참모의 조언",
    image: "fdr",
    stamp: { label: "FIRESIDE", shape: "round", color: "#d4af37" },
    scene: { sky: "#0e0d0b", skyMix: 0.7, land: "#3a3a2c", border: "#d4af37", sea: "#1c2a33" },
  },
  "2026": {
    id: "2026",
    year: 2026,
    leader: { ko: "애널리스트", en: "Analyst" },
    addressKo: "애널리스트님",
    roleKo: "당신",
    periodKo: "현재",
    eyebrow: "TARGET LOCKED",
    briefingKo: "리서치 노트 — {name}",
    adviceButtonKo: "멘토의 한마디",
    adviceLabelKo: "멘토의 한마디",
    image: "analyst",
    stamp: { label: "VERIFIED · SEC", shape: "rect", color: "#4fd8ff" },
    scene: BASE_SCENE,
  },
};

/** 하늘색: 시장 날씨 색을 시대 색 쪽으로 섞는다 (날씨 느낌은 남는다) */
export function eraSkyColor(weatherSky: string, scene: EraScene): string {
  return scene.sky === null ? weatherSky : mixHex(weatherSky, scene.sky, scene.skyMix);
}

/** 조언 전체 수 (src/data/advice 합계, advice.test 가 맞는지 확인) — 직급 안내 "읽은 조언 12/385" */
export const ADVICE_TOTAL = 385;

export function isEraId(value: unknown): value is EraId {
  return typeof value === "string" && (ERA_IDS as readonly string[]).includes(value);
}

export function getEra(id: EraId): EraSpec {
  return ERAS[id];
}

/** 첫 화면 제목: "링컨 대통령님, 보고드립니다" */
export function formatGreeting(era: EraSpec, analystName: string | null = null): string {
  const who = era.id === DEFAULT_ERA ? `${analystTitle(analystName)}님` : era.addressKo;
  return `${who}, 보고드립니다`;
}

/** 서비스 대표 문구 (소개 페이지·링크 미리보기처럼 캐릭터가 없는 곳) */
export const TAGLINE_KO = "대통령님, 보고드립니다";

export function formatBriefing(era: EraSpec, name: string): string {
  return era.briefingKo.replace("{name}", name);
}

/** 그 시대에 아직 없던 기업인가 (흐리게). 설립연도를 모르면 false */
export function isBeforeFounding(founded: number | null | undefined, eraYear: number): boolean {
  return founded != null && founded > eraYear;
}

/** 기업이 그 시대에 있었는가 — 설립연도를 모르면 null (흐리게 하지 않는다) */
export function describeFounding(founded: number | null | undefined, eraYear: number): { existed: boolean; text: string } | null {
  if (founded == null) return null;
  if (founded <= eraYear) return { existed: true, text: `${eraYear}년에도 있던 회사 · 설립 ${eraYear - founded + 1}년 차` };
  return { existed: false, text: `${eraYear}년엔 아직 없던 회사 · ${founded}년 설립 — ${founded - eraYear}년 뒤에 등장` };
}
