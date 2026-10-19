import type { Weather } from "@/types";

/** 날씨별 시장 날씨 지수 하한선. 큰 값부터 검사. 구간은 집에서 실제 분포 보고 조정 */
export const WEATHER_THRESHOLDS: ReadonlyArray<[Weather, number]> = [
  ["sunny", 76],
  ["partlyCloudy", 56],
  ["cloudy", 45],
  ["rain", 25],
  ["storm", 0],
];

/** 시장 날씨 지수(0~100, 높을수록 안정) → 날씨. 범위 밖 값은 0~100으로 자른다. */
export function getWeather(indexValue: number): Weather {
  if (!Number.isFinite(indexValue)) {
    throw new Error(`시장 날씨 지수가 숫자가 아님: ${indexValue}`);
  }
  const v = Math.min(100, Math.max(0, indexValue));
  for (const [weather, min] of WEATHER_THRESHOLDS) {
    if (v >= min) return weather;
  }
  return "storm";
}

export interface WeatherSpec {
  /** 구간 이름 (화면 표시용) */
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
    label: "매우 불안",
    skyColor: "#2b2f36",
    cloudCount: 40,
    cloudColor: "#3a3f47",
    sunIntensity: 0.2,
    ambientIntensity: 0.25,
    rain: true,
    lightning: true,
  },
  rain: {
    label: "불안",
    skyColor: "#55606e",
    cloudCount: 30,
    cloudColor: "#6b7480",
    sunIntensity: 0.45,
    ambientIntensity: 0.35,
    rain: true,
    lightning: false,
  },
  cloudy: {
    label: "보통",
    skyColor: "#8c9aab",
    cloudCount: 22,
    cloudColor: "#c3cad3",
    sunIntensity: 0.75,
    ambientIntensity: 0.45,
    rain: false,
    lightning: false,
  },
  partlyCloudy: {
    label: "안정",
    skyColor: "#7fb3e6",
    cloudCount: 10,
    cloudColor: "#f2f5f8",
    sunIntensity: 1.1,
    ambientIntensity: 0.55,
    rain: false,
    lightning: false,
  },
  sunny: {
    label: "매우 안정",
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
export function getWeatherSpec(indexValue: number): WeatherSpec & { weather: Weather } {
  const weather = getWeather(indexValue);
  return { weather, ...WEATHER_SPECS[weather] };
}

/**
 * 개발용: 주소에 ?mw=10 처럼 붙이면 그 지수로 하늘을 보여준다 (날씨별 화면 조정용).
 * 0~100 숫자가 아니면 null.
 */
export function parseWeatherOverride(search: string): number | null {
  const raw = new URLSearchParams(search).get("mw");
  if (raw === null || raw.trim() === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
}
