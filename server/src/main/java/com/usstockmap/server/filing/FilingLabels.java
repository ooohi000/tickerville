package com.usstockmap.server.filing;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** 공시 종류 → 한글 이름 (docs/api.md recentFilings.labelKo). 화면·API 모두 이 한 곳 */
public final class FilingLabels {

    private static final Map<String, String> FORMS = Map.of(
            "10-K", "연간 보고서",
            "10-Q", "분기 보고서",
            "4", "내부자 거래",
            "DEF 14A", "주주총회 안내",
            "S-1", "증권 신고",
            "20-F", "연간 보고서(외국 기업)",
            "6-K", "수시 보고(외국 기업)");

    /** 8-K 는 항목 번호로. 여러 개면 위에 있는 것 우선 (9.01 첨부 서류 등은 무시) */
    private static final Map<String, String> EIGHT_K_ITEMS = new LinkedHashMap<>();

    static {
        EIGHT_K_ITEMS.put("2.02", "실적 발표");
        EIGHT_K_ITEMS.put("1.01", "주요 계약");
        EIGHT_K_ITEMS.put("2.01", "인수·매각 완료");
        EIGHT_K_ITEMS.put("5.02", "경영진 변동");
        EIGHT_K_ITEMS.put("5.07", "주주총회 결과");
        EIGHT_K_ITEMS.put("8.01", "기타 중요 사항");
        EIGHT_K_ITEMS.put("7.01", "공정 공시");
    }

    private FilingLabels() {
    }

    public static String labelKo(String form, String items) {
        boolean amended = form.endsWith("/A");
        String base = amended ? form.substring(0, form.length() - 2) : form;
        String label = base.equals("8-K") ? eightK(items) : FORMS.getOrDefault(base, base);
        return amended ? label + " (정정)" : label;
    }

    private static String eightK(String items) {
        if (items == null || items.isBlank()) {
            return "중요 사건";
        }
        Set<String> given = Arrays.stream(items.split(",")).map(String::trim).collect(Collectors.toSet());
        return EIGHT_K_ITEMS.entrySet().stream()
                .filter(e -> given.contains(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse("중요 사건");
    }
}
