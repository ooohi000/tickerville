import type { Sector } from "@/types";

/** 업종 한글 이름 (상세 패널·목록) */
export const SECTOR_LABEL_KO: Readonly<Record<Sector, string>> = {
  tech: "기술",
  communication: "커뮤니케이션",
  consumer: "소비재",
  finance: "금융",
  healthcare: "헬스케어",
  industrial: "산업재",
  energy: "에너지",
  other: "기타",
};
