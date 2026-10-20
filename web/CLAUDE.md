# US Stock Map 프론트 (web/) — 작업 규칙

관심 있는 미국 기업의 본사를 **실제 미국 지도** 위에 3D 건물로 보여주는 Next.js 앱.
공통 문서는 레포 루트 `docs/` (기획 `../docs/spec.md`, API 계약 `../docs/api.md`). 공통 타입은 `src/types/index.ts`가 기준이다.
서버(`../server`)와의 계약은 `../docs/api.md` — 응답 모양을 바꾸면 이 문서·타입·`src/types/contract.test.ts`·서버 DTO를 같이 고친다.

@AGENTS.md

## 스택 (버전 고정)
- Next.js 16 (App Router, `src/` 디렉터리), React 19, TypeScript strict
- three 0.186 + @react-three/fiber 9 + @react-three/drei 10
- d3-geo 3 (`geoAlbersUsa` 투영), topojson-client 3, us-atlas 3 (주 경계)
- 테스트: vitest 5
- 새 패키지는 먼저 이유를 말하고 허락받은 뒤 추가한다.

## 현재 단계: 2단계 (서버 API 연결)
- 데이터는 Spring 서버 `GET /api/v1/*` 에서 받는다. `src/data/*.json`은 **서버가 꺼졌을 때의 샘플**로 남긴다.
- 첫 화면: `app/page.tsx` → `app/_data/getMapData.ts`(`"use cache"` + `cacheLife('minutes')`) → `lib/api/loadMapData` → `MapScene` props.
- 서버 주소: `TICKERVILLE_API_URL` (`.env.local`, 없으면 `http://localhost:8080`). Next 서버에서만 읽는다.
- 브라우저에서 부를 땐 상대 주소 `/api/v1/...` — `next.config.ts` rewrites 가 서버로 넘긴다 (CORS 불필요).
- API 호출은 `lib/api/endpoints.ts` 함수만 쓴다. 응답 모양은 `guards.ts`로 검사하고, 실패는 `ApiRequestError(code)`.
- 대체 규칙: 기업·지역 실패 → 샘플 + "샘플 데이터" 안내, 시장 날씨 503 `DATA_NOT_READY` → 기본 하늘(흐림 50).
- 주가·시총·거래량은 **표시하지 않는다**. 검색·스크리닝은 아직 만들지 않는다.

## 폴더 구조
```
src/
  app/                 라우트 (page.tsx는 조립만)
    _data/             서버 전용 데이터 함수 ("use cache")
  components/
    scene/             Canvas, 카메라, 공통 훅
      sky/             하늘 (조명, 구름, 비, 번개)
    map/               미국 지도 메시
    building/          기업 건물, 티커 라벨, 하이라이트
    cluster/           클러스터 대표 건물, +N 배지, 지역 이름표
    ui/                2D 오버레이 (목록 패널 등)
  lib/                 순수 함수만 (React, three 객체 생성 금지)
    api/               서버 주소·호출·응답 검사·대체 (fetch 는 주입받아 테스트)
    geo/               위경도 → 월드 좌표, 거리 계산
    company/           규모 등급(매출), 정렬, 공시 열기, 간판
    cluster/           지역 묶기
    weather/           시장 날씨 지수 → 날씨, 하늘 배치
    math/              시드 난수 등 범용
  data/                정적 JSON
  types/               공통 타입 (계약)
```

## 코드 규칙
- **공통으로 뽑을 수 있는 건 최대한 공통으로 뽑는다.** 종류별 컴포넌트를 따로 만들지 말고 컴포넌트 하나 + props + 설정 객체로 분기한다. (예: `Building` 하나에 `tier` prop, 모양 차이는 `BUILDING_SPECS[tier]`)
- 두 번 이상 쓰이는 값·로직은 상수나 `lib/` 함수로 올린다.
- **계산은 `lib/`, 그리기는 `components/`.** 컴포넌트 안에서 좌표·등급을 직접 계산하지 않는다.
- `lib/`의 모든 함수는 같은 폴더에 `*.test.ts`를 둔다.
- named export만 사용 (default export는 Next 라우트 파일만).
- three를 쓰는 컴포넌트 파일 맨 위에 `"use client"`.
- 좌표계: y가 위, 지도는 xz 평면. x는 동쪽(+), z는 남쪽(+). 미국 본토 폭 ≈ 100 단위.
- 타입을 바꿔야 하면 `src/types/index.ts`와 `../docs/spec.md`를 같이 고친다.

## 명령어
- `npm run dev` 개발 서버
- `npm test` 테스트 1회 실행
- `npm run build` 빌드 확인

## 작업 방식
- 한 번에 기능 하나. 끝나면 테스트·빌드 통과 확인 → `../docs/checklist.md` 체크 → 커밋.
- 커밋 메시지: `feat(map): ...`, `fix(cluster): ...`, `test(geo): ...`
- 이동 중에 만든 조각은 `../docs/request-template.md` 형식으로 요청된다.
- 테스트용 기업 목업은 `src/test/makeCompany.ts`만 쓴다 (필드가 늘면 여기만 고친다).
