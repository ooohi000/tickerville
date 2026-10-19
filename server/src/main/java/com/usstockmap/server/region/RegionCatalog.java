package com.usstockmap.server.region;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.HashSet;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * 지역 목록. 직접 고르는 큐레이션 데이터라 DB가 아니라 classpath JSON으로 관리한다
 * (resources/data/regions.json — 프론트 web/src/data/regions.json과 같은 내용).
 * 시작할 때 한 번 읽고 검증한다.
 */
@Component
public class RegionCatalog {

    static final String RESOURCE = "data/regions.json";

    private final List<Region> regions;

    public RegionCatalog(JsonMapper jsonMapper) {
        this.regions = validate(load(jsonMapper));
    }

    public List<Region> all() {
        return regions;
    }

    private static List<Region> load(JsonMapper jsonMapper) {
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            return List.copyOf(jsonMapper.readValue(in, new TypeReference<List<Region>>() {}));
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + RESOURCE, e);
        }
    }

    /** 잘못된 데이터면 서버가 아예 안 뜨게 해서 바로 알아차리게 한다 */
    static List<Region> validate(List<Region> regions) {
        var ids = new HashSet<String>();
        for (Region r : regions) {
            if (r.id() == null || r.id().isBlank() || !ids.add(r.id())) {
                throw new IllegalStateException("region id is blank or duplicated: " + r.id());
            }
            if (r.radiusKm() <= 0) {
                throw new IllegalStateException("radiusKm must be positive: " + r.id());
            }
            if (Math.abs(r.lat()) > 90 || Math.abs(r.lng()) > 180) {
                throw new IllegalStateException("lat/lng out of range: " + r.id());
            }
        }
        return regions;
    }
}
