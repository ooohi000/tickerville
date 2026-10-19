import { describe, expect, it } from "vitest";
import type { Weather } from "@/types";
import { WEATHER_SPECS, WEATHER_THRESHOLDS, getWeather, getWeatherSpec } from "./weather";

describe("getWeather", () => {
  it.each([
    [0, "storm"],
    [24, "storm"],
    [24.9, "storm"],
    [25, "rain"],
    [44, "rain"],
    [45, "cloudy"],
    [55, "cloudy"],
    [55.9, "cloudy"],
    [56, "partlyCloudy"],
    [75, "partlyCloudy"],
    [76, "sunny"],
    [100, "sunny"],
  ] as const)("%d → %s", (value, weather) => {
    expect(getWeather(value)).toBe(weather);
  });

  it("범위 밖 값은 잘라서 판정", () => {
    expect(getWeather(-10)).toBe("storm");
    expect(getWeather(150)).toBe("sunny");
  });

  it("숫자가 아니면 에러", () => {
    expect(() => getWeather(NaN)).toThrow();
    expect(() => getWeather(Infinity)).toThrow();
  });
});

describe("WEATHER_SPECS", () => {
  const all = WEATHER_THRESHOLDS.map(([w]) => w);

  it("모든 날씨에 설정이 있다", () => {
    for (const w of all) expect(WEATHER_SPECS[w]).toBeDefined();
  });

  it("공포에서 탐욕으로 갈수록 햇빛은 세지고 구름은 줄어든다", () => {
    const order: Weather[] = ["storm", "rain", "cloudy", "partlyCloudy", "sunny"];
    for (let i = 1; i < order.length; i++) {
      const prev = WEATHER_SPECS[order[i - 1]];
      const cur = WEATHER_SPECS[order[i]];
      expect(cur.sunIntensity).toBeGreaterThan(prev.sunIntensity);
      expect(cur.cloudCount).toBeLessThanOrEqual(prev.cloudCount);
    }
  });

  it("비는 공포 구간에서만, 번개는 극단적 공포에서만", () => {
    expect(all.filter((w) => WEATHER_SPECS[w].rain)).toEqual(["rain", "storm"]);
    expect(all.filter((w) => WEATHER_SPECS[w].lightning)).toEqual(["storm"]);
  });
});

describe("getWeatherSpec", () => {
  it("날씨와 설정을 함께 돌려준다", () => {
    const spec = getWeatherSpec(80);
    expect(spec.weather).toBe("sunny");
    expect(spec.label).toBe("극단적 탐욕");
  });
});
