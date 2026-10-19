package com.usstockmap.server.company;

/** 지도 목록 한 줄: 기업 + 지표 (지표가 아직 없으면 snapshot = null). */
public record CompanyRow(Company company, CompanySnapshot snapshot) {
}
