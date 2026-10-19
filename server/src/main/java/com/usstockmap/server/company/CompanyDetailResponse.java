package com.usstockmap.server.company;

import com.usstockmap.server.earnings.EarningsSummaryResponse;
import com.usstockmap.server.filing.FilingResponse;
import com.usstockmap.server.financial.FinancialStatementResponse;
import java.util.List;

/** 계약 CompanyDetail (docs/api.md GET /companies/{ticker}) */
public record CompanyDetailResponse(
        CompanyResponse company,
        Profile profile,
        FinancialStatementResponse latestAnnual,
        FinancialStatementResponse latestQuarter,
        List<FilingResponse> recentFilings,
        EarningsSummaryResponse earnings
) {

    /** SEC 기본 정보 + 직접 쓴 한글 소개. CIK 가 없으면(아직 수집 전) null */
    public record Profile(String cik, String exchange, String sicCode, String sicDescription, String fiscalYearEnd,
                          String descriptionKo) {

        static Profile from(Company c) {
            return c.getCik() == null ? null : new Profile(c.getCik(), c.getExchange(), c.getSicCode(),
                    c.getSicDescription(), c.getFiscalYearEnd(), c.getDescriptionKo());
        }
    }
}
