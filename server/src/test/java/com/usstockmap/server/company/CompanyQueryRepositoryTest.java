package com.usstockmap.server.company;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.support.DbTest;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@DbTest
@Import(CompanyQueryRepository.class) // JPA 슬라이스는 직접 만든 QueryDSL 리포지토리를 자동으로 안 올린다
class CompanyQueryRepositoryTest {

    @Autowired
    CompanyRepository companies;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    CompanyQueryRepository repository;

    @Test
    @DisplayName("지도 목록: 목데이터 10개가 티커순으로, 지표와 함께 나온다")
    void findsAllCompaniesWithSnapshotsInTickerOrder() {
        List<CompanyRow> rows = repository.findAllForMap();

        assertThat(rows).extracting(r -> r.company().getTicker())
                .containsExactly("AAPL", "AMZN", "GOOGL", "JPM", "KO", "META", "MSFT", "NVDA", "PLTR", "TSLA");
        assertThat(rows).allSatisfy(r -> assertThat(r.snapshot()).isNotNull());
    }

    @Test
    @DisplayName("지표가 아직 없는 기업도 목록에 나온다 (snapshot = null)")
    void includesCompanyWithoutSnapshot() {
        companies.saveAndFlush(new Company("COST", "Costco", Sector.CONSUMER, "Issaquah", "WA", 47.53, -122.03));

        CompanyRow cost = repository.findAllForMap().stream()
                .filter(r -> r.company().getTicker().equals("COST"))
                .findFirst()
                .orElseThrow();

        assertThat(cost.snapshot()).isNull();
    }

    @Test
    @DisplayName("지표 마지막 갱신 시각: 있으면 값, 지표가 없으면 empty")
    void latestSnapshotUpdate() {
        assertThat(repository.findLatestSnapshotUpdate()).isPresent();

        jdbc.update("delete from company_snapshot");

        assertThat(repository.findLatestSnapshotUpdate()).isEmpty();
    }
}
