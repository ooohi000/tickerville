import { describe, expect, it } from "vitest";
import { displayName, formatMarketCap } from "./format";

describe("formatMarketCap", () => {
  it.each([
    [4e12, "$4.0T"],
    [3.84e12, "$3.8T"],
    [350e9, "$350B"],
    [12.4e9, "$12B"],
    [1.94e9, "$1.9B"],
    [850e6, "$850M"],
    [500, "$500"],
  ])("%d → %s", (usd, text) => {
    expect(formatMarketCap(usd)).toBe(text);
  });
});

describe("displayName", () => {
  it("한글 이름 우선, 없으면 영문", () => {
    expect(displayName({ name: "NVIDIA", nameKo: "엔비디아" })).toBe("엔비디아");
    expect(displayName({ name: "Palantir" })).toBe("Palantir");
  });
});
