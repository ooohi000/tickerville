package com.usstockmap.server.weather;

import com.usstockmap.server.common.api.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MarketWeatherService {

    private final MarketWeatherRepository weathers;

    public MarketWeatherService(MarketWeatherRepository weathers) {
        this.weathers = weathers;
    }

    /** 가장 최근 기준일 값. 아직 한 번도 수집 안 됐으면 503 DATA_NOT_READY. */
    public MarketWeatherResponse getLatest() {
        return weathers.findTopByOrderByAsOfDesc()
                .map(MarketWeatherResponse::from)
                .orElseThrow(() -> ApiException.dataNotReady("market weather"));
    }
}
