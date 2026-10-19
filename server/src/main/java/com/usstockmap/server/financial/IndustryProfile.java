package com.usstockmap.server.financial;

/**
 * 업종별 재무 항목 규칙. 은행은 매출 개념이 다르고 영업이익·설비투자가 없다.
 * SEC SIC 코드로 정한다 (submissions 의 sic).
 */
public enum IndustryProfile {
    STANDARD,
    BANK;

    /** 6020~6029 상업은행, 6035·6036 저축은행 */
    public static IndustryProfile fromSic(String sic) {
        if (sic == null || sic.isBlank()) {
            return STANDARD;
        }
        int code;
        try {
            code = Integer.parseInt(sic.trim());
        } catch (NumberFormatException e) {
            return STANDARD;
        }
        boolean bank = (code >= 6020 && code <= 6029) || code == 6035 || code == 6036;
        return bank ? BANK : STANDARD;
    }
}
