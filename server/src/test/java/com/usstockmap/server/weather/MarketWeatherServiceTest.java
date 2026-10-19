package com.usstockmap.server.weather;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.usstockmap.server.common.api.ApiException;
import com.usstockmap.server.common.api.ErrorCode;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MarketWeatherServiceTest {

    final MarketWeatherRepository repository = mock(MarketWeatherRepository.class);
    final MarketWeatherService service = new MarketWeatherService(repository);

    @Test
    @DisplayName("가장 최근 값을 계약 모양으로 바꾼다")
    void mapsLatest() {
        when(repository.findTopByOrderByAsOfDesc())
                .thenReturn(Optional.of(new MarketWeather(LocalDate.of(2026, 10, 16), -0.6, 62)));

        assertThat(service.getLatest()).isEqualTo(new MarketWeatherResponse(62, LocalDate.of(2026, 10, 16)));
    }

    @Test
    @DisplayName("값이 없으면 DATA_NOT_READY")
    void throwsWhenEmpty() {
        when(repository.findTopByOrderByAsOfDesc()).thenReturn(Optional.empty());

        assertThatThrownBy(service::getLatest)
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo(ErrorCode.DATA_NOT_READY));
    }
}
