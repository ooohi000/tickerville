package com.usstockmap.server.filing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

/** 공시 한 건 (읽기 전용 — 쓰기는 수집기) */
@Entity
@Immutable
@Table(name = "filing")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Filing {

    @Id
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false, unique = true, length = 25)
    private String accession;

    @Column(nullable = false, length = 20)
    private String form;

    @Column(nullable = false)
    private LocalDate filedAt;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 100)
    private String items;

    private Instant acceptedAt;
    private LocalDate reportDate;
}
