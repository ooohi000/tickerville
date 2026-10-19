package com.usstockmap.server.collector.sec;

import com.usstockmap.server.common.geo.ZipCentroids;
import com.usstockmap.server.common.time.MarketDates;
import com.usstockmap.server.quality.QualityIssue;
import com.usstockmap.server.company.Company;
import com.usstockmap.server.company.CompanyRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/**
 * SEC 수집 흐름: (CIK 없으면 티커로 찾기) → submissions·companyfacts 받기 → 계산 → 저장.
 * 네트워크는 트랜잭션 밖에서, 저장만 기업 하나 단위 트랜잭션(SecSyncWriter).
 * 한 기업이 실패해도 나머지는 계속한다.
 */
@Service
public class SecSyncService {

    private static final Logger log = LoggerFactory.getLogger(SecSyncService.class);

    private final SecClient sec;
    private final SecSyncWriter writer;
    private final CompanyRepository companies;
    private final ZipCentroids zips;
    private final Clock clock;

    /** 우리 본사 좌표와 SEC 주소(우편번호 중심)가 이보다 멀면 이상 신호 */
    static final double HQ_MISMATCH_KM = 50;

    public SecSyncService(SecClient sec, SecSyncWriter writer, CompanyRepository companies, ZipCentroids zips,
                          Clock clock) {
        this.sec = sec;
        this.writer = writer;
        this.companies = companies;
        this.zips = zips;
        this.clock = clock;
    }

    /** 등록된 모든 기업 (티커순) */
    public SecSyncResult syncAll() {
        List<Company> all = companies.findAll().stream().sorted(Comparator.comparing(Company::getTicker)).toList();
        return sync(all);
    }

    /** 지정한 티커만 (관리자 수동 실행) */
    public SecSyncResult syncTickers(List<String> tickers) {
        List<Company> targets = tickers.stream()
                .map(t -> companies.findByTicker(t.toUpperCase()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
        return sync(targets);
    }

    private SecSyncResult sync(List<Company> targets) {
        List<String> ok = new ArrayList<>();
        List<SecSyncResult.Failure> failed = new ArrayList<>();
        Map<String, String> tickerToCik = null;
        for (Company c : targets) {
            try {
                String cik = c.getCik();
                if (cik == null) {
                    if (tickerToCik == null) {
                        tickerToCik = CompanyTickersParser.parse(sec.companyTickers());
                    }
                    cik = tickerToCik.get(c.getTicker());
                    if (cik == null) {
                        throw new IllegalStateException("SEC 티커 목록에 없음");
                    }
                }
                syncOne(c, cik);
                ok.add(c.getTicker());
            } catch (RuntimeException e) {
                log.warn("SEC sync failed for {}: {}", c.getTicker(), e.toString());
                failed.add(new SecSyncResult.Failure(c.getTicker(), e.getMessage()));
            }
        }
        log.info("SEC sync done: {} ok, {} failed", ok.size(), failed.size());
        return new SecSyncResult(ok, failed);
    }

    /** 본사를 옮겼거나 좌표를 잘못 넣은 경우 (PLTR: 덴버 → 플로리다 이전) */
    List<QualityIssue> hqIssues(Company c, SecSubmission s) {
        String zip = s.businessAddress().zip();
        return zips.find(zip)
                .filter(p -> p.distanceKm(c.getHqLat(), c.getHqLng()) > HQ_MISMATCH_KM)
                .map(p -> List.of(new QualityIssue("HQ_FAR_FROM_SEC_ADDRESS", String.format(
                        "지도 좌표(%s, %s)가 SEC 본사 주소(%s %s %s)와 %.0fkm 떨어짐 — 이전했는지 확인",
                        c.getHqCity(), c.getHqState(), s.businessAddress().city(), s.businessAddress().state(), zip,
                        p.distanceKm(c.getHqLat(), c.getHqLng())))))
                .orElse(List.of());
    }

    private void syncOne(Company c, String cik) {
        JsonNode submissions = sec.submissions(cik);
        JsonNode facts = sec.companyFacts(cik);
        LocalDate today = MarketDates.today(clock);
        SecCompanyUpdate update = SecCompanyUpdate.compute(c.getTicker(), submissions, facts, today)
                .withExtraIssues(hqIssues(c, SubmissionsParser.parse(submissions, c.getTicker())));
        writer.write(c.getId(), update, today, clock.instant());
    }
}
