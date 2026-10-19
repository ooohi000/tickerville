package com.usstockmap.server.collector.sec;

import com.usstockmap.server.company.Company;
import com.usstockmap.server.company.CompanyRepository;
import com.usstockmap.server.company.CompanySnapshot;
import com.usstockmap.server.company.CompanySnapshotRepository;
import com.usstockmap.server.earnings.ReportedEarnings;
import com.usstockmap.server.financial.FinancialCalc;
import com.usstockmap.server.financial.FinancialRow;
import com.usstockmap.server.financial.MapMetrics;
import com.usstockmap.server.financial.SecFact;
import com.usstockmap.server.quality.QualityIssue;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 계산된 SecCompanyUpdate 를 기업 하나 단위 트랜잭션으로 저장한다 (중간에 실패하면 그 기업은 전부 그대로).
 * 기업·최신 지표는 JPA 엔티티, 대량 행(원본 값·재무제표·공시·기록)은 JdbcTemplate 배치.
 */
@Component
public class SecSyncWriter {

    private final CompanyRepository companies;
    private final CompanySnapshotRepository snapshots;
    private final JdbcTemplate jdbc;

    public SecSyncWriter(CompanyRepository companies, CompanySnapshotRepository snapshots, JdbcTemplate jdbc) {
        this.companies = companies;
        this.snapshots = snapshots;
        this.jdbc = jdbc;
    }

    @Transactional
    public void write(long companyId, SecCompanyUpdate u, LocalDate today, Instant now) {
        Company company = companies.findById(companyId).orElseThrow();
        SecSubmission s = u.submission();
        SecSubmission.Address a = s.businessAddress();
        company.applySecProfile(s.cik(), s.exchange(), s.sicCode(), s.sicDescription(), s.fiscalYearEnd(),
                a.street(), a.city(), a.state(), a.zip(), now);

        CompanySnapshot snapshot = snapshots.findById(companyId).orElseGet(() -> new CompanySnapshot(company));
        snapshot.apply(u.metrics(), u.filingActivity(), FinancialCalc.VERSION);
        snapshots.save(snapshot);

        replaceFacts(companyId, u.facts());
        replaceStatements(companyId, u.statements());
        upsertFilings(companyId, s.filings());
        upsertDailyMetrics(companyId, today, u);
        writeEarnings(companyId, u);
        replaceIssues(companyId, u.issues());
    }

    /** 원본 값은 매번 통째로 다시 (정정 공시가 과거 값을 바꾸므로) */
    private void replaceFacts(long companyId, List<SecFact> facts) {
        jdbc.update("delete from financial_fact where company_id = ?", companyId);
        jdbc.batchUpdate("""
                insert into financial_fact (company_id, taxonomy, concept, unit, period_start, period_end, value,
                                            accession, form, filed, fy, fp)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict do nothing
                """, facts, 500, (ps, f) -> {
            ps.setLong(1, companyId);
            ps.setString(2, f.taxonomy());
            ps.setString(3, f.concept());
            ps.setString(4, f.unit());
            ps.setObject(5, f.start() == null ? null : Date.valueOf(f.start()));
            ps.setDate(6, Date.valueOf(f.end()));
            ps.setBigDecimal(7, f.value());
            ps.setString(8, f.accession());
            ps.setString(9, f.form());
            ps.setDate(10, Date.valueOf(f.filed()));
            ps.setObject(11, f.fy());
            ps.setString(12, f.fp());
        });
    }

    private void replaceStatements(long companyId, List<FinancialRow> rows) {
        jdbc.update("delete from financial_period where company_id = ?", companyId);
        jdbc.batchUpdate("""
                insert into financial_period (company_id, period_type, fiscal_year, fiscal_period, period_start,
                    period_end, filed_at, revenue, gross_profit, operating_income, net_income, eps_diluted,
                    total_assets, total_liabilities, total_equity, operating_cash_flow, capital_expenditure,
                    free_cash_flow)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, rows, 500, (ps, r) -> {
            ps.setLong(1, companyId);
            ps.setString(2, r.type().name());
            ps.setInt(3, r.fiscalYear());
            ps.setString(4, r.fiscalPeriod());
            ps.setDate(5, Date.valueOf(r.start()));
            ps.setDate(6, Date.valueOf(r.end()));
            ps.setObject(7, r.filedAt() == null ? null : Date.valueOf(r.filedAt()));
            ps.setObject(8, r.revenue());
            ps.setObject(9, r.grossProfit());
            ps.setObject(10, r.operatingIncome());
            ps.setObject(11, r.netIncome());
            ps.setBigDecimal(12, r.epsDiluted());
            ps.setObject(13, r.totalAssets());
            ps.setObject(14, r.totalLiabilities());
            ps.setObject(15, r.totalEquity());
            ps.setObject(16, r.operatingCashFlow());
            ps.setObject(17, r.capitalExpenditure());
            ps.setObject(18, r.freeCashFlow());
        });
    }

    /** 공시는 쌓는다 (SEC 최근 목록은 1,000건까지라 지난 공시가 빠져도 우리 DB 에는 남게) */
    private void upsertFilings(long companyId, List<SecFiling> filings) {
        jdbc.batchUpdate("""
                insert into filing (company_id, accession, form, filed_at, url, items, accepted_at, report_date)
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict (accession) do update set
                    items = excluded.items, accepted_at = excluded.accepted_at, report_date = excluded.report_date
                """, filings, 500, (ps, f) -> {
            ps.setLong(1, companyId);
            ps.setString(2, f.accession());
            ps.setString(3, f.form());
            ps.setDate(4, Date.valueOf(f.filedAt()));
            ps.setString(5, f.url());
            ps.setString(6, f.items());
            ps.setObject(7, f.acceptedAt() == null ? null : Timestamp.from(f.acceptedAt()));
            ps.setObject(8, f.reportDate() == null ? null : Date.valueOf(f.reportDate()));
        });
    }

    /** 오늘 기록 한 줄. 같은 날 다시 돌리면 덮어쓴다 */
    private void upsertDailyMetrics(long companyId, LocalDate today, SecCompanyUpdate u) {
        MapMetrics m = u.metrics();
        jdbc.update("""
                insert into company_metric_daily (company_id, as_of, calc_version, revenue_ttm_usd, net_income_ttm_usd,
                    total_assets_usd, operating_margin_ttm, revenue_growth_yoy, public_float_usd, public_float_as_of,
                    filings_material_30d, filings_insider_30d, data_as_of)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict (company_id, as_of) do update set
                    calc_version = excluded.calc_version, revenue_ttm_usd = excluded.revenue_ttm_usd,
                    net_income_ttm_usd = excluded.net_income_ttm_usd, total_assets_usd = excluded.total_assets_usd,
                    operating_margin_ttm = excluded.operating_margin_ttm, revenue_growth_yoy = excluded.revenue_growth_yoy,
                    public_float_usd = excluded.public_float_usd, public_float_as_of = excluded.public_float_as_of,
                    filings_material_30d = excluded.filings_material_30d,
                    filings_insider_30d = excluded.filings_insider_30d, data_as_of = excluded.data_as_of
                """,
                companyId, Date.valueOf(today), FinancialCalc.VERSION, m.revenueTtmUsd(), m.netIncomeTtmUsd(),
                m.totalAssetsUsd(), m.operatingMarginTtm(), m.revenueGrowthYoy(), m.publicFloatUsd(),
                m.publicFloatAsOf() == null ? null : Date.valueOf(m.publicFloatAsOf()),
                u.filingActivity().material(), u.filingActivity().insider(),
                m.dataAsOf() == null ? null : Date.valueOf(m.dataAsOf()));
    }

    /**
     * 실제 발표(8-K)는 쌓고, 추정 예상일은 날짜가 바뀔 때만 교체 (같으면 처음 기록 시각 유지).
     * 직접 입력(MANUAL)·확정(CONFIRMED)은 건드리지 않는다.
     */
    private void writeEarnings(long companyId, SecCompanyUpdate u) {
        for (ReportedEarnings r : u.reportedEarnings()) {
            jdbc.update("""
                    insert into earnings_event (company_id, status, event_date, timing, source, accession)
                    values (?, 'REPORTED', ?, ?, 'SEC_8K', ?)
                    on conflict (accession) do nothing
                    """, companyId, Date.valueOf(r.eventDate()), r.timing() == null ? null : r.timing().name(),
                    r.accession());
        }
        LocalDate estimate = u.nextEarningsEstimate().orElse(null);
        jdbc.update("""
                delete from earnings_event
                where company_id = ? and status = 'EXPECTED' and source = 'ESTIMATE'
                  and (cast(? as date) is null or event_date <> cast(? as date))
                """, companyId, estimate == null ? null : Date.valueOf(estimate),
                estimate == null ? null : Date.valueOf(estimate));
        if (estimate != null) {
            jdbc.update("""
                    insert into earnings_event (company_id, status, event_date, source)
                    select ?, 'EXPECTED', ?, 'ESTIMATE'
                    where not exists (select 1 from earnings_event
                                      where company_id = ? and status = 'EXPECTED' and source = 'ESTIMATE')
                    """, companyId, Date.valueOf(estimate), companyId);
        }
    }

    private void replaceIssues(long companyId, List<QualityIssue> issues) {
        jdbc.update("delete from data_quality_issue where company_id = ?", companyId);
        jdbc.batchUpdate("insert into data_quality_issue (company_id, code, detail, calc_version) values (?, ?, ?, ?)",
                issues, 100, (ps, i) -> {
                    ps.setLong(1, companyId);
                    ps.setString(2, i.code());
                    ps.setString(3, i.detail().length() > 500 ? i.detail().substring(0, 500) : i.detail());
                    ps.setInt(4, FinancialCalc.VERSION);
                });
    }
}
