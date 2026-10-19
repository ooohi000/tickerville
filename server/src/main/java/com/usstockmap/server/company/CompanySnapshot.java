package com.usstockmap.server.company;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import com.usstockmap.server.filing.FilingActivity;
import com.usstockmap.server.financial.MapMetrics;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 지도용 최신 지표 (기업당 한 줄). 수집기가 계산해서 덮어쓴다.
 * 금액은 달러 정수, 비율은 0.32 = 32%. 없는 값은 null (계약 `Company` 와 같은 규칙).
 */
@Entity
@Table(name = "company_snapshot")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanySnapshot {

    @Id
    private Long companyId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id")
    private Company company;

    private Long revenueTtmUsd;
    private Long netIncomeTtmUsd;
    private Long totalAssetsUsd;
    private Double operatingMarginTtm;
    private Double revenueGrowthYoy;
    private Long publicFloatUsd;
    private LocalDate publicFloatAsOf;

    @Column(name = "filings_material_30d", nullable = false)
    private int filingsMaterial30d;

    @Column(name = "filings_insider_30d", nullable = false)
    private int filingsInsider30d;

    /** 이 기업 재무 데이터의 마지막 기간 마감일. */
    private LocalDate dataAsOf;

    /** 계산에 쓴 정리 규칙 버전 (FinancialCalc.VERSION). 목데이터는 null */
    private Integer calcVersion;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public CompanySnapshot(Company company) {
        this.company = company;
    }

    /** 수집 결과로 덮어쓴다 (최신값). 같은 값이 company_metric_daily 에도 한 줄 쌓인다 */
    public void apply(MapMetrics m, FilingActivity activity, int calcVersion) {
        this.revenueTtmUsd = m.revenueTtmUsd();
        this.netIncomeTtmUsd = m.netIncomeTtmUsd();
        this.totalAssetsUsd = m.totalAssetsUsd();
        this.operatingMarginTtm = m.operatingMarginTtm();
        this.revenueGrowthYoy = m.revenueGrowthYoy();
        this.publicFloatUsd = m.publicFloatUsd();
        this.publicFloatAsOf = m.publicFloatAsOf();
        this.dataAsOf = m.dataAsOf();
        this.filingsMaterial30d = activity.material();
        this.filingsInsider30d = activity.insider();
        this.calcVersion = calcVersion;
    }
}
