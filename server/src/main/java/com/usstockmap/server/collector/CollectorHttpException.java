package com.usstockmap.server.collector;

/** 외부 API 호출 실패 (재시도까지 실패했거나, 없는 자원). 수집기는 대상 단위로 잡고 다음으로 넘어간다 */
public class CollectorHttpException extends RuntimeException {

    private final int status;

    public CollectorHttpException(String message, int status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public int status() {
        return status;
    }
}
