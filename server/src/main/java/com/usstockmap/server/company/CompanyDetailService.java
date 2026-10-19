package com.usstockmap.server.company;

import com.usstockmap.server.common.api.ApiException;
import com.usstockmap.server.common.time.MarketDates;
import com.usstockmap.server.earnings.EarningsSummaryResponse;
import com.usstockmap.server.filing.FilingResponse;
import com.usstockmap.server.financial.FinancialPeriod;
import com.usstockmap.server.financial.FinancialStatementResponse;
import com.usstockmap.server.financial.PeriodType;
import java.time.Clock;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompanyDetailService {

    public static final int RECENT_FILINGS = 20;
    public static final int MAX_FINANCIALS = 40;

    /** /financials?period= 값 (계약) */
    public enum Period {
        QUARTERLY(PeriodType.Q), ANNUAL(PeriodType.FY);

        final PeriodType type;

        Period(PeriodType type) {
            this.type = type;
        }

        static Period parse(String value) {
            try {
                return Period.valueOf(value.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException | NullPointerException e) {
                throw ApiException.invalid("period must be quarterly or annual: " + value);
            }
        }
    }

    private final CompanyRepository companies;
    private final CompanySnapshotRepository snapshots;
    private final CompanyDetailQueryRepository detail;
    private final Clock clock;

    public CompanyDetailService(CompanyRepository companies, CompanySnapshotRepository snapshots,
                                CompanyDetailQueryRepository detail, Clock clock) {
        this.companies = companies;
        this.snapshots = snapshots;
        this.detail = detail;
        this.clock = clock;
    }

    public CompanyDetailResponse get(String ticker) {
        Company c = find(ticker);
        CompanySnapshot snapshot = snapshots.findById(c.getId()).orElse(null);
        return new CompanyDetailResponse(
                CompanyResponse.from(new CompanyRow(c, snapshot)),
                CompanyDetailResponse.Profile.from(c),
                first(detail.financials(c.getId(), PeriodType.FY, 1)),
                first(detail.financials(c.getId(), PeriodType.Q, 1)),
                detail.recentFilings(c.getId(), RECENT_FILINGS).stream().map(FilingResponse::from).toList(),
                earnings(c.getId()));
    }

    public List<FinancialStatementResponse> financials(String ticker, String period, int limit) {
        Period p = Period.parse(period);
        if (limit < 1 || limit > MAX_FINANCIALS) {
            throw ApiException.invalid("limit must be 1~" + MAX_FINANCIALS + ": " + limit);
        }
        Company c = find(ticker);
        return detail.financials(c.getId(), p.type, limit).stream().map(FinancialStatementResponse::from).toList();
    }

    private EarningsSummaryResponse earnings(long companyId) {
        var last = detail.lastReported(companyId)
                .map(e -> new EarningsSummaryResponse.LastReported(e.getEventDate(), e.getTiming()))
                .orElse(null);
        var next = detail.next(companyId, MarketDates.today(clock))
                .map(e -> new EarningsSummaryResponse.Next(e.getEventDate(), e.getStatus(), e.getSource()))
                .orElse(null);
        return new EarningsSummaryResponse(last, next);
    }

    /** 경로의 티커는 대소문자 무시 (계약) */
    private Company find(String ticker) {
        String t = ticker == null ? "" : ticker.trim().toUpperCase(Locale.ROOT);
        return companies.findByTicker(t).orElseThrow(() -> ApiException.companyNotFound(t));
    }

    private static FinancialStatementResponse first(List<FinancialPeriod> rows) {
        return rows.isEmpty() ? null : FinancialStatementResponse.from(rows.getFirst());
    }
}
