import { describe, expect, it } from "vitest";
import { getBuildingDimensions } from "./buildingSpec";
import { estimateTextEm, getBadgeLayout, getSignDimensions, getSignLines } from "./sign";

const B = 1_000_000_000;
const mega = getBuildingDimensions(1_000 * B);

describe("estimateTextEm", () => {
  it("한글은 영문 대문자보다 넓고, 공백은 좁다", () => {
    expect(estimateTextEm("가")).toBeGreaterThan(estimateTextEm("A"));
    expect(estimateTextEm(" ")).toBeLessThan(estimateTextEm("A"));
    expect(estimateTextEm("엔비디아")).toBeCloseTo(0.86 * 4);
  });
});

describe("getSignLines", () => {
  it("짧은 이름은 한 줄", () => {
    expect(getSignLines("엔비디아")).toEqual(["엔비디아"]);
    expect(getSignLines("JP모건")).toEqual(["JP모건"]);
  });

  it("길고 띄어쓰기가 있으면 가운데 가까운 띄어쓰기에서 두 줄", () => {
    expect(getSignLines("텍사스 인스트루먼트")).toEqual(["텍사스", "인스트루먼트"]);
    expect(getSignLines("아메리칸 익스프레스")).toEqual(["아메리칸", "익스프레스"]);
  });

  it("띄어쓰기가 없으면 길어도 한 줄", () => {
    expect(getSignLines("슈퍼마이크로컴퓨터")).toEqual(["슈퍼마이크로컴퓨터"]);
  });
});

describe("getSignDimensions", () => {
  it("이름이 길수록 간판이 넓다", () => {
    expect(getSignDimensions("마이크로소프트", mega).plateWidth).toBeGreaterThan(
      getSignDimensions("인텔", mega).plateWidth,
    );
  });

  it("두 줄 간판은 한 줄보다 높고, 넓이는 긴 줄 기준", () => {
    const two = getSignDimensions("텍사스 인스트루먼트", mega);
    const one = getSignDimensions("인텔", mega);
    expect(two.lines).toHaveLength(2);
    expect(two.plateHeight).toBeGreaterThan(one.plateHeight);
    expect(two.plateWidth).toBeLessThan(getSignDimensions("텍사스인스트루먼트", mega).plateWidth);
  });

  it("간판은 건물 꼭대기보다 위에 있다", () => {
    const s = getSignDimensions("엔비디아", mega);
    expect(s.centerY - s.plateHeight / 2).toBeCloseTo(mega.labelY);
    expect(s.centerY).toBeGreaterThan(mega.totalHeight);
  });

  it("큰 등급일수록 간판 글자가 크다", () => {
    const small = getSignDimensions("애플", getBuildingDimensions(1 * B));
    const big = getSignDimensions("애플", mega);
    expect(big.fontSize).toBeGreaterThan(small.fontSize);
  });

  it("빈 이름도 판 크기가 0이 되지 않는다", () => {
    expect(getSignDimensions("", mega).plateWidth).toBeGreaterThan(0);
  });
});

describe("getBadgeLayout", () => {
  const sign = getSignDimensions("엔비디아", mega);
  const badge = getBadgeLayout(sign, 3);

  it("+N 텍스트", () => {
    expect(badge.text).toBe("+3");
  });

  it("간판 오른쪽 위 모서리에 걸친다", () => {
    expect(badge.x).toBeCloseTo(sign.plateWidth / 2);
    expect(badge.y).toBeCloseTo(sign.plateHeight / 2);
  });

  it("배지는 한 줄 간판 높이보다 작다 (두 줄 간판에서도 같은 크기)", () => {
    expect(badge.radius * 2).toBeLessThan(sign.plateHeight);
    const two = getSignDimensions("텍사스 인스트루먼트", mega);
    expect(getBadgeLayout(two, 3).radius).toBeCloseTo(badge.radius);
  });
});
