# US Stock Map

미국 기업 본사를 실제 미국 지도 위 3D 건물로 보여주는 서비스. SEC 공시와 연준 공개 지표로 만든다.

| 폴더 | 내용 | 실행 |
|---|---|---|
| [`web/`](./web) | Next.js + React Three Fiber 프론트 | `cd web && npm install && npm run dev` → http://localhost:3000 |
| [`server/`](./server) | Spring Boot API 서버 | `cp server/.env.example server/.env` (값 채우기) → `cd server && ./gradlew bootRun` (Docker 필요: PostgreSQL·Redis 자동 실행, Java 21 없으면 자동 설치) → http://localhost:8080 |
| [`docs/`](./docs) | 기획·API 계약·데이터 소스·체크리스트 | |

데이터: U.S. SEC EDGAR, FRED®(Federal Reserve Bank of St. Louis), 한국수출입은행. 투자 권유가 아닌 정보 제공 목적.
