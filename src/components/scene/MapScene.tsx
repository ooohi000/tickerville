"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState, useSyncExternalStore } from "react";
import { Building } from "@/components/building/Building";
import { RegionLabel } from "@/components/cluster/RegionLabel";
import { UsMap } from "@/components/map/UsMap";
import { Sky } from "@/components/scene/sky/Sky";
import { ClusterListPanel } from "@/components/ui/ClusterListPanel";
import { FearGreedBadge } from "@/components/ui/FearGreedBadge";
import dataset from "@/data/companies.json";
import fearGreedData from "@/data/fearGreed.json";
import regionsData from "@/data/regions.json";
import { assignRegions } from "@/lib/cluster/assignRegions";
import { getHiddenCounts, getVisibilityModes } from "@/lib/cluster/visibility";
import { projectLatLng } from "@/lib/geo/project";
import { parseFearGreedOverride } from "@/lib/weather/weather";
import type { CompanyDataset, FearGreed, Region } from "@/types";

const { companies } = dataset as CompanyDataset;

// 정적 데이터라 모듈 로드 시 한 번만 계산
const assignment = assignRegions(companies, regionsData as Region[]);
const visibilityModes = getVisibilityModes(assignment);
const hiddenCounts = getHiddenCounts(assignment);

// 개발용 ?fg=10 날씨 미리보기. 주소는 바뀌지 않으니 구독할 것이 없다
const noopSubscribe = () => () => {};
const readFearGreedOverride = () => parseFearGreedOverride(window.location.search);
const serverFearGreedOverride = () => null;

/**
 * 하늘 + 바다 + 미국 지도 + 건물 + 지역 이름표, 그리고 화면 위 공포·탐욕 표시·목록 패널.
 */
export function MapScene() {
  const [openRegionId, setOpenRegionId] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  // 서버에서는 null, 브라우저에서 주소를 읽는다 (hydration 어긋남 없음)
  const override = useSyncExternalStore(
    noopSubscribe,
    readFearGreedOverride,
    serverFearGreedOverride,
  );
  const fearGreed: FearGreed =
    override !== null ? { value: override, asOf: "미리보기" } : (fearGreedData as FearGreed);

  const openGroup = assignment.groups.find((g) => g.region.id === openRegionId) ?? null;

  return (
    <>
      <Canvas
        camera={{ position: [0, 70, 70], fov: 45 }}
        shadows
        // 빈 곳(바다·땅) 클릭하면 목록만 닫는다. 선택은 유지
        onPointerMissed={() => setOpenRegionId(null)}
      >
        <Sky fearGreedValue={fearGreed.value} />

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
              visibilityMode={visibilityModes.get(c.ticker)}
              hiddenCount={hiddenCounts.get(c.ticker)}
              highlighted={selectedTicker === c.ticker}
              onSelect={setSelectedTicker}
            />
          );
        })}

        {assignment.groups.map((g) => (
          <RegionLabel
            key={g.region.id}
            group={g}
            active={openRegionId === g.region.id}
            onOpen={setOpenRegionId}
          />
        ))}

        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} />
      </Canvas>

      <FearGreedBadge data={fearGreed} />
      {openGroup && (
        <ClusterListPanel
          key={openGroup.region.id}
          group={openGroup}
          selectedTicker={selectedTicker}
          onSelect={setSelectedTicker}
          onClose={() => setOpenRegionId(null)}
        />
      )}
    </>
  );
}
