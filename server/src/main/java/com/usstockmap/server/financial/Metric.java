package com.usstockmap.server.financial;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 재무 항목과 SEC 개념 후보 목록. 기간마다 후보를 순서대로 보고 값이 있는 첫 개념을 쓴다
 * (기업마다, 또 같은 기업도 해마다 개념 이름이 다르다 — 예: NVDA 2022년에 매출 개념 변경).
 * 후보를 바꾸면 결과 숫자가 바뀌므로 {@link FinancialCalc#VERSION} 을 올린다.
 */
public enum Metric {

    /** 매출. "Revenues"가 있으면 그게 총매출 줄이라 먼저 본다 (TSLA 는 둘 다 공시) */
    REVENUE(Kind.FLOW, "USD",
            List.of("Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet",
                    "RevenueFromContractWithCustomerIncludingAssessedTax"),
            List.of("RevenuesNetOfInterestExpense", "Revenues")),
    GROSS_PROFIT(Kind.FLOW, "USD", List.of("GrossProfit"), List.of()),
    OPERATING_INCOME(Kind.FLOW, "USD", List.of("OperatingIncomeLoss"), List.of()),
    /** ProfitLoss 는 비지배지분까지 포함이라 마지막 후보 */
    NET_INCOME(Kind.FLOW, "USD", List.of("NetIncomeLoss", "ProfitLoss"), List.of("NetIncomeLoss", "ProfitLoss")),
    /** 주당순이익은 더하고 뺄 수 없어서(주식 수가 기간마다 다름) 직접 공시된 기간만 쓴다 */
    EPS_DILUTED(Kind.PER_SHARE, "USD/shares", List.of("EarningsPerShareDiluted"), List.of("EarningsPerShareDiluted")),
    TOTAL_ASSETS(Kind.STOCK, "USD", List.of("Assets"), List.of("Assets")),
    TOTAL_LIABILITIES(Kind.STOCK, "USD", List.of("Liabilities"), List.of("Liabilities")),
    TOTAL_EQUITY(Kind.STOCK, "USD",
            List.of("StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"),
            List.of("StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest")),
    /** 비지배지분 포함 자본. 화면 항목은 아니고, 부채를 공시하지 않는 기업(AMZN·KO)의 부채 = 총자산 − 이 값 */
    EQUITY_WITH_NONCONTROLLING(Kind.STOCK, "USD",
            List.of("StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"),
            List.of("StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest")),
    /** 현금흐름표는 10-Q 에 연초부터 누적 값만 있다 → 분기 값은 누적끼리 뺀다 */
    OPERATING_CASH_FLOW(Kind.FLOW, "USD",
            List.of("NetCashProvidedByUsedInOperatingActivities"),
            List.of("NetCashProvidedByUsedInOperatingActivities")),
    CAPITAL_EXPENDITURE(Kind.FLOW, "USD",
            List.of("PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"), List.of());

    /** FLOW = 기간 합계(더하고 뺄 수 있음), PER_SHARE = 기간 값이지만 못 뺌, STOCK = 기간 말 시점 값 */
    public enum Kind { FLOW, PER_SHARE, STOCK }

    public static final String TAXONOMY = "us-gaap";

    private final Kind kind;
    private final String unit;
    private final List<String> standard;
    private final List<String> bank;

    Metric(Kind kind, String unit, List<String> standard, List<String> bank) {
        this.kind = kind;
        this.unit = unit;
        this.standard = standard;
        this.bank = bank;
    }

    public Kind kind() {
        return kind;
    }

    public String unit() {
        return unit;
    }

    public List<String> candidates(IndustryProfile profile) {
        return profile == IndustryProfile.BANK ? bank : standard;
    }

    /** 수집할 us-gaap 개념 전체 (financial_fact 에 저장할 것) */
    public static Set<String> allConcepts() {
        return Stream.of(values())
                .flatMap(m -> Stream.concat(m.standard.stream(), m.bank.stream()))
                .collect(Collectors.toUnmodifiableSet());
    }
}
