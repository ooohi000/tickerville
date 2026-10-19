package com.usstockmap.server.common.api;

import org.springframework.http.HttpStatus;

/** API 에러 코드. docs/api.md "에러" 표와 1:1로 맞춘다 */
public enum ErrorCode {
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST),
    /** 관리자 API 키가 없거나 틀림 (관리자 API 가 꺼져 있을 때도) */
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND),
    /** 이미 진행 중이거나 이미 있음 (수집 중복 실행, 같은 티커 등록) */
    CONFLICT(HttpStatus.CONFLICT),
    /** 아직 한 번도 수집되지 않은 데이터 */
    DATA_NOT_READY(HttpStatus.SERVICE_UNAVAILABLE),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
