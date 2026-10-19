# US Stock Map — 작업 규칙

관심 있는 미국 기업의 본사를 **실제 미국 지도** 위에 3D 건물로 보여주는 Next.js 앱.
기획 세부사항은 `docs/spec.md`, 공통 타입은 `src/types/index.ts`가 기준이다.

@AGENTS.md

## 스택 (버전 고정)
- Next.js 16 (App Router, `src/` 디렉터리), React 19, TypeScript strict
- three 0.186 + @react-three/fiber 9 + @react-three/drei 10
- d3-geo 3 (`geoAlbersUsa` 투영), topojson-client 3, us-atlas 3 (주 경계)
- 테스트: vitest 5
- 새 패키지는 먼저 이유를 말하고 허락받은 뒤 추가한다.

## 현재 단계: 1단계 (클라이언트 전용)
- 서버, API 라우트, DB 없음. 데이터는 `src/data/*.json` 정적 파일.
- 검색·스크리닝·재무제표·등락률 표시는 **만들지 않는다**.

## 폴더 구조
```
src/
  app/                 라우트 (page.tsx는 조립만)
  components/
    scene/             Canvas, 카메라, 조명, 하늘
    map/               미국 지도 메시
    building/          기업 건물, 티커 라벨, 하이라이트
    cluster/           클러스터 대표 건물, +N 배지, 지역 이름표
    ui/                2D 오버레이 (목록 패널 등)
  lib/                 순수 함수만 (React, three 객체 생성 금지)
    geo/               위경도 → 월드 좌표, 거리 계산
    company/           시총 등급, 정렬
    cluster/           지역 묶기
    weather/           공포·탐욕 → 날씨
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
- 타입을 바꿔야 하면 `src/types/index.ts`와 `docs/spec.md`를 같이 고친다.

## 명령어
- `npm run dev` 개발 서버
- `npm test` 테스트 1회 실행
- `npm run build` 빌드 확인

## 작업 방식
- 한 번에 기능 하나. 끝나면 테스트·빌드 통과 확인 → `docs/checklist.md` 체크 → 커밋.
- 커밋 메시지: `feat(map): ...`, `fix(cluster): ...`, `test(geo): ...`
- 이동 중에 만든 조각은 `docs/request-template.md` 형식으로 요청된다.
