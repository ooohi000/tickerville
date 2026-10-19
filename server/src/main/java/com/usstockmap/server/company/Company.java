package com.usstockmap.server.company;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** 기업 기본 정보. 지도에 그릴 위치 + SEC 기본 정보 + 직접 쓰는 한글 소개. */
@Entity
@Table(name = "company")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String ticker;

    /** SEC 기업번호, 앞을 0으로 채운 10자리. 목데이터는 null. */
    @Column(unique = true, length = 10)
    private String cik;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String nameKo;

    @Column(nullable = false, length = 20)
    private Sector sector;

    @Column(nullable = false, length = 100)
    private String hqCity;

    @Column(nullable = false, length = 2)
    private String hqState;

    @Column(nullable = false)
    private Double hqLat;

    @Column(nullable = false)
    private Double hqLng;

    @Column(length = 20)
    private String exchange;

    @Column(length = 4)
    private String sicCode;

    @Column(length = 200)
    private String sicDescription;

    /** 회계연도 마감 MMDD (예: 애플 0927). */
    @Column(length = 4)
    private String fiscalYearEnd;

    @Column(columnDefinition = "text")
    private String descriptionKo;

    @Column(columnDefinition = "text")
    private String memo;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public Company(String ticker, String name, Sector sector,
                   String hqCity, String hqState, double hqLat, double hqLng) {
        this.ticker = ticker;
        this.name = name;
        this.sector = sector;
        this.hqCity = hqCity;
        this.hqState = hqState;
        this.hqLat = hqLat;
        this.hqLng = hqLng;
    }
}
