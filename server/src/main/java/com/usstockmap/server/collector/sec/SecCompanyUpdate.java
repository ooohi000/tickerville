package com.usstockmap.server.collector.sec;

import com.usstockmap.server.earnings.EarningsCalendar;
import com.usstockmap.server.earnings.ReportedEarnings;
import com.usstockmap.server.filing.FilingActivity;
import com.usstockmap.server.filing.FilingActivityCalculator;
import com.usstockmap.server.financial.FinancialStatementBuilder;
import com.usstockmap.server.financial.FinancialRow;
import com.usstockmap.server.financial.IndustryProfile;
import com.usstockmap.server.financial.MapMetrics;
import com.usstockmap.server.financial.MapMetricsCalculator;
import com.usstockmap.server.financial.SecFact;
import com.usstockmap.server.quality.DataQualityChecker;
import com.usstockmap.server.quality.QualityIssue;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import tools.jackson.databind.JsonNode;

/**
 * 기업 하나를 SEC 응답으로 갱신할 내용 전부. 계산만 하고 저장은 SecSyncWriter.
 * (네트워크·DB 없이 만들 수 있어서 실제 응답 파일로 그대로 테스트한다)
 */
public record SecCompanyUpdate(
        SecSubmission submission,
        IndustryProfile profile,
        List<SecFact> facts,
        List<FinancialRow> statements,
        MapMetrics metrics,
        FilingActivity filingActivity,
        List<ReportedEarnings> reportedEarnings,
        Optional<LocalDate> nextEarningsEstimate,
        List<QualityIssue> issues
) {

    public static SecCompanyUpdate compute(String ticker, JsonNode submissionsJson, JsonNode companyFactsJson,
                                           LocalDate today) {
        SecSubmission submission = SubmissionsParser.parse(submissionsJson, ticker);
        IndustryProfile profile = IndustryProfile.fromSic(submission.sicCode());
        List<SecFact> facts = CompanyFactsParser.parse(companyFactsJson);
        List<FinancialRow> statements = FinancialStatementBuilder.build(facts, profile);
        MapMetrics metrics = MapMetricsCalculator.calculate(statements, facts);
        List<ReportedEarnings> reported = EarningsCalendar.reported(submission.filings());
        return new SecCompanyUpdate(
                submission,
                profile,
                facts,
                statements,
                metrics,
                FilingActivityCalculator.count(submission.filings(), today),
                reported,
                EarningsCalendar.estimateNext(reported),
                DataQualityChecker.check(statements, metrics, today, latestReportPeriod(submission)));
    }

    /** 공시 목록상 가장 최근 정기 보고서(10-Q·10-K)의 보고 기준일 */
    static LocalDate latestReportPeriod(SecSubmission s) {
        return s.filings().stream()
                .filter(f -> f.form().startsWith("10-Q") || f.form().startsWith("10-K"))
                .map(SecFiling::reportDate)
                .filter(java.util.Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);
    }
}
