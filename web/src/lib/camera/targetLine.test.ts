import { describe, expect, it } from "vitest";
import { PANEL_INSET, computeTargetLine, formatLatLng } from "./targetLine";

const desktop = { width: 1280, height: 800 };
const rightPanel = { left: 864, top: 16, right: 1264, bottom: 784 };
const phone = { width: 390, height: 844 };
const bottomSheet = { left: 12, top: 300, right: 378, bottom: 832 };

describe("computeTargetLine", () => {
  it("데스크톱: 오른쪽 패널 왼쪽 끝까지 가로선, 같은 높이", () => {
    const l = computeTargetLine({ x: 200, y: 400 }, desktop, rightPanel)!;
    expect(l).toMatchObject({ x1: 200, y1: 400, x2: 864, y2: 400, orientation: "horizontal" });
  });

  it("데스크톱: 건물이 패널보다 위쪽이면 패널 안쪽 높이로 맞춘다", () => {
    const l = computeTargetLine({ x: 200, y: 10 + 8 }, desktop, rightPanel)!;
    expect(l.y2).toBe(rightPanel.top + PANEL_INSET);
  });

  it("휴대폰: 아래 시트 위쪽 끝까지 세로선", () => {
    const l = computeTargetLine({ x: 90, y: 200 }, phone, bottomSheet)!;
    expect(l).toMatchObject({ x1: 90, y1: 200, x2: 90, y2: 300, orientation: "vertical" });
  });

  it("휴대폰: 건물이 화면 왼쪽 끝 근처면 선 끝은 패널 안쪽으로", () => {
    const l = computeTargetLine({ x: 20, y: 200 }, phone, bottomSheet)!;
    expect(l.x2).toBe(bottomSheet.left + PANEL_INSET);
  });

  it("건물이 화면 밖·패널에 가려짐·패널 없음이면 선 없음", () => {
    expect(computeTargetLine({ x: -50, y: 400 }, desktop, rightPanel)).toBeNull();
    expect(computeTargetLine({ x: 1000, y: 400 }, desktop, rightPanel)).toBeNull();
    expect(computeTargetLine({ x: 200, y: 400 }, desktop, null)).toBeNull();
    expect(computeTargetLine(null, desktop, rightPanel)).toBeNull();
  });

  it("글자는 조준 표시 오른쪽 위", () => {
    const l = computeTargetLine({ x: 200, y: 400 }, desktop, rightPanel)!;
    expect(l.labelX).toBeGreaterThan(200);
    expect(l.labelY).toBeLessThan(400);
  });
});

describe("formatLatLng", () => {
  it("북위·서경 두 자리", () => {
    expect(formatLatLng(37.3707, -121.9638)).toBe("37.37N 121.96W");
    expect(formatLatLng(-33.9, 151.2)).toBe("33.90S 151.20E");
  });
});
