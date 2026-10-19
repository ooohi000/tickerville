package com.usstockmap.server.common.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** 예외를 docs/api.md의 에러 응답 모양으로 바꾼다 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiErrorResponse> handleApi(ApiException e) {
        return respond(e.code(), e.getMessage());
    }

    /** 쿼리 값 형식 오류, 누락, 검증 실패 (예: period=weekly, limit=abc, limit=999) */
    @ExceptionHandler({
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class,
        HandlerMethodValidationException.class,
    })
    ResponseEntity<ApiErrorResponse> handleBadRequest(Exception e) {
        return respond(ErrorCode.INVALID_PARAMETER, e.getMessage());
    }

    /** 없는 경로는 스프링 기본 404 그대로 (에러 코드 표에 없는 경우) */
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<Void> handleNoResource() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> handleUnexpected(Exception e) {
        log.error("Unhandled exception", e);
        // 내부 정보는 응답에 싣지 않는다
        return respond(ErrorCode.INTERNAL_ERROR, "internal error");
    }

    private static ResponseEntity<ApiErrorResponse> respond(ErrorCode code, String message) {
        return ResponseEntity.status(code.status()).body(ApiErrorResponse.of(code, message));
    }
}
