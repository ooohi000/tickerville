"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Building } from "@/components/building/Building";
import { UsMap } from "@/components/map/UsMap";
import dataset from "@/data/companies.json";
import regionsData from "@/data/regions.json";
import { assignRegions } from "@/lib/cluster/assignRegions";
import { getSignModes } from "@/lib/company/sign";
import { projectLatLng } from "@/lib/geo/project";
import type { CompanyDataset, Region } from "@/types";

const { companies } = dataset as CompanyDataset;
// 정적 데이터라 모듈 로드 시 한 번만 계산
const signModes = getSignModes(assignRegions(companies, regionsData as Region[]));

/**
 * 카메라 + 조명 + 바다 + 미국 지도 + 건물 + 컨트롤.
 */
export function MapScene() {
  return (
    <Canvas camera={{ position: [0, 70, 70], fov: 45 }} shadows>
      <color attach="background" args={["#0e1116"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[30, 60, 20]} intensity={1.2} castShadow />

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
          <Building key={c.ticker} company={c} position={p} signMode={signModes.get(c.ticker)} />
        );
      })}

      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} />
    </Canvas>
  );
}
