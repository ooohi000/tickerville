package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.financial.SecFact;
import com.usstockmap.server.support.SecFixtures;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class CompanyFactsParserTest {

    @Test
    @DisplayName("실제 애플 응답: 필요한 개념만, 기간 값·시점 값·공시상 시총이 구분돼 읽힌다")
    void parsesRealResponse() {
        List<SecFact> facts = SecFixtures.companyFacts("AAPL");

        assertThat(facts).isNotEmpty();
        assertThat(facts).extracting(SecFact::concept)
                .contains("RevenueFromContractWithCustomerExcludingAssessedTax", "Assets", "EntityPublicFloat")
                .allMatch(c -> CompanyFactsParser.CONCEPTS.values().stream().anyMatch(s -> s.contains(c)));

        SecFact q3Revenue = facts.stream()
                .filter(f -> f.concept().startsWith("RevenueFromContract")
                        && LocalDate.parse("2026-06-27").equals(f.end()) && f.days() == 91)
                .findFirst().orElseThrow();
        assertThat(q3Revenue.value()).isEqualByComparingTo("109417000000");
        assertThat(q3Revenue.form()).isEqualTo("10-Q");

        SecFact assets = facts.stream().filter(f -> f.concept().equals("Assets")).findFirst().orElseThrow();
        assertThat(assets.isDuration()).isFalse();
    }

    @Test
    @DisplayName("주당순이익은 USD/shares 단위, 소수 그대로")
    void perShareUnit() {
        assertThat(SecFixtures.companyFacts("AAPL"))
                .filteredOn(f -> f.concept().equals("EarningsPerShareDiluted"))
                .isNotEmpty()
                .allMatch(f -> f.unit().equals("USD/shares"));
    }

    @Test
    @DisplayName("필수 값이 빠진 줄은 버리고, 모르는 개념은 무시한다")
    void skipsIncompleteRows() {
        var json = JsonMapper.builder().build().readTree("""
                { "facts": { "us-gaap": {
                    "Assets": { "units": { "USD": [
                        { "end": "2026-06-30", "val": 100, "accn": "a1", "form": "10-Q", "filed": "2026-08-01", "fy": 2026, "fp": "Q2" },
                        { "end": "2026-03-31", "val": 90, "form": "10-Q", "filed": "2026-05-01" }
                    ] } },
                    "SomethingElse": { "units": { "USD": [
                        { "end": "2026-06-30", "val": 1, "accn": "a1", "form": "10-Q", "filed": "2026-08-01" }
                    ] } }
                } } }
                """);

        List<SecFact> facts = CompanyFactsParser.parse(json);
        assertThat(facts).hasSize(1);
        assertThat(facts.getFirst().fy()).isEqualTo(2026);
        assertThat(facts.getFirst().fp()).isEqualTo("Q2");
    }
}
