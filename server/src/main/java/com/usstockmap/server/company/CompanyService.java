package com.usstockmap.server.company;

import com.usstockmap.server.common.time.MarketDates;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyQueryRepository companies;
    private final Clock clock;

    public CompanyService(CompanyQueryRepository companies, Clock clock) {
        this.companies = companies;
        this.clock = clock;
    }

    /** 지도 전체 목록. asOf = 지표 마지막 갱신일(미국 동부), 지표가 없으면 오늘. */
    public CompanyDatasetResponse getMapDataset() {
        LocalDate asOf = companies.findLatestSnapshotUpdate()
                .map(MarketDates::toMarketDate)
                .orElseGet(() -> MarketDates.today(clock));
        return new CompanyDatasetResponse(asOf,
                companies.findAllForMap().stream().map(CompanyResponse::from).toList());
    }
}
