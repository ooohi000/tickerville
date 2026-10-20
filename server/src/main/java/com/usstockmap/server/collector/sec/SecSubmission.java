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

    /** street2: 두 번째 줄 (BAC 처럼 첫 줄이 건물 이름이고 번지가 여기 있는 경우) */
    public record Address(String street, String city, String state, String zip, String street2) {

        public Address(String street, String city, String state, String zip) {
            this(street, city, state, zip, null);
        }
    }
}
