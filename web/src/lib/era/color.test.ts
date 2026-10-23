import { describe, expect, it } from "vitest";
import { mixHex } from "./color";

describe("mixHex", () => {
  it("끝값은 원래 색", () => {
    expect(mixHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("중간은 채널별 선형 보간", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("#ff0000", "#0000ff", 0.25)).toBe("#bf0040");
  });

  it("비율은 0~1 로 자른다", () => {
    expect(mixHex("#102030", "#ffffff", -1)).toBe("#102030");
    expect(mixHex("#102030", "#ffffff", 2)).toBe("#ffffff");
  });

  it("형식이 틀리면 에러", () => {
    expect(() => mixHex("red", "#ffffff", 0.5)).toThrow();
    expect(() => mixHex("#fff", "#ffffff", 0.5)).toThrow();
  });
});
