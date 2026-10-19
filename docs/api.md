# API 계약 (프론트 ↔ 스프링 서버)

이 문서와 `src/types/index.ts`가 프론트·서버 공통 계약이다.
서버 DTO는 여기 적힌 JSON 모양을 그대로 따르고, 바꿔야 하면 **이 문서와 타입을 먼저** 고친다.

## 원칙
- 1단계 정적 JSON(`src/data/*.json`)과 **응답 모양이 같다.** 프론트는 파일 읽기를 API 호출로 바꾸기만 한다.
- **공개 가능한 무료 데이터만 쓴다** (`docs/data-sources.md`): SEC EDGAR, FRED 공공 시리즈, 한국수출입은행. 주가·시총·거래량은 응답에 없다.
- 읽기 전용 공개 API. 로그인 없음.
- 경로 앞에 `/api/v1`.

## 공통 규칙
| 항목 | 규칙 |
|---|---|
| 필드 이름 | camelCase |
| 날짜 | `"YYYY-MM-DD"` 문자열 (미국 동부 기준 거래일) |
| 금액 | 달러 단위 **숫자** (천 달러 아님). 예: 시총 `4000000000000` |
| 비율 | 소수. 예: 상대 거래량 `1.3` = 평소의 1.3배 |
| 없는 값 | `null` (필드는 빼지 않는다) |
| 티커 | 응답은 대문자. 요청 경로는 대소문자 무시 (`/companies/nvda` 가능) |
| 캐시 | 데이터가 하루 한 번 바뀌므로 `Cache-Control: public, max-age=300` |
| CORS | 프론트 주소만 허용 (`http://localhost:3000`, 배포 주소) |

### 에러
```json
{ "error": { "code": "COMPANY_NOT_FOUND", "message": "ticker XYZ not found" } }
```
| 상태 | code | 언제 |
|---|---|---|
| 400 | `INVALID_PARAMETER` | 쿼리 값이 잘못됨 (`period=weekly` 등) |
| 401 | `UNAUTHORIZED` | 관리자 API 키가 없거나 틀림 |
| 404 | `COMPANY_NOT_FOUND` | 없는 티커 |
| 409 | `CONFLICT` | 관리자: 수집이 이미 진행 중, 이미 등록된 티커 |
| 503 | `DATA_NOT_READY` | 아직 한 번도 수집되지 않은 데이터 (예: 첫 배포 직후 시장 날씨). 프론트는 기본 화면으로 대체 |
| 500 | `INTERNAL_ERROR` | 그 외 |

---

## 1단계 대체 (지도에 필요한 것)

### `GET /api/v1/companies`
지도에 올릴 전체 기업. `companies.json`과 같은 모양 → 타입 `CompanyDataset`.
```json
{
  "asOf": "2026-10-16",
  "companies": [
    {
      "ticker": "NVDA",
      "name": "NVIDIA",
      "nameKo": "엔비디아",
      "sector": "tech",
      "hq": { "city": "Santa Clara", "state": "CA", "lat": 37.3707, "lng": -121.9638 },
      "revenueTtmUsd": 200000000000,
      "netIncomeTtmUsd": 105000000000,
      "totalAssetsUsd": 140000000000,
      "operatingMarginTtm": 0.62,
      "revenueGrowthYoy": 0.55,
      "publicFloatUsd": 2900000000000,
      "publicFloatAsOf": "2026-07-27",
      "filings30d": { "material": 3, "insider": 14 },
      "memo": null
    }
  ]
}
```
- `asOf`: 데이터 갱신일 = 기업 지표가 마지막으로 갱신된 날 (미국 동부 날짜). 아직 지표가 하나도 없으면 오늘 날짜
- 정렬: 티커 오름차순 (화면 정렬은 프론트가 높이 기준대로 한다)
- 지표가 아직 없는 기업도 목록에 나온다: 지표는 전부 `null`, `filings30d`는 `{ "material": 0, "insider": 0 }`
- `revenueTtmUsd`: **최근 4개 분기 매출 합** (SEC `companyfacts`, 서버 계산). 정리 못 하면 `null`
  - 매출 항목 후보(순서대로): `Revenues`(있으면 총매출 줄) → `RevenueFromContractWithCustomerExcludingAssessedTax` → `SalesRevenueNet` → `…IncludingAssessedTax`. 은행(SIC 6020~6029·6035·6036)은 `RevenuesNetOfInterestExpense` → `Revenues`
  - 10-K는 연간 값만 있으므로 4분기 = 연간 − (1~3분기 합). 네 분기 합이 항상 연간과 같다
  - 값은 정기 보고서(10-K·10-Q, 정정본 포함)에서만 (위임장 등의 반올림 값 제외)
  - 규칙 전체: `server/.../financial/PeriodNormalizer.java`, 버전 `FinancialCalc.VERSION`
  - 기간은 `fy`·`fp`가 아니라 `start`·`end` 날짜로 판정 (`data-sources.md`의 SEC 함정 참고)
- `netIncomeTtmUsd`: 최근 4분기 순이익 합 (`NetIncomeLoss`), 적자면 음수
- `totalAssetsUsd`: 가장 최근 분기말 총자산 (`Assets`, 시점 값이라 합산하지 않음)
- `operatingMarginTtm`: 최근 4분기 영업이익(`OperatingIncomeLoss`) ÷ 매출. 은행처럼 영업이익 개념이 다르면 `null`
- `revenueGrowthYoy`: 최근 4분기 매출 ÷ 그 직전 4분기 매출 − 1. 직전 데이터가 없으면 `null`
- `publicFloatUsd` / `publicFloatAsOf`: 10-K 표지의 `dei:EntityPublicFloat`(내부자 지분 제외 시가총액)와 그 기준일. **연 1회, 반기 말 기준**이라 현재 시총과 다를 수 있다. 화면에 기준일과 함께 표시
- `filings30d`: 최근 30일 공시 건수 (SEC `submissions`의 최근 공시 목록, 서버 계산)
  - `material` = 폼 `8-K`·`8-K/A` 건수, `insider` = 폼 `4`·`4/A` 건수

### `GET /api/v1/regions`
→ 타입 `Region[]`. `regions.json`과 같은 모양.
```json
[{ "id": "silicon-valley", "label": "실리콘밸리", "lat": 37.4, "lng": -122.05, "radiusKm": 40 }]
```

### `GET /api/v1/market-weather`
→ 타입 `MarketWeather`. `marketWeather.json`과 같은 모양. 0~100, **높을수록 안정(맑음)**.
```json
{ "value": 64, "asOf": "2026-10-09" }
```
- 서버 계산 (초안): `value = clamp(50 − STLFSI × 20, 0, 100)`
  - STLFSI = 세인트루이스 연준 금융스트레스 지수 (FRED `STLFSI4`, 주간, 0이 평소). 예: −0.72 → 64(안정), 0 → 50(보통), 1.25 → 25(불안 경계)
  - 계수는 과거 분포 보고 조정. 나중에 금리차 등 다른 공공 지표를 섞을 수 있게 계산을 한 곳에 모은다
- `asOf`: 지수의 기준 주(금요일). 가장 최근 기준일 값 하나를 내려준다
- 아직 값이 없으면 503 `DATA_NOT_READY`

---

## 2단계 이후 (기업 상세)

### `GET /api/v1/companies/{ticker}`
건물 클릭 → 상세 화면. → 타입 `CompanyDetail`
```json
{
  "company": { "ticker": "NVDA", "name": "NVIDIA", "...": "GET /companies 항목과 같은 모양" },
  "profile": {
    "cik": "0001045810",
    "exchange": "Nasdaq",
    "sicCode": "3674",
    "sicDescription": "Semiconductors & Related Devices",
    "fiscalYearEnd": "0126",
    "descriptionKo": "GPU·AI 가속기 설계 기업"
  },
  "latestAnnual": { "...": "FinancialStatement, 가장 최근 연간" },
  "latestQuarter": { "...": "FinancialStatement, 가장 최근 분기" },
  "recentFilings": [
    { "form": "8-K", "filedAt": "2026-08-27", "url": "https://www.sec.gov/Archives/edgar/data/..." }
  ]
}
```
- `profile`: SEC `submissions` 기본 정보 + `descriptionKo`(직접 작성한 한글 한 줄 소개, 없으면 `null`)
- `fiscalYearEnd`: 회계연도 마감 `MMDD` — 화면에서 "회계연도 1월 말 마감"처럼 안내해 날짜 혼동을 막는다
- `recentFilings`: 최근 공시 최신순 최대 20건, SEC 원문 링크 포함 ("최근 소식" 목록)
- `profile`, `latestAnnual`, `latestQuarter`는 아직 수집 안 됐으면 `null`, `recentFilings`는 빈 배열

### `GET /api/v1/companies/{ticker}/financials?period=quarterly&limit=8`
재무제표 목록, **최신순**. → 타입 `FinancialStatement[]`
| 쿼리 | 값 | 기본 |
|---|---|---|
| `period` | `quarterly` \| `annual` | `quarterly` |
| `limit` | 1~40 | 8 |

```json
[
  {
    "fiscalYear": 2026,
    "fiscalPeriod": "Q2",
    "periodEnd": "2026-07-26",
    "filedAt": "2026-08-27",
    "revenue": 46700000000,
    "grossProfit": 33800000000,
    "operatingIncome": 28400000000,
    "netIncome": 26400000000,
    "epsDiluted": 1.08,
    "totalAssets": 140700000000,
    "totalLiabilities": 40600000000,
    "totalEquity": 100100000000,
    "operatingCashFlow": 15400000000,
    "capitalExpenditure": 1900000000,
    "freeCashFlow": 13500000000
  }
]
```
- 숫자는 **예시** (실제 값 아님)
- `fiscalPeriod`: 분기면 `Q1`~`Q4`, 연간이면 `FY`. 회계연도는 기업마다 달라서 달력 분기와 다를 수 있음
- 같은 기간이 여러 공시에 나오면 `filedAt`이 가장 최근인 값(정정 반영)을 쓴다
- `freeCashFlow` = `operatingCashFlow` − `capitalExpenditure` (서버가 계산)
- 원본에 없는 항목은 `null`
- `totalLiabilities`: 부채 합계를 공시하지 않는 기업(아마존·코카콜라)은 총자산 − 자본(비지배지분 포함)
- `epsDiluted`: 4분기는 직접 공시가 없으면 `null` (주당 값은 빼서 만들 수 없다)

### `GET /api/v1/macro` (예정)
매크로 전광판·랜드마크용 지표. 공개 가능한 것만: 미국채 2년·10년, 장단기 금리차, 실효 기준금리, WTI, 천연가스(헨리허브), 달러 가치(Broad), 원/달러. 랜드마크 작업 때 확정한다.

## 관리자 API (`/api/admin/**`)
공개 API 가 아니다. 헤더 `X-Admin-Key` 필수 (서버 환경변수 `ADMIN_API_KEY`, 비어 있으면 전부 401). CORS 없음, 캐시 금지.

| 요청 | 하는 일 | 응답 |
|---|---|---|
| `POST /api/admin/sec-sync` 본문 `{"tickers":["AAPL"]}` (없으면 전체) | SEC 수집 백그라운드 시작 | 202 + 상태. 이미 돌고 있으면 409 |
| `GET /api/admin/sec-sync` | 마지막(진행 중) 수집 상태 `{running, trigger, startedAt, finishedAt, result:{succeeded, failed[{ticker, reason}]}, error}` | 200 |
| `GET /api/admin/quality-issues` | 확인이 필요한 기업 `[{ticker, code, detail, calcVersion, detectedAt}]` | 200 |
| `POST /api/admin/companies` 본문 `{"ticker":"COST","nameKo":"코스트코","sector":null}` | 티커로 등록: SEC 이름·본사 주소 → 좌표(인구조사국 지오코더, 안 되면 우편번호 중심), 섹터 없으면 SIC 로 추정 | 201 `{ticker, name, nameKo, sector, hqCity, hqState, lat, lng, locationPrecision}` |

- 매일 수집: 평일 미국 동부 22:15 (`prod` 프로필에서만). 수동 실행과 겹치면 하나만
- 품질 코드: `NO_REVENUE` `NO_TTM` `NO_QUARTERS` `STALE` `FACTS_BEHIND_FILINGS` `REVENUE_JUMP` `NEGATIVE_REVENUE` `MISSING_QUARTERS` `QUARTER_SUM_MISMATCH` `HQ_FAR_FROM_SEC_ADDRESS`

## 출처 표기 (화면 하단 고정)
- "데이터: U.S. SEC EDGAR, FRED®(Federal Reserve Bank of St. Louis), 한국수출입은행"
- FRED 필수 문구: "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." + FRED 약관 링크
- "투자 권유가 아닌 정보 제공 목적입니다"
