package com.usstockmap.server.collector.sec;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import tools.jackson.databind.JsonNode;

/**
 * submissions JSON → SecSubmission. 순수 변환.
 * 공시 목록은 열 단위 배열(filings.recent.form[], filingDate[] ...)이라 같은 인덱스끼리 묶는다.
 */
public final class SubmissionsParser {

    /** 저장할 공시 종류 (구조화 채권 424B2 같은 대량 공시는 뺀다) */
    public static final Set<String> KEPT_FORMS = Set.of(
            "10-K", "10-K/A", "10-Q", "10-Q/A", "8-K", "8-K/A", "4", "4/A", "DEF 14A", "S-1", "20-F", "6-K");

    private SubmissionsParser() {
    }

    public static SecSubmission parse(JsonNode root, String ticker) {
        String cik = CompanyTickersParser.toCik(Long.parseLong(root.path("cik").asString("0")));
        JsonNode business = root.path("addresses").path("business");
        SecSubmission.Address address = new SecSubmission.Address(
                text(business, "street1"), text(business, "city"),
                text(business, "stateOrCountry"), text(business, "zipCode"), text(business, "street2"));
        return new SecSubmission(
                cik,
                text(root, "name"),
                exchangeOf(root, ticker),
                text(root, "sic"),
                text(root, "sicDescription"),
                text(root, "fiscalYearEnd"),
                address,
                filings(root.path("filings").path("recent"), cik));
    }

    /** tickers[] 와 exchanges[] 는 같은 순서. 우리 티커의 거래소, 없으면 첫 번째 */
    private static String exchangeOf(JsonNode root, String ticker) {
        JsonNode tickers = root.path("tickers");
        JsonNode exchanges = root.path("exchanges");
        for (int i = 0; i < tickers.size() && i < exchanges.size(); i++) {
            if (tickers.get(i).asString().equalsIgnoreCase(ticker)) {
                return blankToNull(exchanges.get(i).asString());
            }
        }
        return exchanges.isEmpty() ? null : blankToNull(exchanges.get(0).asString());
    }

    private static List<SecFiling> filings(JsonNode recent, String cik) {
        JsonNode forms = recent.path("form");
        List<SecFiling> out = new ArrayList<>();
        for (int i = 0; i < forms.size(); i++) {
            String form = forms.get(i).asString();
            if (!KEPT_FORMS.contains(form)) {
                continue;
            }
            String accession = at(recent, "accessionNumber", i);
            String filingDate = at(recent, "filingDate", i);
            if (accession == null || filingDate == null) {
                continue;
            }
            String report = at(recent, "reportDate", i);
            String accepted = at(recent, "acceptanceDateTime", i);
            out.add(new SecFiling(
                    accession,
                    form,
                    LocalDate.parse(filingDate),
                    report == null ? null : LocalDate.parse(report),
                    accepted == null ? null : Instant.parse(accepted),
                    at(recent, "items", i),
                    documentUrl(cik, accession, at(recent, "primaryDocument", i))));
        }
        return out;
    }

    /** 공시 원문 주소. 대표 문서가 없으면 공시 색인 페이지 */
    static String documentUrl(String cik, String accession, String primaryDocument) {
        String base = "https://www.sec.gov/Archives/edgar/data/" + Long.parseLong(cik) + "/" + accession.replace("-", "");
        return primaryDocument == null ? base + "/" + accession + "-index.htm" : base + "/" + primaryDocument;
    }

    private static String at(JsonNode recent, String field, int i) {
        JsonNode arr = recent.path(field);
        return i < arr.size() ? blankToNull(arr.get(i).asString(null)) : null;
    }

    private static String text(JsonNode node, String field) {
        return node.hasNonNull(field) ? blankToNull(node.get(field).asString()) : null;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
