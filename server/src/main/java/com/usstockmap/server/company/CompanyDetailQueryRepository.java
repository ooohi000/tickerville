package com.usstockmap.server.company;

import static com.usstockmap.server.earnings.QEarningsEvent.earningsEvent;
import static com.usstockmap.server.filing.QFiling.filing;
import static com.usstockmap.server.financial.QFinancialPeriod.financialPeriod;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.usstockmap.server.earnings.EarningsEvent;
import com.usstockmap.server.filing.Filing;
import com.usstockmap.server.financial.FinancialPeriod;
import com.usstockmap.server.financial.PeriodType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/** 기업 상세 화면용 조회 (QueryDSL). 모두 기업 id 기준, 인덱스 있는 정렬만 */
@Repository
public class CompanyDetailQueryRepository {

    private final JPAQueryFactory query;

    public CompanyDetailQueryRepository(JPAQueryFactory query) {
        this.query = query;
    }

    /** 재무제표 최신순 */
    public List<FinancialPeriod> financials(long companyId, PeriodType type, int limit) {
        return query.selectFrom(financialPeriod)
                .where(financialPeriod.companyId.eq(companyId), financialPeriod.periodType.eq(type))
                .orderBy(financialPeriod.periodEnd.desc())
                .limit(limit)
                .fetch();
    }

    /** 공시 최신순 (같은 날이면 늦게 접수된 것 먼저) */
    public List<Filing> recentFilings(long companyId, int limit) {
        return query.selectFrom(filing)
                .where(filing.companyId.eq(companyId))
                .orderBy(filing.filedAt.desc(), filing.acceptedAt.desc().nullsLast(), filing.accession.desc())
                .limit(limit)
                .fetch();
    }

    public Optional<EarningsEvent> lastReported(long companyId) {
        return Optional.ofNullable(query.selectFrom(earningsEvent)
                .where(earningsEvent.companyId.eq(companyId), earningsEvent.status.eq("REPORTED"))
                .orderBy(earningsEvent.eventDate.desc())
                .fetchFirst());
    }

    /** 오늘 이후 가장 가까운 예정 발표. 같은 날이면 확정(CONFIRMED)이 추정보다 먼저 */
    public Optional<EarningsEvent> next(long companyId, LocalDate today) {
        return Optional.ofNullable(query.selectFrom(earningsEvent)
                .where(earningsEvent.companyId.eq(companyId),
                        earningsEvent.status.in("EXPECTED", "CONFIRMED"),
                        earningsEvent.eventDate.goe(today))
                .orderBy(earningsEvent.eventDate.asc(), earningsEvent.status.asc())
                .fetchFirst());
    }
}
