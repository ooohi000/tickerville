package com.usstockmap.server.collector.sec;

/** SEC 호출 실패 (재시도까지 실패했거나, 없는 기업). 수집기는 기업 단위로 잡고 다음 기업으로 넘어간다 */
public class SecApiException extends RuntimeException {

    private final int status;

    public SecApiException(String message, int status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public int status() {
        return status;
    }
}
