"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { IcosahedronGeometry, MeshStandardMaterial, type Group } from "three";
import { SKY_BOUNDS, getCloudLayout } from "@/lib/weather/sky";

/** 구름이 흘러가는 속도 (단위/초). 집에서 조정 */
const DRIFT_SPEED = 0.6;
/** 건물을 너무 가리지 않게 반투명. 집에서 조정 */
const CLOUD_OPACITY = 0.75;

export interface CloudsProps {
  count: number;
  color: string;
}

/** 로우폴리 구름. 지오메트리·재질은 모든 덩이가 공유하고, 동쪽으로 천천히 흘러간다 */
export function Clouds({ count, color }: CloudsProps) {
  const layout = useMemo(() => getCloudLayout(count), [count]);
  const geometry = useMemo(() => new IcosahedronGeometry(1, 1), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        flatShading: true,
        transparent: true,
        opacity: CLOUD_OPACITY,
        depthWrite: false,
      }),
    [],
  );
  const groups = useRef<(Group | null)[]>([]);

  useEffect(() => {
    material.color.set(color);
  }, [material, color]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, dt) => {
    const width = SKY_BOUNDS.maxX - SKY_BOUNDS.minX;
    for (const g of groups.current) {
      if (!g) continue;
      g.position.x += DRIFT_SPEED * dt;
      if (g.position.x > SKY_BOUNDS.maxX) g.position.x -= width;
    }
  });

  return (
    <group>
      {layout.map((cloud, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={[cloud.x, cloud.y, cloud.z]}
        >
          {cloud.puffs.map((p, j) => (
            <mesh
              key={j}
              geometry={geometry}
              material={material}
              position={[p.x, p.y, p.z]}
              scale={[p.radius, p.radius * 0.6, p.radius]}
              castShadow
            />
          ))}
        </group>
      ))}
    </group>
  );
}
