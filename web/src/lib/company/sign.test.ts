import { describe, expect, it } from "vitest";
import { getBuildingDimensions } from "./buildingSpec";
import { getBadgeLayout, getSignDimensions } from "./sign";

const B = 1_000_000_000;
const mega = getBuildingDimensions(1_000 * B);

describe("getSignDimensions", () => {
  it("티커가 길수록 간판이 넓다", () => {
    expect(getSignDimensions("GOOGL", mega).plateWidth).toBeGreaterThan(
      getSignDimensions("KO", mega).plateWidth,
    );
  });

  it("간판은 건물 꼭대기보다 위에 있다", () => {
    const s = getSignDimensions("NVDA", mega);
    expect(s.centerY - s.plateHeight / 2).toBeCloseTo(mega.labelY);
    expect(s.centerY).toBeGreaterThan(mega.totalHeight);
  });

  it("큰 등급일수록 간판 글자가 크다", () => {
    const small = getSignDimensions("ABC", getBuildingDimensions(1 * B));
    const big = getSignDimensions("ABC", mega);
    expect(big.fontSize).toBeGreaterThan(small.fontSize);
  });

  it("빈 티커도 판 크기가 0이 되지 않는다", () => {
    expect(getSignDimensions("", mega).plateWidth).toBeGreaterThan(0);
  });
});

describe("getBadgeLayout", () => {
  const sign = getSignDimensions("NVDA", mega);
  const badge = getBadgeLayout(sign, 3);

  it("+N 텍스트", () => {
    expect(badge.text).toBe("+3");
  });

  it("간판 오른쪽 위 모서리에 걸친다", () => {
    expect(badge.x).toBeCloseTo(sign.plateWidth / 2);
    expect(badge.y).toBeCloseTo(sign.plateHeight / 2);
  });

  it("배지는 간판 높이보다 작다", () => {
    expect(badge.radius * 2).toBeLessThan(sign.plateHeight);
  });
});
