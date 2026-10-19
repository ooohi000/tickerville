package com.usstockmap.server.filing;

import java.time.LocalDate;

/** 계약 Filing */
public record FilingResponse(String form, String items, String labelKo, LocalDate filedAt, String url) {

    public static FilingResponse from(Filing f) {
        return new FilingResponse(f.getForm(), f.getItems(), FilingLabels.labelKo(f.getForm(), f.getItems()),
                f.getFiledAt(), f.getUrl());
    }
}
