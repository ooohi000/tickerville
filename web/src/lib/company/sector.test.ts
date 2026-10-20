import { describe, expect, it } from "vitest";
import { SECTOR_LABEL_KO } from "./sector";

describe("SECTOR_LABEL_KO", () => {
  it("모든 업종에 한글 이름이 있다", () => {
    expect(Object.values(SECTOR_LABEL_KO).every((v) => v.length > 0)).toBe(true);
    expect(SECTOR_LABEL_KO.tech).toBe("기술");
  });
});
