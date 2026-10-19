"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import dataset from "@/data/companies.json";
import { projectLatLng } from "@/lib/geo/project";
import type { CompanyDataset } from "@/types";

const { companies } = dataset as CompanyDataset;

/**
 * M1 뼈대: 카메라 + 조명 + 바닥 + 컨트롤.
 * 기업 위치는 투영 확인용 임시 기둥 (M3에서 building/ 컴포넌트로 교체).
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
          <mesh key={c.ticker} position={[p.x, 1, p.z]} castShadow>
            <boxGeometry args={[0.6, 2, 0.6]} />
            <meshStandardMaterial color="#f5c542" />
          </mesh>
        );
      })}

      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} />
    </Canvas>
  );
}
