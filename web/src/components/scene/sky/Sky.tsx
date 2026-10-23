"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type AmbientLight, Fog, Vector3 } from "three";
import { getFogRange } from "@/lib/camera/fog";
import { BASE_SCENE, eraSkyColor, type EraScene } from "@/lib/era/eras";
import { getLightningIntensity } from "@/lib/weather/sky";
import { getWeatherSpec } from "@/lib/weather/weather";
import { Clouds } from "./Clouds";
import { Rain } from "./Rain";

/** 그림자가 지도 전체에 생기도록 그림자 카메라 범위를 넓힌다 */
const SHADOW_EXTENT = 70;

export interface SkyProps {
  /** 시장 날씨 지수 0~100 */
  weatherIndex: number;
  /** 시대 테마 장면 색 (하늘은 날씨 색과 섞는다) */
  scene?: EraScene;
}

/**
 * 시장 날씨 지수 → 하늘 전체 (배경색, 안개, 햇빛·주변광, 구름, 비, 번개).
 * 모든 값은 WEATHER_SPECS에서 오고, 여기서는 그리기만 한다.
 */
export function Sky({ weatherIndex, scene = BASE_SCENE }: SkyProps) {
  const spec = getWeatherSpec(weatherIndex);
  const skyColor = eraSkyColor(spec.skyColor, scene);

  return (
    <>
      <color attach="background" args={[skyColor]} />
      {/* 먼 바다가 하늘색으로 자연스럽게 섞이게 */}
      <fog attach="fog" args={[skyColor, 110, 260]} />
      <FogFollow />
      <ambientLight intensity={spec.ambientIntensity} />
      <directionalLight
        position={[30, 60, 20]}
        intensity={spec.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-far={200}
      />
      {spec.cloudCount > 0 && <Clouds count={spec.cloudCount} color={spec.cloudColor} />}
      {spec.rain && <Rain />}
      {spec.lightning && <LightningFlash />}
    </>
  );
}

/** 번개: 평소 0, 주기마다 화면 전체가 순간 밝아진다 */
function LightningFlash() {
  const ref = useRef<AmbientLight>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = getLightningIntensity(clock.elapsedTime);
  });
  return <ambientLight ref={ref} color="#dfe8ff" intensity={0} />;
}

const ORIGIN = new Vector3();

/** 안개 범위를 매 프레임 카메라 ↔ 보는 점 거리에 맞춘다 (확대·축소해도 지도는 맑게). 계산은 lib/camera/fog */
function FogFollow() {
  useFrame(({ scene, camera, controls }) => {
    if (!(scene.fog instanceof Fog)) return;
    const target = (controls as { target?: Vector3 } | null)?.target ?? ORIGIN;
    const { near, far } = getFogRange(camera.position.distanceTo(target));
    scene.fog.near = near;
    scene.fog.far = far;
  });
  return null;
}
