/**
 * 프로젝트 공통 타입 (계약).
 * 여기를 바꾸면 docs/spec.md의 "데이터 계약"도 같이 고친다.
 */

/** 규모 등급 (최근 4분기 매출 기준) — 건물 모양을 결정한다 (부루마블의 집/빌딩/호텔 느낌). */
export type SizeTier = "mega" | "large" | "mid" | "small";

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
  nameKo?: string | null;
  sector: Sector;
  hq: Headquarters;
  /**
   * 최근 4분기 매출 합계(TTM, 달러). SEC 공시 기준. 건물 크기를 정한다.
   * 공시가 없거나 정리 못 하면 null → 가장 작은 건물
   */
  revenueTtmUsd: number | null;
  /** 최근 4분기 순이익 합계(TTM, 달러). 적자면 음수 */
  netIncomeTtmUsd: number | null;
  /** 최근 분기말 총자산(달러). 은행·보험처럼 매출보다 자산이 의미 있는 회사용 */
  totalAssetsUsd: number | null;
  /** 영업이익률(TTM) = 영업이익 ÷ 매출. 0.32 = 32%. 은행 등 계산 불가면 null */
  operatingMarginTtm: number | null;
  /** 매출 성장률 = 최근 4분기 매출 ÷ 직전 4분기 매출 − 1. 0.25 = +25% */
  revenueGrowthYoy: number | null;
  /** 공시상 유동 시가총액(달러) — 10-K 표지의 EntityPublicFloat. 연 1회, 반기 말 기준이라 오래된 값 */
  publicFloatUsd: number | null;
  /** publicFloatUsd 기준일 YYYY-MM-DD */
  publicFloatAsOf: string | null;
  /** 최근 30일 공시 활동. 건물 주변 땅 "열기"로 표시 */
  filings30d: FilingActivity;
  /** 한 줄 메모. 상세 분석은 이후 단계 */
  memo?: string | null;
}

/** 최근 공시 건수 (SEC submissions 기준) */
export interface FilingActivity {
  /** 8-K: 중요 사건 공시 (실적 발표, 경영진 변경, 인수합병 등) */
  material: number;
  /** Form 4: 임원·대주주 내부자 거래 신고 */
  insider: number;
}

/** companies.json 파일 전체 형태 */
export interface CompanyDataset {
  asOf: string; // 데이터 기준일 YYYY-MM-DD
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
  /** 현재 건물 크기 기준 내림차순. [0]이 대표 건물 */
  companies: Company[];
  /** MIN_CLUSTER_SIZE 이상이면 true → 대표 건물 + "+N" 배지 + 목록 */
  isCluster: boolean;
}

export interface RegionAssignment {
  /** regions.json 순서 유지 */
  groups: RegionGroup[];
  /** 어느 지역 반경에도 안 들어간 기업 (건물 크기 기준 내림차순) */
  standalone: Company[];
}

/** three.js 월드 좌표. y는 위쪽, 지도는 xz 평면에 눕는다. */
export interface WorldPoint {
  x: number;
  z: number;
}

// ─── 서버 API 응답 (docs/api.md) ───────────────────────────────

/** 분기 Q1~Q4, 연간 FY */
export type FiscalPeriod = "Q1" | "Q2" | "Q3" | "Q4" | "FY";

/** 재무제표 한 기간. 금액은 달러, 원본에 없으면 null */
export interface FinancialStatement {
  fiscalYear: number;
  fiscalPeriod: FiscalPeriod;
  periodEnd: string; // YYYY-MM-DD
  filedAt: string | null; // 공시일
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  epsDiluted: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  /** operatingCashFlow − capitalExpenditure (서버 계산) */
  freeCashFlow: number | null;
}

/** SEC submissions에서 오는 기본 정보 + 직접 쓴 한글 소개 */
export interface CompanyProfile {
  cik: string; // SEC 기업번호 10자리 (앞자리 0 포함)
  exchange: string | null; // NASDAQ, NYSE ...
  sicCode: string | null; // SEC 업종 코드
  sicDescription: string | null; // 업종 설명 (영문 원본)
  fiscalYearEnd: string | null; // 회계연도 마감 MMDD (예: "0928" = 9월 28일)
  /** 한 줄 소개 (직접 작성한 한글). 없으면 null */
  descriptionKo: string | null;
}

/** 최근 공시 한 건 */
export interface Filing {
  form: string; // "8-K", "4", "10-Q", "10-K" ...
  /** 8-K 항목 번호 "2.02,9.01" (2.02 = 실적 발표). 그 외 폼은 null */
  items: string | null;
  /** 서버가 붙인 한글 이름: "실적 발표", "내부자 거래", "분기 보고서" ... */
  labelKo: string;
  filedAt: string; // YYYY-MM-DD
  /** SEC 원문 링크 */
  url: string;
}

/** GET /api/v1/companies/{ticker} */
export interface CompanyDetail {
  company: Company;
  profile: CompanyProfile | null;
  latestAnnual: FinancialStatement | null;
  latestQuarter: FinancialStatement | null;
  /** 최근 공시 (최신순, 최대 20건) */
  recentFilings: Filing[];
  earnings: EarningsSummary;
}

/** BMO 장 시작 전 · DURING 장중 · AMC 장 마감 후 (미국 동부) */
export type EarningsTiming = "BMO" | "DURING" | "AMC";

export interface EarningsSummary {
  /** 가장 최근 실적 발표 (SEC 8-K 항목 2.02) */
  lastReported: { date: string; timing: EarningsTiming | null } | null;
  /** 다음 발표. EXPECTED 는 추정이라 화면에 "예상" 표시 필수 */
  next: { date: string; status: "EXPECTED" | "CONFIRMED"; source: "ESTIMATE" | "MANUAL" } | null;
}

export type ApiErrorCode =
  | "INVALID_PARAMETER"
  | "UNAUTHORIZED"
  | "COMPANY_NOT_FOUND"
  | "CONFLICT"
  | "DATA_NOT_READY"
  | "INTERNAL_ERROR";

export interface ApiError {
  error: { code: ApiErrorCode; message: string };
}

/** 시장 날씨 지수 → 하늘 날씨 */
export type Weather = "storm" | "rain" | "cloudy" | "partlyCloudy" | "sunny";

/**
 * 자체 "시장 날씨 지수". 0~100, 높을수록 시장이 안정(맑음).
 * 서버가 세인트루이스 연준 금융스트레스 지수(STLFSI) 등 공개 지표로 계산한다 (docs/api.md).
 */
export interface MarketWeather {
  value: number; // 0~100
  asOf: string;
}
