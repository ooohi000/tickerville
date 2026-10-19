package com.usstockmap.server.filing;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class FilingLabelsTest {

    @ParameterizedTest(name = "{0} [{1}] → {2}")
    @CsvSource(nullValues = "NULL", delimiter = '|', value = {
            "10-K    | NULL          | 연간 보고서",
            "10-Q    | NULL          | 분기 보고서",
            "10-Q/A  | NULL          | 분기 보고서 (정정)",
            "4       | NULL          | 내부자 거래",
            "8-K     | 2.02,9.01     | 실적 발표",
            "8-K     | 9.01,2.02     | 실적 발표",
            "8-K     | 5.02          | 경영진 변동",
            "8-K     | 1.01,2.03,9.01| 주요 계약",
            "8-K     | 9.01          | 중요 사건",
            "8-K     | NULL          | 중요 사건",
            "8-K/A   | 2.02          | 실적 발표 (정정)",
            "DEF 14A | NULL          | 주주총회 안내",
            "SC 13G  | NULL          | SC 13G",
    })
    @DisplayName("공시 종류·8-K 항목 → 한글 이름")
    void labels(String form, String items, String expected) {
        assertThat(FilingLabels.labelKo(form.trim(), items == null ? null : items.trim())).isEqualTo(expected);
    }
}
