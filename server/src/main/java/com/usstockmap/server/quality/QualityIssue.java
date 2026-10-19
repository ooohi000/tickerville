package com.usstockmap.server.quality;

/** 데이터 이상 신호 하나. code 는 고정 영문, detail 은 관리자가 읽는 한글 설명 */
public record QualityIssue(String code, String detail) {
}
