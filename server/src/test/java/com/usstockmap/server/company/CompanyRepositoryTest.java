package com.usstockmap.server.company;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.usstockmap.server.support.DbTest;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

@DbTest
class CompanyRepositoryTest {

    @Autowired
    CompanyRepository companies;

    @Autowired
    CompanySnapshotRepository snapshots;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    @DisplayName("목데이터 10개 기업과 지표가 들어가 있다 (웹 companies.json 과 같은 목록)")
    void seedLoadsTenCompaniesWithSnapshots() {
        List<CompanySnapshot> all = snapshots.findAllWithCompany();

        assertThat(all).hasSize(10);
        assertThat(all).extracting(s -> s.getCompany().getTicker())
                .containsExactly("AAPL", "AMZN", "GOOGL", "JPM", "KO", "META", "MSFT", "NVDA", "PLTR", "TSLA");
    }

    @Test
    @DisplayName("지표 값: 금액은 달러 정수, 비율은 소수, 없는 값은 null")
    void snapshotValuesKeepUnitsAndNulls() {
        CompanySnapshot jpm = snapshotOf("JPM");
        CompanySnapshot nvda = snapshotOf("NVDA");

        assertThat(jpm.getOperatingMarginTtm()).isNull();      // 은행은 영업이익 개념이 없다
        assertThat(jpm.getTotalAssetsUsd()).isEqualTo(4_000_000_000_000L);
        assertThat(nvda.getRevenueGrowthYoy()).isEqualTo(0.55);
        assertThat(nvda.getFilingsMaterial30d()).isEqualTo(3);
        assertThat(nvda.getFilingsInsider30d()).isEqualTo(14);
        assertThat(nvda.getDataAsOf()).isNull();               // 샘플 값이라 기준일 없음
    }

    @Test
    @DisplayName("기업 정보: 섹터는 enum 으로, 본사 위치는 그대로 읽힌다")
    void companyFieldsAreMapped() {
        Company pltr = companies.findByTicker("PLTR").orElseThrow();

        assertThat(pltr.getSector()).isEqualTo(Sector.TECH);
        assertThat(pltr.getHqState()).isEqualTo("FL");
        assertThat(pltr.getHqLat()).isEqualTo(25.9565);
        assertThat(pltr.getNameKo()).isEqualTo("팔란티어");
        assertThat(pltr.getCik()).isNull();
        assertThat(pltr.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("새 기업을 저장하면 id 와 생성·수정 시각이 채워진다")
    void saveAssignsIdAndTimestamps() {
        Company saved = companies.saveAndFlush(
                new Company("COST", "Costco", Sector.CONSUMER, "Issaquah", "WA", 47.5301, -122.0326));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(companies.findByTicker("COST")).isPresent();
    }

    @Test
    @DisplayName("같은 티커는 두 번 저장할 수 없다")
    void tickerIsUnique() {
        assertThatThrownBy(() -> companies.saveAndFlush(
                new Company("AAPL", "Apple again", Sector.TECH, "Cupertino", "CA", 37.3, -122.0)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // PostgreSQL 은 실패한 문장 뒤 트랜잭션 전체가 막히므로 경우마다 따로 돌린다
    @ParameterizedTest(name = "{0}")
    @CsvSource(nullValues = "NULL", value = {
            "모르는 섹터, crypto, CA, NULL",
            "소문자 주 코드, tech, ca, NULL",
            "10자리가 아닌 CIK, tech, CA, 320193",
            "숫자가 아닌 CIK, tech, CA, 00003201AB",
    })
    @DisplayName("DB 검사 규칙이 잘못된 값을 거부한다")
    void checkConstraintsRejectBadValues(String caseName, String sector, String state, String cik) {
        String insert = "insert into company (ticker, name, sector, hq_city, hq_state, hq_lat, hq_lng, cik) "
                + "values ('BAD', 'X', ?, 'City', ?, 0, 0, ?)";

        assertThatThrownBy(() -> jdbc.update(insert, sector, state, cik))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("기업을 지우면 지표 줄도 같이 지워진다")
    void deletingCompanyCascadesToSnapshot() {
        Long id = companies.findByTicker("KO").orElseThrow().getId();

        jdbc.update("delete from company where id = ?", id);

        assertThat(jdbc.queryForObject(
                "select count(*) from company_snapshot where company_id = ?", Integer.class, id)).isZero();
    }

    private CompanySnapshot snapshotOf(String ticker) {
        return snapshots.findAllWithCompany().stream()
                .filter(s -> s.getCompany().getTicker().equals(ticker))
                .findFirst()
                .orElseThrow();
    }
}
