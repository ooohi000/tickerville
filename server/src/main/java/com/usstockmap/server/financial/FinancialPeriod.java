package com.usstockmap.server.financial;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

/** 정리된 재무제표 한 기간 (읽기 전용 — 쓰기는 수집기 SecSyncWriter 가 배치로) */
@Entity
@Immutable
@Table(name = "financial_period")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FinancialPeriod {

    @Id
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 2)
    private PeriodType periodType;

    @Column(nullable = false)
    private Integer fiscalYear;

    @Column(nullable = false, length = 2)
    private String fiscalPeriod;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    private LocalDate filedAt;
    private Long revenue;
    private Long grossProfit;
    private Long operatingIncome;
    private Long netIncome;

    @Column(precision = 12, scale = 4)
    private BigDecimal epsDiluted;

    private Long totalAssets;
    private Long totalLiabilities;
    private Long totalEquity;
    private Long operatingCashFlow;
    private Long capitalExpenditure;
    private Long freeCashFlow;
}
