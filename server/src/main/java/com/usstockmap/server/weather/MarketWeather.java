package com.usstockmap.server.weather;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/** 시장 날씨 지수 (주간). 계산 원본 STLFSI 값도 같이 남긴다. */
@Entity
@Table(name = "market_weather")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MarketWeather {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate asOf;

    /** FRED STLFSI4 (0 = 평균, 클수록 불안). */
    @Column(nullable = false)
    private Double stressIndex;

    /** 0~100, 클수록 안정. */
    @Column(nullable = false)
    private Double value;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public MarketWeather(LocalDate asOf, double stressIndex, double value) {
        this.asOf = asOf;
        this.stressIndex = stressIndex;
        this.value = value;
    }
}
