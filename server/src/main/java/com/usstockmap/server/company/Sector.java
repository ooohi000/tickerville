package com.usstockmap.server.company;

import java.util.Arrays;

/** 섹터. DB·API 값은 소문자 문자열 (계약 `Sector`, V1__init.sql check 와 같은 목록). */
public enum Sector {
    TECH("tech"),
    COMMUNICATION("communication"),
    CONSUMER("consumer"),
    FINANCE("finance"),
    HEALTHCARE("healthcare"),
    INDUSTRIAL("industrial"),
    ENERGY("energy"),
    OTHER("other");

    private final String value;

    Sector(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static Sector fromValue(String value) {
        return Arrays.stream(values())
                .filter(s -> s.value.equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("unknown sector: " + value));
    }
}
