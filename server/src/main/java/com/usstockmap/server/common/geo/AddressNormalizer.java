package com.usstockmap.server.common.geo;

import java.util.Locale;
import java.util.Map;

/** 지오코더가 못 알아듣는 표기 정리 ("ONE APPLE PARK WAY" → "1 APPLE PARK WAY") + 화면용 도시 이름 */
public final class AddressNormalizer {

    private static final Map<String, String> NUMBERS = Map.ofEntries(
            Map.entry("ONE", "1"), Map.entry("TWO", "2"), Map.entry("THREE", "3"), Map.entry("FOUR", "4"),
            Map.entry("FIVE", "5"), Map.entry("SIX", "6"), Map.entry("SEVEN", "7"), Map.entry("EIGHT", "8"),
            Map.entry("NINE", "9"), Map.entry("TEN", "10"));

    private AddressNormalizer() {
    }

    /** 맨 앞 숫자 단어만 숫자로 */
    public static String street(String street) {
        String s = street.trim().replaceAll("\\s+", " ");
        int sp = s.indexOf(' ');
        if (sp > 0) {
            String first = s.substring(0, sp).toUpperCase(Locale.ROOT);
            String num = NUMBERS.get(first);
            if (num != null) {
                return num + s.substring(sp);
            }
        }
        return s;
    }

    /** "SANTA CLARA" → "Santa Clara" (SEC 는 대문자로 준다) */
    public static String titleCase(String s) {
        if (s == null || s.isBlank()) {
            return s;
        }
        StringBuilder out = new StringBuilder();
        for (String w : s.trim().toLowerCase(Locale.ROOT).split("\\s+")) {
            if (!out.isEmpty()) {
                out.append(' ');
            }
            out.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
        }
        return out.toString();
    }
}
