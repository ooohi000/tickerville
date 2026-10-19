package com.usstockmap.server.common.api;

/**
 * 모든 에러 응답의 모양: {@code { "error": { "code": "...", "message": "..." } }}
 * 프론트 타입 ApiError와 같다 (web/src/types/index.ts).
 */
public record ApiErrorResponse(Body error) {

    public record Body(ErrorCode code, String message) {}

    public static ApiErrorResponse of(ErrorCode code, String message) {
        return new ApiErrorResponse(new Body(code, message));
    }
}
