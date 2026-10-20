/**
 * SEC fiscalYearEnd "MMDD" → "회계연도 1월 말 마감" (날짜 혼동 방지 안내, api.md).
 * 52·53주 회계(엔비디아 0125, 애플 0927 등)는 매년 날짜가 조금씩 달라서 25일 이후는 "말"로 묶는다.
 * 12월 말이면 달력과 같으니 null (안내 불필요)
 */
export function describeFiscalYearEnd(mmdd: string | null): string | null {
  if (!mmdd || !/^\d{4}$/.test(mmdd)) return null;
  const month = Number(mmdd.slice(0, 2));
  const day = Number(mmdd.slice(2));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (month === 12 && day >= 25) return null;
  return `회계연도 ${month}월 ${day >= 25 ? "말" : `${day}일`} 마감`;
}
