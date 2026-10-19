package com.usstockmap.server.company;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SectorGuessTest {

    @ParameterizedTest(name = "{0} SIC {1} → {2}")
    @CsvSource(nullValues = "NULL", value = {
            "AAPL, 3571, TECH",
            "NVDA, 3674, TECH",
            "PLTR, 7372, TECH",
            "JPM, 6021, FINANCE",
            "AMZN, 5961, CONSUMER",
            "KO, 2080, CONSUMER",
            "TSLA, 3711, CONSUMER",
            "LLY, 2834, HEALTHCARE",
            "XOM, 2911, ENERGY",
            "VZ, 4813, COMMUNICATION",
            "CAT, 3531, INDUSTRIAL",
            "unknown, NULL, OTHER",
    })
    @DisplayName("SEC 업종 코드로 섹터 추정")
    void guesses(String ticker, String sic, Sector expected) {
        assertThat(SectorGuess.fromSic(sic)).isEqualTo(expected);
    }
}
