package com.usstockmap.server.company;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CompanyServiceTest {

    // 한국 시간 2026-10-20 오전 10시 = 미국 동부 2026-10-19 밤 9시
    static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-20T01:00:00Z"), ZoneOffset.UTC);

    final CompanyQueryRepository repository = mock(CompanyQueryRepository.class);
    final CompanyService service = new CompanyService(repository, CLOCK);

    @Test
    @DisplayName("asOf 는 지표 마지막 갱신 시각의 미국 동부 날짜")
    void asOfIsLatestUpdateInEasternTime() {
        when(repository.findLatestSnapshotUpdate()).thenReturn(Optional.of(Instant.parse("2026-10-17T02:00:00Z")));
        when(repository.findAllForMap()).thenReturn(List.of());

        assertThat(service.getMapDataset().asOf()).isEqualTo(LocalDate.of(2026, 10, 16));
    }

    @Test
    @DisplayName("지표가 하나도 없으면 asOf 는 오늘 (미국 동부)")
    void asOfFallsBackToTodayInEasternTime() {
        when(repository.findLatestSnapshotUpdate()).thenReturn(Optional.empty());
        when(repository.findAllForMap()).thenReturn(List.of());

        assertThat(service.getMapDataset().asOf()).isEqualTo(LocalDate.of(2026, 10, 19));
    }

    @Test
    @DisplayName("지표 없는 기업: 지표는 전부 null, 공시 건수는 0, 위치·섹터는 그대로")
    void companyWithoutSnapshotHasNullMetrics() {
        Company cost = new Company("COST", "Costco", Sector.CONSUMER, "Issaquah", "WA", 47.53, -122.03);
        when(repository.findLatestSnapshotUpdate()).thenReturn(Optional.empty());
        when(repository.findAllForMap()).thenReturn(List.of(new CompanyRow(cost, null)));

        CompanyResponse r = service.getMapDataset().companies().getFirst();

        assertThat(r.ticker()).isEqualTo("COST");
        assertThat(r.sector()).isEqualTo("consumer");
        assertThat(r.hq()).isEqualTo(new CompanyResponse.Hq("Issaquah", "WA", 47.53, -122.03));
        assertThat(r.revenueTtmUsd()).isNull();
        assertThat(r.netIncomeTtmUsd()).isNull();
        assertThat(r.totalAssetsUsd()).isNull();
        assertThat(r.operatingMarginTtm()).isNull();
        assertThat(r.revenueGrowthYoy()).isNull();
        assertThat(r.publicFloatUsd()).isNull();
        assertThat(r.publicFloatAsOf()).isNull();
        assertThat(r.filings30d()).isEqualTo(new CompanyResponse.FilingActivity(0, 0));
    }
}
