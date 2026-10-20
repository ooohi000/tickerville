package com.usstockmap.server.region;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class RegionCatalogTest {

    @Test
    @DisplayName("실제 지역 파일을 읽는다")
    void loadsRealRegionFile() {
        var catalog = new RegionCatalog(JsonMapper.builder().build());
        assertThat(catalog.all())
            .extracting(Region::id)
            .contains("silicon-valley", "seattle", "new-york", "austin", "atlanta", "chicago");
    }

    @Test
    @DisplayName("아이디가 중복되면 시작하지 않는다")
    void rejectsDuplicateIds() {
        var dup = List.of(
            new Region("a", "A", 0, 0, 10),
            new Region("a", "B", 1, 1, 10));
        assertThatThrownBy(() -> RegionCatalog.validate(dup)).hasMessageContaining("duplicated");
    }

    @Test
    @DisplayName("반경이 0 이하면 시작하지 않는다")
    void rejectsNonPositiveRadius() {
        var bad = List.of(new Region("a", "A", 0, 0, 0));
        assertThatThrownBy(() -> RegionCatalog.validate(bad)).hasMessageContaining("radiusKm");
    }

    @Test
    @DisplayName("위경도 범위 밖이면 시작하지 않는다")
    void rejectsOutOfRangeCoordinates() {
        var bad = List.of(new Region("a", "A", 91, 0, 10));
        assertThatThrownBy(() -> RegionCatalog.validate(bad)).hasMessageContaining("lat/lng");
    }
}
