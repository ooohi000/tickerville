"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Building } from "@/components/building/Building";
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
 * M1 뼈대: 카메라 + 조명 + 바닥 + 컨트롤.
 * 바닥은 임시 (M2에서 미국 지도 메시로 교체).
 */
export function MapScene() {
  return (
    <Canvas camera={{ position: [0, 70, 70], fov: 45 }} shadows>
      <color attach="background" args={["#0e1116"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[30, 60, 20]} intensity={1.2} castShadow />

      {/* 임시 바닥 — M2에서 미국 지도 메시로 교체 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 90]} />
        <meshStandardMaterial color="#1f2a37" />
      </mesh>
      <gridHelper args={[140, 28, "#2f3b4a", "#26303c"]} position={[0, 0.01, 0]} />

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
