package com.usstockmap.server.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * 한 개념(같은 단위)의 SEC 원본 값들 → 분기·연간 값. 순수 계산, 스프링 없음.
 *
 * <p>규칙 (docs/data-sources.md "SEC 실제 데이터 확인"):
 * <ul>
 *   <li>기간은 fy·fp 가 아니라 start·end 날짜로 판정한다</li>
 *   <li>같은 기간이 여러 공시에 나오면 filed 가 가장 늦은 값(정정 반영)</li>
 *   <li>회계연도 틀 = 10-K 의 연간 기간(350~380일). 마지막 연간 다음 날부터는 "진행 중인 해"</li>
 *   <li>분기 값 = 3개월(80~100일) 값이 있으면 그대로, 없으면 연초부터 누적끼리 뺀다
 *       (현금흐름표 2·3분기 = 누적 − 직전 누적)</li>
 *   <li>4분기 = 연간 − (1~3분기 합). 10-K 에 4분기 단독 값이 있어도 이걸로 (반올림 차이 제거). 1~3분기 중 빈 게 있으면 연간 − 9개월 누적.
 *       정정·반올림이 공시마다 달라도 네 분기 합이 항상 연간과 같게 (JPM 2019 매출, AMZN·NVDA 백만 달러 반올림)</li>
 *   <li>52·53주 회계연도(애플·엔비디아)는 날짜가 하루 이틀 어긋날 수 있어 시작일을 ±3일로 맞춘다</li>
 *   <li>정기 보고서(10-K·10-Q, 정정본 포함) 값만 쓴다. 위임장(DEF 14A) 등은 반올림한 숫자를 다시 태그한다
 *       (JPM 2024 순이익: 10-K 58,471백만 vs 위임장 58,500백만)</li>
 * </ul>
 */
public final class PeriodNormalizer {

    /** 값을 믿는 공시 종류 */
    public static final Set<String> REPORT_FORMS = Set.of("10-K", "10-K/A", "10-Q", "10-Q/A", "10-KT", "10-QT");

    static final int TOLERANCE_DAYS = 3;
    static final double DAYS_PER_QUARTER = 91.3;

    private PeriodNormalizer() {
    }

    /** 공시 여러 건 중 고른 값 하나. originFy·originForm = 그 기간이 처음 실린 공시의 것 */
    record Picked(BigDecimal value, LocalDate filed, Integer originFy, String originForm) {
    }

    private record Key(LocalDate start, LocalDate end) {
    }

    private record Frame(LocalDate start, LocalDate end, int fiscalYear, Picked annual) {
        boolean open() {
            return end == null;
        }
    }

    // ─── 기간 값 (매출·순이익·현금흐름·주당순이익) ─────────────────────────

    /**
     * @param subtractable 누적끼리 빼서 분기 값을 만들어도 되는가 (주당순이익은 false)
     * @return 분기(Q1~Q4)·연간(FY) 값, 기간 끝 오름차순
     */
    public static List<PeriodValue> flows(List<SecFact> facts, boolean subtractable) {
        return flows(facts, subtractable, FiscalYearLabels.from(facts));
    }

    /** @param labels 회계연도 이름표 (기업의 전체 원본 값으로 만든 것 — 개념마다 다르면 안 된다) */
    public static List<PeriodValue> flows(List<SecFact> facts, boolean subtractable, FiscalYearLabels labels) {
        Map<Key, Picked> periods = dedupe(facts.stream().filter(SecFact::isDuration).toList(),
                f -> new Key(f.start(), f.end()));
        List<PeriodValue> out = new ArrayList<>();
        for (Frame frame : frames(periods, labels)) {
            out.addAll(quartersOf(frame, periods, subtractable));
            if (!frame.open()) {
                out.add(new PeriodValue(PeriodType.FY, frame.fiscalYear(), "FY", frame.start(), frame.end(),
                        frame.annual().value(), frame.annual().filed()));
            }
        }
        out.sort(Comparator.comparing(PeriodValue::end).thenComparing(PeriodValue::type));
        return out;
    }

    /** 10-K 연간 기간마다 틀 하나 + 마지막 연간 다음 날부터 진행 중인 틀 하나 */
    private static List<Frame> frames(Map<Key, Picked> periods, FiscalYearLabels labels) {
        List<Map.Entry<Key, Picked>> annuals = periods.entrySet().stream()
                .filter(e -> isAnnual(days(e.getKey())))
                .filter(e -> e.getValue().originForm() != null && e.getValue().originForm().startsWith("10-K"))
                .sorted(Comparator.comparing(e -> e.getKey().end()))
                .toList();
        List<Map.Entry<Key, Picked>> kept = new ArrayList<>();
        LocalDate lastEnd = null;
        for (Map.Entry<Key, Picked> a : annuals) {
            if (lastEnd != null && !a.getKey().end().isAfter(lastEnd)) {
                continue; // 겹치는 연간 기간(이상치)은 건너뛴다
            }
            kept.add(a);
            lastEnd = a.getKey().end();
        }
        // 이름표: 그 해가 자기 10-K 를 가진 경우 그 이름. 없으면(상장 전 해 등) 이웃 해에서 ±1 씩
        Integer[] fy = new Integer[kept.size()];
        for (int i = 0; i < kept.size(); i++) {
            fy[i] = labels.forAnnualEnd(kept.get(i).getKey().end()).orElse(null);
        }
        for (int i = 0; i < fy.length; i++) {
            if (fy[i] != null) {
                continue;
            }
            Integer inferred = null;
            for (int j = i + 1; j < fy.length && inferred == null; j++) {
                if (fy[j] != null) {
                    inferred = fy[j] - (j - i);
                }
            }
            for (int j = i - 1; j >= 0 && inferred == null; j--) {
                if (fy[j] != null) {
                    inferred = fy[j] + (i - j);
                }
            }
            if (inferred == null) {
                Picked p = kept.get(i).getValue();
                inferred = p.originFy() != null ? p.originFy() : kept.get(i).getKey().end().getYear();
            }
            fy[i] = inferred;
        }
        List<Frame> frames = new ArrayList<>();
        for (int i = 0; i < kept.size(); i++) {
            Key k = kept.get(i).getKey();
            frames.add(new Frame(k.start(), k.end(), fy[i], kept.get(i).getValue()));
        }
        if (!frames.isEmpty()) {
            Frame last = frames.getLast();
            frames.add(new Frame(last.end().plusDays(1), null, last.fiscalYear() + 1, null));
        }
        return frames;
    }

    private static List<PeriodValue> quartersOf(Frame frame, Map<Key, Picked> periods, boolean subtractable) {
        LocalDate s = frame.start();
        // 연초부터 누적 (3·6·9·12개월)
        TreeMap<LocalDate, Picked> cumulative = new TreeMap<>();
        // 3개월 단독 값
        Map<LocalDate, Map.Entry<Key, Picked>> direct = new HashMap<>();
        for (Map.Entry<Key, Picked> e : periods.entrySet()) {
            Key k = e.getKey();
            if (!inside(frame, k.end())) {
                continue;
            }
            if (near(k.start(), s) && k.end().isAfter(s)) {
                cumulative.put(k.end(), e.getValue());
            }
            if (isQuarter(days(k)) && !k.start().isBefore(s.minusDays(TOLERANCE_DAYS))) {
                direct.put(k.end(), e);
            }
        }
        TreeSet<LocalDate> ends = new TreeSet<>(cumulative.keySet());
        ends.addAll(direct.keySet());

        List<PeriodValue> out = new ArrayList<>();
        LocalDate prevEnd = s.minusDays(1);
        BigDecimal prevCum = BigDecimal.ZERO; // null 이면 직전 누적을 모른다
        LocalDate prevCumFiled = null;
        int lastIndex = 0;
        BigDecimal emittedSum = BigDecimal.ZERO;
        int emittedCount = 0;
        for (LocalDate e : ends) {
            long gap = ChronoUnit.DAYS.between(prevEnd, e);
            Picked cum = cumulative.get(e);
            Map.Entry<Key, Picked> d = direct.get(e);
            boolean directFits = d != null && near(d.getKey().start(), prevEnd.plusDays(1));

            BigDecimal value = null;
            LocalDate filed = null;
            if (directFits) {
                value = d.getValue().value();
                filed = d.getValue().filed();
            } else if (subtractable && cum != null && prevCum != null) {
                value = cum.value().subtract(prevCum);
                filed = later(cum.filed(), prevCumFiled);
            }

            int index = (int) Math.max(1, Math.min(4, Math.round(ChronoUnit.DAYS.between(s, e) / DAYS_PER_QUARTER)));
            boolean closingQuarter = !frame.open() && index == 4 && e.equals(frame.end());
            if (closingQuarter && subtractable && emittedCount == 3) { // 직접 공시된 4분기가 있어도 합을 맞춘다
                value = frame.annual().value().subtract(emittedSum);
                filed = later(frame.annual().filed(), filed);
            }
            if (value != null && isQuarter(gap) && index > lastIndex) {
                out.add(new PeriodValue(PeriodType.Q, frame.fiscalYear(), "Q" + index,
                        prevEnd.plusDays(1), e, value, filed));
                lastIndex = index;
                emittedSum = emittedSum.add(value);
                emittedCount++;
            }

            // 다음 분기를 위한 직전 누적
            if (cum != null) {
                prevCum = cum.value();
                prevCumFiled = cum.filed();
            } else if (directFits && prevCum != null) {
                prevCum = prevCum.add(d.getValue().value());
                prevCumFiled = later(prevCumFiled, d.getValue().filed());
            } else {
                prevCum = null;
            }
            prevEnd = e;
        }
        return out;
    }

    // ─── 시점 값 (총자산·부채·자본) ─────────────────────────────────────

    /** 기간 말 날짜 → 값 (같은 날짜가 여러 공시에 나오면 가장 늦은 공시) */
    public static Map<LocalDate, Picked> stocks(List<SecFact> facts) {
        Map<Key, Picked> byEnd = dedupe(facts.stream().filter(f -> !f.isDuration()).toList(),
                f -> new Key(null, f.end()));
        Map<LocalDate, Picked> out = new TreeMap<>();
        byEnd.forEach((k, v) -> out.put(k.end(), v));
        return out;
    }

    // ─── 공통 ─────────────────────────────────────────────────────────

    private static Map<Key, Picked> dedupe(List<SecFact> facts, java.util.function.Function<SecFact, Key> keyOf) {
        Map<Key, List<SecFact>> groups = new HashMap<>();
        for (SecFact f : facts) {
            if (!REPORT_FORMS.contains(f.form())) {
                continue;
            }
            groups.computeIfAbsent(keyOf.apply(f), k -> new ArrayList<>()).add(f);
        }
        Map<Key, Picked> out = new HashMap<>();
        groups.forEach((k, list) -> {
            SecFact latest = list.stream()
                    .max(Comparator.comparing(SecFact::filed).thenComparing(SecFact::accession))
                    .orElseThrow();
            SecFact origin = list.stream()
                    .min(Comparator.comparing(SecFact::filed).thenComparing(SecFact::accession))
                    .orElseThrow();
            out.put(k, new Picked(latest.value(), latest.filed(), origin.fy(), origin.form()));
        });
        return out;
    }

    private static boolean inside(Frame frame, LocalDate end) {
        return end.isAfter(frame.start())
                && (frame.open() || !end.isAfter(frame.end().plusDays(TOLERANCE_DAYS)));
    }

    static boolean isQuarter(long days) {
        return days >= 80 && days <= 100;
    }

    static boolean isAnnual(long days) {
        return days >= 350 && days <= 380;
    }

    private static long days(Key k) {
        return ChronoUnit.DAYS.between(k.start(), k.end()) + 1;
    }

    private static boolean near(LocalDate a, LocalDate b) {
        return Math.abs(ChronoUnit.DAYS.between(a, b)) <= TOLERANCE_DAYS;
    }

    private static LocalDate later(LocalDate a, LocalDate b) {
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        return a.isAfter(b) ? a : b;
    }
}
