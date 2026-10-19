package com.usstockmap.server.collector;

import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;

/**
 * 외부 API 공통 재시도: 429·5xx·연결 오류는 base·2base·4base 쉬고 최대 3번 다시. 그 외 4xx 는 바로 실패.
 * 실패하면 CollectorHttpException (상태 코드 포함).
 */
public final class HttpRetry {

    private static final Logger log = LoggerFactory.getLogger(HttpRetry.class);
    public static final int MAX_RETRIES = 3;

    private HttpRetry() {
    }

    public static <T> T call(String label, long backoffBaseMillis, Supplier<T> call) {
        RuntimeException last = null;
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                return call.get();
            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                if (status != 429 && status < 500) {
                    throw new CollectorHttpException(label + " " + status, status, e);
                }
                last = e;
            } catch (ResourceAccessException e) {
                last = e;
            }
            if (attempt < MAX_RETRIES) {
                long wait = backoffBaseMillis << attempt;
                log.warn("{} failed, retry {}/{} in {}ms", label, attempt + 1, MAX_RETRIES, wait);
                sleep(wait);
            }
        }
        int status = last instanceof HttpStatusCodeException h ? h.getStatusCode().value() : 0;
        throw new CollectorHttpException(label + " failed after retries", status, last);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }
}
