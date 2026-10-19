package com.usstockmap.server.common.api;

import org.springframework.http.HttpStatus;

/** API 에러 코드. docs/api.md "에러" 표와 1:1로 맞춘다 */
public enum ErrorCode {
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST),
    COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
