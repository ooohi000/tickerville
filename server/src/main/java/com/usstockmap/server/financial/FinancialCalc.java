package com.usstockmap.server.financial;

/** 재무 정리 규칙 버전. 개념 후보·기간 판정·TTM 규칙을 바꾸면 올린다 (쌓은 기록과 섞어 비교하지 않게). */
public final class FinancialCalc {

    /** 2: 회계연도 이름표를 공시 단위로 (알파벳 태그 변경 버그) */
    public static final int VERSION = 2;

    private FinancialCalc() {
    }
}
