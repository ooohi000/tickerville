package com.usstockmap.server.collector.sec;

import tools.jackson.databind.JsonNode;

/**
 * SEC EDGAR 공개 API. 실제 구현은 {@link HttpSecClient}, 테스트는 저장해둔 응답을 읽는 가짜.
 * 모든 CIK 는 앞을 0으로 채운 10자리.
 */
public interface SecClient {

    /** 전체 티커 ↔ CIK 목록 (https://www.sec.gov/files/company_tickers.json) */
    JsonNode companyTickers();

    /** 기본 정보 + 최근 공시 목록 (data.sec.gov/submissions/CIK##########.json) */
    JsonNode submissions(String cik);

    /** 재무 원본 전체 (data.sec.gov/api/xbrl/companyfacts/CIK##########.json) */
    JsonNode companyFacts(String cik);
}
