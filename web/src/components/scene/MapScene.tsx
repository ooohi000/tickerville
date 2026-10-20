"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Building } from "@/components/building/Building";
import { CameraFit } from "@/components/scene/CameraFit";
import { CompanyDetailPanel } from "@/components/detail/CompanyDetailPanel";
import { RegionLabel } from "@/components/cluster/RegionLabel";
import { UsMap } from "@/components/map/UsMap";
import { Sky } from "@/components/scene/sky/Sky";
import { ClusterListPanel } from "@/components/ui/ClusterListPanel";
import { MarketClockBadge } from "@/components/ui/MarketClockBadge";
import { MarketWeatherBadge } from "@/components/ui/MarketWeatherBadge";
import { SampleDataNotice } from "@/components/ui/SampleDataNotice";
import { SizeMetricToggle } from "@/components/ui/SizeMetricToggle";
import { TopLeftHud } from "@/components/ui/TopLeftHud";
import { buildSizeViews } from "@/lib/cluster/sizeViews";
import { DEFAULT_SIZE_METRIC, type SizeMetricId } from "@/lib/company/sizeMetric";
import { projectLatLng } from "@/lib/geo/project";
import { parseWeatherOverride } from "@/lib/weather/weather";
import { panDelta } from "@/lib/camera/pan";
import type { Company, MarketWeather, Region } from "@/types";

// 개발용 ?mw=10 날씨 미리보기. 주소는 바뀌지 않으니 구독할 것이 없다
const noopSubscribe = () => () => {};
const readWeatherOverride = () => parseWeatherOverride(window.location.search);
const serverWeatherOverride = () => null;

export interface MapSceneProps {
  companies: Company[];
  regions: Region[];
  marketWeather: MarketWeather;
  /** 서버 대신 번들 샘플을 보여주는 중이면 true → 왼쪽 위에 안내 */
  usingSample: boolean;
}

/**
 * 하늘 + 바다 + 미국 지도 + 건물 + 지역 이름표, 그리고 화면 위 시장 날씨 표시·목록 패널.
 * 데이터는 page.tsx(서버)가 API 에서 받아 넘긴다. 실패 시 대체는 lib/api/mapData.
 */
export function MapScene({ companies, regions, marketWeather: apiWeather, usingSample }: MapSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [openRegionId, setOpenRegionId] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [sizeMetric, setSizeMetric] = useState<SizeMetricId>(DEFAULT_SIZE_METRIC);
  // 높이 기준별 묶음 결과. 데이터가 바뀔 때만 다시 계산
  const views = useMemo(() => buildSizeViews(companies, regions), [companies, regions]);
  const { assignment, visibilityModes, hiddenCounts } = views[sizeMetric];
  // 서버에서는 null, 브라우저에서 주소를 읽는다 (hydration 어긋남 없음)
  const override = useSyncExternalStore(
    noopSubscribe,
    readWeatherOverride,
    serverWeatherOverride,
  );
  const marketWeather: MarketWeather =
    override !== null ? { value: override, asOf: "미리보기" } : apiWeather;

  const openGroup = assignment.groups.find((g) => g.region.id === openRegionId) ?? null;

  // 상세 패널: 건물·목록 어디서 눌러도 같은 패널. 지역에 속한 기업이면 "← 지역 목록"으로 돌아갈 수 있다
  const [detailTicker, setDetailTicker] = useState<string | null>(null);
  const detailGroup = detailTicker
    ? (assignment.groups.find((g) => g.companies.some((c) => c.ticker === detailTicker)) ?? null)
    : null;
  const openDetail = (ticker: string) => {
    setSelectedTicker(ticker);
    setDetailTicker(ticker);
    setOpenRegionId(null);
  };
  const openRegion = (regionId: string) => {
    setDetailTicker(null);
    setOpenRegionId(regionId);
  };

  const zoom = (controls: OrbitControlsImpl, factor: number) => {
    const dir = new Vector3().subVectors(controls.object.position, controls.target);
    dir.multiplyScalar(factor);
    controls.object.position.copy(controls.target).add(dir);
    controls.update();
  };

  // 화면 기준 이동: 위 = 지금 화면의 위쪽 (지도를 돌려도 같다). 계산은 lib/camera/pan
  const pan = (controls: OrbitControlsImpl, screenRight: number, screenUp: number) => {
    const delta = panDelta(controls.object.position, controls.target, screenRight, screenUp);
    controls.object.position.add(delta);
    controls.target.add(delta);
    controls.update();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = controlsRef.current;
      if (!c) return;

      const step = 3;
      if (e.key === "+" || e.key === "=") zoom(c, 1 / 1.15);
      else if (e.key === "-" || e.key === "_") zoom(c, 1.15);
      else if (e.key === "0") c.reset();
      else if (e.key === "ArrowLeft") pan(c, -step, 0);
      else if (e.key === "ArrowRight") pan(c, +step, 0);
      else if (e.key === "ArrowUp") pan(c, 0, +step);
      else if (e.key === "ArrowDown") pan(c, 0, -step);
    };

    // 처음 상태 저장: 이 effect 가 돌 때 controlRef 는 이미 채워져 있음
    controlsRef.current?.saveState();

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Canvas
        camera={{ position: [0, 70, 70], fov: 45 }}
        shadows
        // 빈 곳(바다·땅) 클릭하면 지역 목록만 닫는다. 상세 패널과 선택은 유지 (지도를 돌리다 닫히지 않게)
        onPointerMissed={() => setOpenRegionId(null)}
      >
        <Sky weatherIndex={marketWeather.value} />

        {/* 바다 — 땅 아래에 깔린 넓은 판. 색은 초안 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#2a5a7a" />
        </mesh>
        <UsMap />

        {companies.map((c) => {
          const p = projectLatLng(c.hq.lat, c.hq.lng);
          if (!p) return null;
          return (
            <Building
              key={c.ticker}
              company={c}
              position={p}
              sizeMetric={sizeMetric}
              visibilityMode={visibilityModes.get(c.ticker)}
              hiddenCount={hiddenCounts.get(c.ticker)}
              highlighted={selectedTicker === c.ticker}
              onSelect={openDetail}
            />
          );
        })}

        {assignment.groups.map((g) => (
          <RegionLabel
            key={g.region.id}
            group={g}
            active={openRegionId === g.region.id || detailGroup?.region.id === g.region.id}
            onOpen={openRegion}
          />
        ))}

        <OrbitControls
          ref={controlsRef}
          minDistance={20}
          maxDistance={200}
          makeDefault
          maxPolarAngle={Math.PI / 2.2}
        />
        {/* 첫 화면 구도 (화면 비율에 맞춰 본토 전체) — 0 키가 여기로 돌아온다 */}
        <CameraFit />
      </Canvas>

      <TopLeftHud>
        {usingSample && <SampleDataNotice />}
        <MarketClockBadge />
        <MarketWeatherBadge data={marketWeather} />
        <SizeMetricToggle value={sizeMetric} onChange={setSizeMetric} />
      </TopLeftHud>
      {detailTicker ? (
        <CompanyDetailPanel
          key={detailTicker}
          ticker={detailTicker}
          onClose={() => setDetailTicker(null)}
          onBack={detailGroup?.isCluster ? () => openRegion(detailGroup.region.id) : undefined}
          backLabel={detailGroup ? `${detailGroup.region.label} 목록` : undefined}
        />
      ) : (
        openGroup && (
          <ClusterListPanel
            key={openGroup.region.id}
            group={openGroup}
            sizeMetric={sizeMetric}
            selectedTicker={selectedTicker}
            onSelect={openDetail}
            onClose={() => setOpenRegionId(null)}
          />
        )
      )}
    </>
  );
}
