import type { Weather } from "@/types";

/** 날씨별 지수 하한선. CNN 공포·탐욕 공식 구간과 같다. 큰 값부터 검사. */
export const WEATHER_THRESHOLDS: ReadonlyArray<[Weather, number]> = [
  ["sunny", 76],
  ["partlyCloudy", 56],
  ["cloudy", 45],
  ["rain", 25],
  ["storm", 0],
];

/** 공포·탐욕 지수(0~100) → 날씨. 범위 밖 값은 0~100으로 자른다. */
export function getWeather(fearGreedValue: number): Weather {
  if (!Number.isFinite(fearGreedValue)) {
    throw new Error(`공포·탐욕 지수가 숫자가 아님: ${fearGreedValue}`);
  }
  const v = Math.min(100, Math.max(0, fearGreedValue));
  for (const [weather, min] of WEATHER_THRESHOLDS) {
    if (v >= min) return weather;
  }
  return "storm";
}

export interface WeatherSpec {
  /** CNN 구간 이름 (화면 표시용) */
  label: string;
  skyColor: string;
  /** 0이면 구름 없음 */
  cloudCount: number;
  cloudColor: string;
  /** directionalLight 세기 */
  sunIntensity: number;
  ambientIntensity: number;
  rain: boolean;
  lightning: boolean;
}

/**
 * 날씨별 화면 설정. 하늘 컴포넌트는 이 값만 읽어서 그린다.
 * 색·세기 값은 초안 — 집에서 화면 보고 조정.
 */
export const WEATHER_SPECS: Readonly<Record<Weather, WeatherSpec>> = {
  storm: {
    label: "극단적 공포",
    skyColor: "#2b2f36",
    cloudCount: 40,
    cloudColor: "#3a3f47",
    sunIntensity: 0.2,
    ambientIntensity: 0.25,
    rain: true,
    lightning: true,
  },
  rain: {
    label: "공포",
    skyColor: "#55606e",
    cloudCount: 30,
    cloudColor: "#6b7480",
    sunIntensity: 0.45,
    ambientIntensity: 0.35,
    rain: true,
    lightning: false,
  },
  cloudy: {
    label: "중립",
    skyColor: "#8c9aab",
    cloudCount: 22,
    cloudColor: "#c3cad3",
    sunIntensity: 0.75,
    ambientIntensity: 0.45,
    rain: false,
    lightning: false,
  },
  partlyCloudy: {
    label: "탐욕",
    skyColor: "#7fb3e6",
    cloudCount: 10,
    cloudColor: "#f2f5f8",
    sunIntensity: 1.1,
    ambientIntensity: 0.55,
    rain: false,
    lightning: false,
  },
  sunny: {
    label: "극단적 탐욕",
    skyColor: "#5aa8f0",
    cloudCount: 0,
    cloudColor: "#ffffff",
    sunIntensity: 1.4,
    ambientIntensity: 0.65,
    rain: false,
    lightning: false,
  },
};

/** 지수 → 화면 설정 한 번에 */
export function getWeatherSpec(fearGreedValue: number): WeatherSpec & { weather: Weather } {
  const weather = getWeather(fearGreedValue);
  return { weather, ...WEATHER_SPECS[weather] };
}
