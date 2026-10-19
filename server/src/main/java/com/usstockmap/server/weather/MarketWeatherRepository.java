package com.usstockmap.server.weather;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketWeatherRepository extends JpaRepository<MarketWeather, Long> {

    Optional<MarketWeather> findTopByOrderByAsOfDesc();
}
