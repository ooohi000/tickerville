package com.usstockmap.server.weather;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/market-weather")
public class MarketWeatherController {

    private final MarketWeatherService service;

    public MarketWeatherController(MarketWeatherService service) {
        this.service = service;
    }

    @GetMapping
    public MarketWeatherResponse marketWeather() {
        return service.getLatest();
    }
}
