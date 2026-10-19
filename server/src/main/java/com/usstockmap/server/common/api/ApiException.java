package com.usstockmap.server.common.api;

/** 비즈니스 규칙 위반을 에러 코드와 함께 던진다. GlobalExceptionHandler가 응답으로 바꾼다 */
public class ApiException extends RuntimeException {

    private final ErrorCode code;

    public ApiException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }

    public static ApiException companyNotFound(String ticker) {
        return new ApiException(ErrorCode.COMPANY_NOT_FOUND, "ticker " + ticker + " not found");
    }
}
