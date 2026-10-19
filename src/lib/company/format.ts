import type { Company } from "@/types";

/** 시총 짧게: $4.0T, $350B, $1.9B, $850M */
export function formatMarketCap(usd: number): string {
  const units: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
  ];
  for (const [size, suffix] of units) {
    if (usd >= size) {
      const v = usd / size;
      // 10 미만은 소수 한 자리, 이상은 정수
      return `$${v < 10 ? v.toFixed(1) : Math.round(v)}${suffix}`;
    }
  }
  return `$${Math.round(usd)}`;
}

/** 화면 표시 이름: 한글 이름이 있으면 한글 */
export function displayName(company: Pick<Company, "name" | "nameKo">): string {
  return company.nameKo ?? company.name;
}
