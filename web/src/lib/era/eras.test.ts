import { describe, expect, it } from "vitest";
import { BASE_SCENE, DEFAULT_ERA, ERAS, ERA_IDS, describeFounding, eraSkyColor, formatBriefing, formatGreeting, getEra, isBeforeFounding, isEraId } from "./eras";

const HEX = /^#[0-9a-f]{6}$/i;

describe("ERAS", () => {
  it("5개 시대가 연도 순서이고 id 와 연도가 맞다", () => {
    expect(ERA_IDS).toEqual(["1795", "1863", "1905", "1935", "2026"]);
    for (const id of ERA_IDS) expect(String(ERAS[id].year)).toBe(id);
  });

  it("장면 색이 모두 #rrggbb 이고 섞는 비율은 0~1", () => {
    for (const id of ERA_IDS) {
      const s = ERAS[id].scene;
      for (const c of [s.land, s.border, s.sea]) expect(c).toMatch(HEX);
      if (s.sky !== null) expect(s.sky).toMatch(HEX);
      expect(s.skyMix).toBeGreaterThanOrEqual(0);
      expect(s.skyMix).toBeLessThanOrEqual(1);
    }
  });

  it("기본은 현재(2026) 이고 지금 지도 색 그대로", () => {
    expect(DEFAULT_ERA).toBe("2026");
    expect(getEra("2026").scene).toBe(BASE_SCENE);
  });

  it("보고 문구에 {name} 자리가 있다", () => {
    for (const id of ERA_IDS) expect(ERAS[id].briefingKo).toContain("{name}");
    expect(formatBriefing(ERAS["1863"], "GE")).toBe("링컨 대통령께 드리는 전보 — GE");
  });
});

describe("formatGreeting", () => {
  it("고른 캐릭터를 부르며 보고", () => {
    expect(formatGreeting(ERAS["1863"])).toBe("링컨 대통령님, 보고드립니다");
    expect(formatGreeting(ERAS["2026"])).toBe("애널리스트님, 보고드립니다");
  });
});

describe("eraSkyColor", () => {
  it("현재는 날씨 색 그대로, 다른 시대는 섞는다", () => {
    expect(eraSkyColor("#5aa8f0", ERAS["2026"].scene)).toBe("#5aa8f0");
    expect(eraSkyColor("#000000", { ...BASE_SCENE, sky: "#ffffff", skyMix: 0.5 })).toBe("#808080");
  });
});

describe("isEraId", () => {
  it("저장된 값 검사", () => {
    expect(isEraId("1905")).toBe(true);
    expect(isEraId("1906")).toBe(false);
    expect(isEraId(1905)).toBe(false);
    expect(isEraId(null)).toBe(false);
  });
});

describe("isBeforeFounding", () => {
  it("설립 전이면 true, 같은 해·이후·모름은 false", () => {
    expect(isBeforeFounding(1993, 1905)).toBe(true);
    expect(isBeforeFounding(1905, 1905)).toBe(false);
    expect(isBeforeFounding(1892, 1905)).toBe(false);
    expect(isBeforeFounding(null, 1905)).toBe(false);
  });
});

describe("describeFounding", () => {
  it("그 해에 있던 회사는 몇 년 차인지", () => {
    expect(describeFounding(1892, 1905)).toEqual({ existed: true, text: "1905년에도 있던 회사 · 설립 14년 차" });
    expect(describeFounding(1905, 1905)?.existed).toBe(true);
  });

  it("아직 없던 회사는 몇 년 뒤에 등장하는지", () => {
    expect(describeFounding(1993, 1905)).toEqual({ existed: false, text: "1905년엔 아직 없던 회사 · 1993년 설립 — 88년 뒤에 등장" });
  });

  it("설립연도를 모르면 null", () => {
    expect(describeFounding(null, 1905)).toBeNull();
    expect(describeFounding(undefined, 1905)).toBeNull();
  });
});
