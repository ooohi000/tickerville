package com.usstockmap.server.company;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class CompanyUniverseTest {

    @Test
    @DisplayName("실제 universe.csv: 형식 통과, 목데이터 10개 포함, 모든 업종이 한 번 이상 (OTHER 제외)")
    void realFile() {
        CompanyUniverse u = CompanyUniverse.load();

        assertThat(u.entries()).hasSizeGreaterThanOrEqualTo(90);
        assertThat(u.entries()).extracting(CompanyUniverse.Entry::ticker)
                .contains("AAPL", "NVDA", "GOOGL", "META", "MSFT", "AMZN", "TSLA", "JPM", "KO", "PLTR", "BRK-B");
        for (Sector s : Sector.values()) {
            if (s == Sector.OTHER) continue;
            assertThat(u.entries()).as(s.value()).anyMatch(e -> e.sector() == s);
        }
    }

    @Test
    @DisplayName("주석·빈 줄은 건너뛰고 앞뒤 공백은 정리")
    void parses() throws Exception {
        CompanyUniverse u = parse("""
                # 주석
                ticker,sector,name_ko,description_ko

                KO, consumer ,코카콜라, 음료 기업\s
                """);
        assertThat(u.entries()).containsExactly(
                new CompanyUniverse.Entry("KO", Sector.CONSUMER, "코카콜라", "음료 기업"));
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', value = {
            "소개에 쉼표 | KO,consumer,코카콜라,음료,과자",
            "모르는 업종 | KO,food,코카콜라,음료",
            "소문자 티커 | ko,consumer,코카콜라,음료",
            "빈 소개 | KO,consumer,코카콜라,",
    })
    @DisplayName("잘못된 줄은 앱이 뜨기 전에 실패 (줄 번호 포함)")
    void rejectsBadLine(String why, String line) {
        assertThatThrownBy(() -> parse(CompanyUniverse.HEADER + "\n" + line))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("line 2");
    }

    @Test
    @DisplayName("중복 티커·헤더 없음도 실패")
    void rejectsDuplicateAndMissingHeader() {
        assertThatThrownBy(() -> parse(CompanyUniverse.HEADER + "\nKO,consumer,a,b\nKO,consumer,a,b"))
                .hasMessageContaining("duplicate");
        assertThatThrownBy(() -> parse("KO,consumer,a,b")).hasMessageContaining("header");
    }

    private static CompanyUniverse parse(String text) throws Exception {
        return CompanyUniverse.parse(new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8)));
    }
}
