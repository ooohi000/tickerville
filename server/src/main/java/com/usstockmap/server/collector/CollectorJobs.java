package com.usstockmap.server.collector;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** 이름으로 수집 실행기 찾기 (관리자 API·스케줄 공통) */
public class CollectorJobs {

    private final Map<String, CollectorJob<?>> byName = new LinkedHashMap<>();

    public CollectorJobs(List<CollectorJob<?>> jobs) {
        jobs.forEach(j -> byName.put(j.name(), j));
    }

    public CollectorJob<?> get(String name) {
        return find(name).orElseThrow(() -> new IllegalArgumentException("unknown collector: " + name));
    }

    public Optional<CollectorJob<?>> find(String name) {
        return Optional.ofNullable(byName.get(name));
    }

    public List<CollectorJob.Status<?>> statuses() {
        return byName.values().stream().<CollectorJob.Status<?>>map(CollectorJob::status).toList();
    }
}
