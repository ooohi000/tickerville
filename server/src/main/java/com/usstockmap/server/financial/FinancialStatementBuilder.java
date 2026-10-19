package com.usstockmap.server.financial;

import com.usstockmap.server.financial.PeriodNormalizer.Picked;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * 기업 하나의 SEC 원본 값 전체 → 분기·연간 재무제표 목록. 순수 계산.
 * 항목마다 개념 후보를 순서대로 보고, 기간마다 값이 있는 첫 후보를 쓴다.
 */
public final class FinancialStatementBuilder {

    private FinancialStatementBuilder() {
    }

    private record RowKey(PeriodType type, LocalDate end) {
    }

    /** @return 기간 끝 최신순 (같은 날 끝나면 Q4 → FY 순) */
    public static List<FinancialRow> build(List<SecFact> facts, IndustryProfile profile) {
        Map<String, List<SecFact>> byConceptUnit = facts.stream()
                .filter(f -> Metric.TAXONOMY.equals(f.taxonomy()))
                .collect(Collectors.groupingBy(f -> f.concept() + "|" + f.unit()));

        Map<Metric, Map<RowKey, PeriodValue>> flows = new EnumMap<>(Metric.class);
        Map<Metric, Map<LocalDate, Picked>> stocks = new EnumMap<>(Metric.class);
        for (Metric m : Metric.values()) {
            for (String concept : m.candidates(profile)) {
                List<SecFact> list = byConceptUnit.getOrDefault(concept + "|" + m.unit(), List.of());
                if (list.isEmpty()) {
                    continue;
                }
                if (m.kind() == Metric.Kind.STOCK) {
                    Map<LocalDate, Picked> target = stocks.computeIfAbsent(m, k -> new TreeMap<>());
                    PeriodNormalizer.stocks(list).forEach(target::putIfAbsent);
                } else {
                    Map<RowKey, PeriodValue> target = flows.computeIfAbsent(m, k -> new LinkedHashMap<>());
                    for (PeriodValue v : PeriodNormalizer.flows(list, m.kind() == Metric.Kind.FLOW)) {
                        target.putIfAbsent(new RowKey(v.type(), v.end()), v);
                    }
                }
            }
        }

        // 기간 뼈대: 기간 값 항목에 한 번이라도 나온 기간. 라벨은 Metric 순서상 먼저 나온 항목(매출) 기준
        Map<RowKey, PeriodValue> skeleton = new LinkedHashMap<>();
        for (Metric m : Metric.values()) {
            flows.getOrDefault(m, Map.of()).forEach(skeleton::putIfAbsent);
        }

        List<FinancialRow> rows = new ArrayList<>();
        skeleton.forEach((key, label) -> {
            List<LocalDate> filed = new ArrayList<>();
            Long revenue = flowUsd(flows, Metric.REVENUE, key, filed);
            Long gross = flowUsd(flows, Metric.GROSS_PROFIT, key, filed);
            Long operating = flowUsd(flows, Metric.OPERATING_INCOME, key, filed);
            Long net = flowUsd(flows, Metric.NET_INCOME, key, filed);
            PeriodValue eps = flows.getOrDefault(Metric.EPS_DILUTED, Map.of()).get(key);
            if (eps != null) {
                filed.add(eps.filed());
            }
            Long assets = stockUsd(stocks, Metric.TOTAL_ASSETS, key.end(), filed);
            Long liabilities = stockUsd(stocks, Metric.TOTAL_LIABILITIES, key.end(), filed);
            Long equity = stockUsd(stocks, Metric.TOTAL_EQUITY, key.end(), filed);
            if (liabilities == null && assets != null) {
                // 부채 합계를 공시하지 않는 기업: 총자산 − 자본(비지배지분 포함, 없으면 지배지분 자본)
                Long equityAll = stockUsd(stocks, Metric.EQUITY_WITH_NONCONTROLLING, key.end(), filed);
                Long base = equityAll != null ? equityAll : equity;
                liabilities = base == null ? null : assets - base;
            }
            Long ocf = flowUsd(flows, Metric.OPERATING_CASH_FLOW, key, filed);
            Long capex = flowUsd(flows, Metric.CAPITAL_EXPENDITURE, key, filed);
            Long fcf = ocf != null && capex != null ? ocf - capex : null;
            LocalDate filedAt = filed.stream().max(Comparator.naturalOrder()).orElse(null);
            rows.add(new FinancialRow(key.type(), label.fiscalYear(), label.fiscalPeriod(), label.start(), key.end(),
                    filedAt, revenue, gross, operating, net, eps == null ? null : eps.value(),
                    assets, liabilities, equity, ocf, capex, fcf));
        });
        rows.sort(Comparator.comparing(FinancialRow::end).reversed().thenComparing(FinancialRow::type));
        return rows;
    }

    /** 분기만, 기간 끝 최신순 */
    public static List<FinancialRow> quarters(List<FinancialRow> rows) {
        return rows.stream().filter(r -> r.type() == PeriodType.Q).toList();
    }

    private static Long flowUsd(Map<Metric, Map<RowKey, PeriodValue>> flows, Metric m, RowKey key,
                                List<LocalDate> filed) {
        PeriodValue v = flows.getOrDefault(m, Map.of()).get(key);
        if (v == null) {
            return null;
        }
        filed.add(v.filed());
        return toUsd(v.value());
    }

    private static Long stockUsd(Map<Metric, Map<LocalDate, Picked>> stocks, Metric m, LocalDate end,
                                 List<LocalDate> filed) {
        Picked p = stocks.getOrDefault(m, Map.of()).get(end);
        if (p == null) {
            return null;
        }
        filed.add(p.filed());
        return toUsd(p.value());
    }

    static Long toUsd(BigDecimal v) {
        return v.setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
