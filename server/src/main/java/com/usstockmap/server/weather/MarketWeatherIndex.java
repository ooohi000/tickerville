package com.usstockmap.server.weather;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 시장 날씨 지수 (0~100, 높을수록 안정 = 맑음). 순수 계산.
 *
 * <p>값 = 100 × (1 − 이번 주 금융스트레스(STLFSI4)가 최근 10년(520주) 중 몇 번째로 높은지의 백분위).
 * 즉 "지난 10년 중 이번 주보다 불안했던 주의 비율".
 *
 * <p>왜 백분위인가 (1993~2026 실제 데이터로 비교, docs/data-sources.md): 처음 초안 50 − 20 × STLFSI 는
 * 평소에 지수가 좁은 범위에 머물러 최근 1년 94% 가 "구름 조금", 33년 동안 "맑음"이 한 번도 없었다.
 * 10년 백분위는 최근 1년 맑음 48%·구름 조금 25%·흐림 12%·비 12% 로 하늘이 움직이고,
 * 2008·2020·2023 SVB·2025-04 관세 충격은 모두 폭풍(< 25)으로 나온다.
 */
public final class MarketWeatherIndex {

    public static final String SERIES = "STLFSI4";
    public static final int VERSION = 1;
    /** 비교 기간 (주) */
    public static final int WINDOW_WEEKS = 520;
    /** 이만큼 이력이 없으면 계산하지 않는다 (5년) */
    public static final int MIN_WEEKS = 260;

    private MarketWeatherIndex() {
    }

    public record Weekly(LocalDate asOf, double stressIndex, double value) {
    }

    /**
     * @param series 날짜 오름차순 주간 STLFSI4
     * @param since  이 날짜 이후 주만 계산 (이전 주는 비교 재료로만)
     */
    public static List<Weekly> compute(List<Point> series, LocalDate since) {
        List<Weekly> out = new ArrayList<>();
        for (int i = 0; i < series.size(); i++) {
            Point p = series.get(i);
            if (p.date().isBefore(since) || i + 1 < MIN_WEEKS) {
                continue;
            }
            int from = Math.max(0, i + 1 - WINDOW_WEEKS);
            double[] window = series.subList(from, i + 1).stream().mapToDouble(Point::value).toArray();
            out.add(new Weekly(p.date(), p.value(), value(window, p.value())));
        }
        return out;
    }

    /** 창 안에서의 위치. 같은 값은 절반씩 (중간 순위) */
    static double value(double[] window, double current) {
        double[] sorted = window.clone();
        Arrays.sort(sorted);
        int below = lowerBound(sorted, current);
        int belowOrEqual = upperBound(sorted, current);
        double rank = (below + belowOrEqual) / 2.0 / sorted.length; // 0 = 가장 안정, 1 = 가장 불안
        return BigDecimal.valueOf(100 * (1 - rank)).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private static int lowerBound(double[] a, double x) {
        int lo = 0;
        int hi = a.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (a[mid] < x) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    private static int upperBound(double[] a, double x) {
        int lo = 0;
        int hi = a.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (a[mid] <= x) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    public record Point(LocalDate date, double value) {
    }
}
