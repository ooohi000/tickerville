# API 계약 (프론트 ↔ 스프링 서버)

이 문서와 `src/types/index.ts`가 프론트·서버 공통 계약이다.
서버 DTO는 여기 적힌 JSON 모양을 그대로 따르고, 바꿔야 하면 **이 문서와 타입을 먼저** 고친다.

## 원칙
- 1단계 정적 JSON(`src/data/*.json`)과 **응답 모양이 같다.** 프론트는 파일 읽기를 API 호출로 바꾸기만 한다.
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
      "marketCapUsd": 4000000000000,
      "relativeVolume": 1.3,
      "memo": null
    }
  ]
}
```
- `asOf`: 시총·거래량 기준 거래일
- `relativeVolume`: 당일 거래량 ÷ 직전 20거래일 평균 거래량 (서버가 계산)

### `GET /api/v1/regions`
→ 타입 `Region[]`. `regions.json`과 같은 모양.
```json
[{ "id": "silicon-valley", "label": "실리콘밸리", "lat": 37.4, "lng": -122.05, "radiusKm": 40 }]
```

### `GET /api/v1/fear-greed`
→ 타입 `FearGreed`. `fearGreed.json`과 같은 모양.
```json
{ "value": 62, "asOf": "2026-10-16" }
```

---

## 2단계 이후 (기업 상세)

### `GET /api/v1/companies/{ticker}`
건물 클릭 → 상세 화면. → 타입 `CompanyDetail`
```json
{
  "company": { "ticker": "NVDA", "name": "NVIDIA", "...": "GET /companies 항목과 같은 모양" },
  "profile": {
    "description": "GPU·AI 가속기 설계 기업",
    "website": "https://www.nvidia.com",
    "employees": 36000,
    "exchange": "NASDAQ"
  },
  "latestAnnual": { "...": "FinancialStatement, 가장 최근 연간" },
  "latestQuarter": { "...": "FinancialStatement, 가장 최근 분기" }
}
```
- `profile`, `latestAnnual`, `latestQuarter`는 아직 수집 안 됐으면 `null`

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
- `freeCashFlow` = `operatingCashFlow` − `capitalExpenditure` (서버가 계산)
- 원본에 없는 항목은 `null`

### `GET /api/v1/companies/{ticker}/history?days=60` (예정)
일별 시총·거래량 추이. 차트용. 필요해지면 확정한다.
```json
[{ "date": "2026-10-16", "marketCapUsd": 4000000000000, "volume": 182000000, "relativeVolume": 1.3 }]
```
