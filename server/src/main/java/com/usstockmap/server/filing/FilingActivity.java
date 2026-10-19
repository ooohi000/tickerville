package com.usstockmap.server.filing;

/** 최근 30일 공시 건수 (계약 filings30d). material = 8-K·8-K/A, insider = Form 4·4/A */
public record FilingActivity(int material, int insider) {
}
