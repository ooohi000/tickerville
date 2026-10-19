package com.usstockmap.server.earnings;

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

/** 실적 발표 이벤트 (읽기 전용 — 쓰기는 수집기·관리자 입력) */
@Entity
@Immutable
@Table(name = "earnings_event")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EarningsEvent {

    @Id
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(nullable = false)
    private LocalDate eventDate;

    @Column(length = 6)
    private String timing;

    @Column(nullable = false, length = 10)
    private String source;

    @Column(unique = true, length = 25)
    private String accession;

    @Column(nullable = false)
    private Instant recordedAt;

    @Column(columnDefinition = "text")
    private String note;
}
