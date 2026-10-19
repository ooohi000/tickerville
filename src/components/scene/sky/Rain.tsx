"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { RAIN, fallY, getRainDropPositions } from "@/lib/weather/sky";

/** 색은 초안 — 집에서 조정 */
const RAIN_COLOR = "#a9c3dc";

/** 빗줄기. 방울마다 짧은 선분 하나, 위치는 매 프레임 버퍼만 갱신 (리렌더 없음) */
export function Rain() {
  const geometry = useMemo(() => {
    const drops = getRainDropPositions();
    const count = drops.length / 3;
    // 선분 = 위쪽 점 + 아래쪽 점
    const positions = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const [x, y, z] = [drops[i * 3], drops[i * 3 + 1], drops[i * 3 + 2]];
      positions.set([x, y, z, x, y - RAIN.length, z], i * 6);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    const attr = geometry.getAttribute("position") as BufferAttribute;
    const arr = attr.array as Float32Array;
    // 탭을 오래 비웠다 돌아오면 dt가 커지므로 한 프레임 이동량을 제한
    const step = Math.min(dt, 0.1);
    for (let i = 0; i < arr.length; i += 6) {
      const top = fallY(arr[i + 1], step);
      arr[i + 1] = top;
      arr[i + 4] = top - RAIN.length;
    }
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color={RAIN_COLOR} transparent opacity={0.6} />
    </lineSegments>
  );
}
