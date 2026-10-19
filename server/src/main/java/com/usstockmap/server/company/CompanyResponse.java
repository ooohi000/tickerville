package com.usstockmap.server.company;

import java.time.LocalDate;

/** 계약 `Company` (docs/api.md GET /companies 항목). 없는 값은 null, 필드는 빼지 않는다. */
public record CompanyResponse(
        String ticker,
        String name,
        String nameKo,
        String sector,
        Hq hq,
        Long revenueTtmUsd,
        Long netIncomeTtmUsd,
        Long totalAssetsUsd,
        Double operatingMarginTtm,
        Double revenueGrowthYoy,
        Long publicFloatUsd,
        LocalDate publicFloatAsOf,
        FilingActivity filings30d,
        String memo
) {

    public record Hq(String city, String state, double lat, double lng) {
    }

    public record FilingActivity(int material, int insider) {
        static final FilingActivity NONE = new FilingActivity(0, 0);
    }

    public static CompanyResponse from(CompanyRow row) {
        Company c = row.company();
        CompanySnapshot s = row.snapshot();
        Hq hq = new Hq(c.getHqCity(), c.getHqState(), c.getHqLat(), c.getHqLng());
        if (s == null) {
            return new CompanyResponse(c.getTicker(), c.getName(), c.getNameKo(), c.getSector().value(), hq,
                    null, null, null, null, null, null, null, FilingActivity.NONE, c.getMemo());
        }
        return new CompanyResponse(c.getTicker(), c.getName(), c.getNameKo(), c.getSector().value(), hq,
                s.getRevenueTtmUsd(), s.getNetIncomeTtmUsd(), s.getTotalAssetsUsd(),
                s.getOperatingMarginTtm(), s.getRevenueGrowthYoy(),
                s.getPublicFloatUsd(), s.getPublicFloatAsOf(),
                new FilingActivity(s.getFilingsMaterial30d(), s.getFilingsInsider30d()),
                c.getMemo());
    }
}
