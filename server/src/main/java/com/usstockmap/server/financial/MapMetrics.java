package com.usstockmap.server.financial;

import java.time.LocalDate;

/**
 * 지도용 지표 (company_snapshot 의 재무 부분, 계약 Company 의 같은 이름 필드).
 * 계산할 수 없으면 null — 예: 연속 4분기가 없으면 TTM 은 null.
 */
public record MapMetrics(
        Long revenueTtmUsd,
        Long netIncomeTtmUsd,
        Long totalAssetsUsd,
        Double operatingMarginTtm,
        Double revenueGrowthYoy,
        Long publicFloatUsd,
        LocalDate publicFloatAsOf,
        /** 재무 데이터 기준일 = 가장 최근 분기 마감일 */
        LocalDate dataAsOf
) {
}
