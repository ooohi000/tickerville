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
| 404 | `COMPANY_NOT_FOUND` | 없는 티커 |
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
      "filings30d": { "material": 3, "insider": 14 },
      "memo": null
    }
  ]
}
```
- `asOf`: 데이터 갱신일
- `revenueTtmUsd`: **최근 4개 분기 매출 합** (SEC `companyfacts`, 서버 계산). 정리 못 하면 `null`
  - 매출 항목 후보(순서대로): `RevenueFromContractWithCustomerExcludingAssessedTax` → `Revenues` → `SalesRevenueNet`. 은행 등 금융사는 별도 규칙 필요
  - 10-K는 연간 값만 있으므로 4분기 = 연간 − (1~3분기)
  - 기간은 `fy`·`fp`가 아니라 `start`·`end` 날짜로 판정 (`data-sources.md`의 SEC 함정 참고)
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
- `asOf`: 지수의 기준 주(금요일)

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

### `GET /api/v1/macro` (예정)
매크로 전광판·랜드마크용 지표. 공개 가능한 것만: 미국채 2년·10년, 장단기 금리차, 실효 기준금리, WTI, 천연가스(헨리허브), 달러 가치(Broad), 원/달러. 랜드마크 작업 때 확정한다.

## 출처 표기 (화면 하단 고정)
- "데이터: U.S. SEC EDGAR, FRED®(Federal Reserve Bank of St. Louis), 한국수출입은행"
- FRED 필수 문구: "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." + FRED 약관 링크
- "투자 권유가 아닌 정보 제공 목적입니다"
