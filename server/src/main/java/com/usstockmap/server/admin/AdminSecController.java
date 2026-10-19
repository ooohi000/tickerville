package com.usstockmap.server.admin;

import com.usstockmap.server.collector.sec.SecSyncJob;
import com.usstockmap.server.common.api.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 관리자: SEC 수집 직접 실행·상태 (docs/api.md "관리자 API") */
@RestController
@RequestMapping("/api/admin/sec-sync")
public class AdminSecController {

    /** tickers 가 비거나 없으면 전체 */
    public record SyncRequest(List<String> tickers) {
        List<String> normalized() {
            return tickers == null ? List.of() : tickers.stream().map(t -> t.trim().toUpperCase()).toList();
        }
    }

    private final SecSyncJob job;

    public AdminSecController(SecSyncJob job) {
        this.job = job;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public SecSyncJob.Status start(@RequestBody(required = false) SyncRequest request) {
        List<String> tickers = request == null ? List.of() : request.normalized();
        if (!job.start(SecSyncJob.Trigger.MANUAL, tickers)) {
            throw ApiException.conflict("SEC sync already running");
        }
        return job.status();
    }

    @GetMapping
    public SecSyncJob.Status status() {
        return job.status();
    }
}
