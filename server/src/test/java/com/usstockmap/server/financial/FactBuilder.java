package com.usstockmap.server.financial;

import java.math.BigDecimal;
import java.time.LocalDate;

/** 테스트용 SecFact 만들기 (짧게 쓰려고) */
final class FactBuilder {

    private FactBuilder() {
    }

    /** 기간 값 */
    static SecFact flow(String start, String end, long value, String form, String filed) {
        return new SecFact("us-gaap", "Revenues", "USD", LocalDate.parse(start), LocalDate.parse(end),
                BigDecimal.valueOf(value), "acc-" + form + "-" + filed + "-" + end, form, LocalDate.parse(filed),
                Integer.parseInt(filed.substring(0, 4)), null);
    }

    /** 기간 값 + 회계연도 라벨 지정 */
    static SecFact flow(String start, String end, long value, String form, String filed, int fy) {
        SecFact f = flow(start, end, value, form, filed);
        return new SecFact(f.taxonomy(), f.concept(), f.unit(), f.start(), f.end(), f.value(), f.accession(),
                f.form(), f.filed(), fy, null);
    }

    /** 시점 값 */
    static SecFact stock(String end, long value, String filed) {
        return new SecFact("us-gaap", "Assets", "USD", null, LocalDate.parse(end), BigDecimal.valueOf(value),
                "acc-" + filed + "-" + end, "10-Q", LocalDate.parse(filed), null, null);
    }
}
