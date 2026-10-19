package com.usstockmap.server.financial;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class IndustryProfileTest {

    @ParameterizedTest(name = "SIC {0} → {1}")
    @CsvSource(nullValues = "NULL", value = {
            "6021, BANK",       // JP모건 (국법은행)
            "6022, BANK",
            "6035, BANK",
            "6211, STANDARD",   // 증권사는 일반 규칙
            "3571, STANDARD",   // 애플
            "NULL, STANDARD",
            "'', STANDARD",
            "abc, STANDARD",
    })
    @DisplayName("SIC 업종 코드로 은행 여부")
    void fromSic(String sic, IndustryProfile expected) {
        assertThat(IndustryProfile.fromSic(sic)).isEqualTo(expected);
    }
}
