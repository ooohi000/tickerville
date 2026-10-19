/**
 * 프로젝트 공통 타입 (계약).
 * 여기를 바꾸면 docs/spec.md의 "데이터 계약"도 같이 고친다.
 */

/** 시총 등급 — 건물 모양을 결정한다 (부루마블의 집/빌딩/호텔 느낌). */
export type MarketCapTier = "mega" | "large" | "mid" | "small";

export type Sector =
  | "tech"
  | "communication"
  | "consumer"
  | "finance"
  | "healthcare"
  | "industrial"
  | "energy"
  | "other";

/** 본사 위치. 위경도는 WGS84 십진수. */
export interface Headquarters {
  city: string;
  state: string; // 2글자 주 코드 (CA, WA ...)
  lat: number;
  lng: number;
}

export interface Company {
  ticker: string; // 대문자, 고유 키
  name: string;
  nameKo?: string;
  sector: Sector;
  hq: Headquarters;
  /** 달러 단위 시총 스냅샷 (실시간 아님) */
  marketCapUsd: number;
  /** 본인의 매수 관심도 0~1 — 건물 주변 땅 색 강도 */
  interest: number;
  /** 한 줄 메모. 상세 분석은 이후 단계 */
  memo?: string;
}

/** companies.json 파일 전체 형태 */
export interface CompanyDataset {
  asOf: string; // 시총 기준일 YYYY-MM-DD
  companies: Company[];
}

/** 클러스터 지역 (실리콘밸리, 시애틀 ...) — 지역 이름표로 표시 */
export interface Region {
  id: string;
  label: string; // 화면 표시 이름 (한글)
  lat: number;
  lng: number;
  /** 이 반경(km) 안의 본사는 이 지역에 묶인다 */
  radiusKm: number;
}

/** 지역 하나에 묶인 기업들. 기업이 1개 이상인 지역만 만들어진다. */
export interface RegionGroup {
  region: Region;
  /** 시총 내림차순. [0]이 대표 건물 */
  companies: Company[];
  /** MIN_CLUSTER_SIZE 이상이면 true → 대표 건물 + "+N" 배지 + 목록 */
  isCluster: boolean;
}

export interface RegionAssignment {
  /** regions.json 순서 유지 */
  groups: RegionGroup[];
  /** 어느 지역 반경에도 안 들어간 기업 (시총 내림차순) */
  standalone: Company[];
}

/** three.js 월드 좌표. y는 위쪽, 지도는 xz 평면에 눕는다. */
export interface WorldPoint {
  x: number;
  z: number;
}

/** CNN 공포·탐욕 지수 → 하늘 날씨 */
export type Weather = "storm" | "rain" | "cloudy" | "partlyCloudy" | "sunny";

export interface FearGreed {
  value: number; // 0~100
  asOf: string;
}
