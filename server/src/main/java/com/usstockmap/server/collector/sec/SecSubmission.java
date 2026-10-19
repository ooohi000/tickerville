package com.usstockmap.server.collector.sec;

import java.util.List;

/** submissions 응답에서 쓰는 것: 기본 정보 + 공시 목록(최신순) */
public record SecSubmission(
        String cik,
        String name,
        String exchange,
        String sicCode,
        String sicDescription,
        String fiscalYearEnd,
        Address businessAddress,
        List<SecFiling> filings
) {

    public record Address(String street, String city, String state, String zip) {
    }
}
