package com.usstockmap.server.admin;

import com.usstockmap.server.collector.CollectorJob;
import com.usstockmap.server.collector.CollectorJobs;
import com.usstockmap.server.common.api.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 관리자: 수집기(sec, fred …) 직접 실행·상태 (docs/api.md "관리자 API") */
@RestController
@RequestMapping("/api/admin/collectors")
public class AdminCollectorController {

    /** targets 가 비거나 없으면 전체 (SEC: 티커 목록, FRED: 무시) */
    public record RunRequest(List<String> targets) {
        List<String> normalized() {
            return targets == null ? List.of() : targets.stream().map(t -> t.trim().toUpperCase()).toList();
        }
    }

    private final CollectorJobs jobs;

    public AdminCollectorController(CollectorJobs jobs) {
        this.jobs = jobs;
    }

    @GetMapping
    public List<CollectorJob.Status<?>> all() {
        return jobs.statuses();
    }

    @GetMapping("/{name}")
    public CollectorJob.Status<?> status(@PathVariable String name) {
        return job(name).status();
    }

    @PostMapping("/{name}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public CollectorJob.Status<?> run(@PathVariable String name, @RequestBody(required = false) RunRequest request) {
        CollectorJob<?> job = job(name);
        List<String> targets = request == null ? List.of() : request.normalized();
        if (!job.start(CollectorJob.Trigger.MANUAL, targets)) {
            throw ApiException.conflict(name + " collector already running");
        }
        return job.status();
    }

    private CollectorJob<?> job(String name) {
        return jobs.find(name).orElseThrow(() -> ApiException.invalid("unknown collector: " + name));
    }
}
