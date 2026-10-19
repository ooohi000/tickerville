package com.usstockmap.server.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * SEC companyfacts 원본 값 한 줄 (financial_fact 테이블과 같은 모양).
 * start 가 null 이면 시점 값(총자산 등), 있으면 기간 값(매출 등).
 * fy·fp 는 "이 값이 실린 공시"의 회계연도·분기라 기간 판정에 쓰지 않는다 (라벨 참고용).
 */
public record SecFact(
        String taxonomy,
        String concept,
        String unit,
        LocalDate start,
        LocalDate end,
        BigDecimal value,
        String accession,
        String form,
        LocalDate filed,
        Integer fy,
        String fp
) {

    public boolean isDuration() {
        return start != null;
    }

    /** 기간 길이(일, 양 끝 포함). 시점 값이면 0 */
    public long days() {
        return start == null ? 0 : ChronoUnit.DAYS.between(start, end) + 1;
    }
}
