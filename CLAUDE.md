# US Stock Map — 모노레포

미국 기업 본사를 실제 미국 지도 위 3D 건물로 보여주는 서비스.
**공개 가능한 무료 데이터(SEC 공시, 연준 공개 지표)만 쓴다 — 월 $0, 주가·시총·거래량 표시 없음.**

## 구조
```
web/      Next.js 16 + React Three Fiber 프론트   → web/CLAUDE.md
server/   Spring Boot 4 + PostgreSQL + Redis 서버 → server/CLAUDE.md
docs/     공통 문서 (양쪽이 같이 본다)
  spec.md             기획·화면 요소·규칙 값
  api.md              프론트 ↔ 서버 API 계약 (단일 원본)
  data-sources.md     데이터 소스·비용·라이선스 결정
  checklist.md        진행 체크리스트
  request-template.md 이동 중 조각 요청 양식
```

## 공통 원칙
- **공통으로 뽑을 수 있는 건 최대한 공통으로 뽑는다.** 종류별로 따로 만들지 말고 하나 + 설정으로 분기.
- **API 계약이 먼저다.** 응답 모양을 바꾸면 `docs/api.md` → 프론트 타입(`web/src/types/index.ts`, `contract.test.ts`) → 서버 DTO 순서로 같이 고친다.
- 한 번에 기능 하나. 테스트 통과 → `docs/checklist.md` 체크 → 커밋.
- 커밋 메시지: `feat(web/map): ...`, `feat(server/sec): ...`, `docs: ...`
