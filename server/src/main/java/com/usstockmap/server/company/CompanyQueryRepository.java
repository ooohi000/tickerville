package com.usstockmap.server.company;

import static com.usstockmap.server.company.QCompany.company;
import static com.usstockmap.server.company.QCompanySnapshot.companySnapshot;

import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/** 기업 조회 (QueryDSL). 검색·스크리닝 조건도 나중에 여기에 붙인다. */
@Repository
public class CompanyQueryRepository {

    private final JPAQueryFactory query;

    public CompanyQueryRepository(JPAQueryFactory query) {
        this.query = query;
    }

    /** 지도용 전체 목록. 지표 없는 기업도 포함 (left join), 티커순. 쿼리 한 번. */
    public List<CompanyRow> findAllForMap() {
        return query
                .select(company, companySnapshot)
                .from(company)
                .leftJoin(companySnapshot).on(companySnapshot.company.eq(company))
                .orderBy(company.ticker.asc())
                .fetch()
                .stream()
                .map(t -> new CompanyRow(t.get(company), t.get(companySnapshot)))
                .toList();
    }

    /** 지표가 마지막으로 갱신된 시각. 지표가 하나도 없으면 empty. */
    public Optional<Instant> findLatestSnapshotUpdate() {
        return Optional.ofNullable(
                query.select(companySnapshot.updatedAt.max()).from(companySnapshot).fetchOne());
    }
}
