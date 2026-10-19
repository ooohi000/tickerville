package com.usstockmap.server.earnings;

import com.usstockmap.server.collector.sec.SecFiling;
import com.usstockmap.server.common.time.MarketDates;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * 실적 발표일. SEC 에는 미래 일정이 없어서 (docs/data-sources.md)
 * <ul>
 *   <li>지난 발표 = 8-K 항목 2.02 (실적 공개). 날짜·장전/장후는 SEC 접수 시각(미국 동부) 기준</li>
 *   <li>다음 발표 예상 = "작년 같은 분기" 발표일 + 52주 (같은 요일). 화면에는 반드시 "예상"으로 표시</li>
 * </ul>
 */
public final class EarningsCalendar {

    static final String EARNINGS_ITEM = "2.02";
    private static final int REGULAR_OPEN = 9 * 60 + 30;
    private static final int REGULAR_CLOSE = 16 * 60;

    private EarningsCalendar() {
    }

    /** 공시 목록 → 실적 발표 (오래된 순) */
    public static List<ReportedEarnings> reported(List<SecFiling> filings) {
        return filings.stream()
                .filter(f -> f.form().startsWith("8-K") && f.hasItem(EARNINGS_ITEM))
                .filter(f -> !f.form().endsWith("/A")) // 정정 공시는 발표일이 아니다
                .map(EarningsCalendar::toReported)
                .sorted(Comparator.comparing(ReportedEarnings::eventDate))
                .toList();
    }

    private static ReportedEarnings toReported(SecFiling f) {
        if (f.acceptedAt() == null) {
            return new ReportedEarnings(f.accession(), f.filedAt(), null);
        }
        ZonedDateTime et = f.acceptedAt().atZone(MarketDates.MARKET_ZONE);
        int minute = et.getHour() * 60 + et.getMinute();
        EarningsTiming timing = minute < REGULAR_OPEN ? EarningsTiming.BMO
                : minute >= REGULAR_CLOSE ? EarningsTiming.AMC : EarningsTiming.DURING;
        return new ReportedEarnings(f.accession(), et.toLocalDate(), timing);
    }

    /**
     * 다음 발표 예상일. 마지막 발표를 L 이라 하면, 다음 발표의 작년 짝은 "L 로부터 약 1년 전 이후 첫 발표"다.
     * 그 날짜 + 52주. 1년치 기록이 없으면 empty.
     */
    public static Optional<LocalDate> estimateNext(List<ReportedEarnings> reported) {
        if (reported.isEmpty()) {
            return Optional.empty();
        }
        List<LocalDate> dates = reported.stream().map(ReportedEarnings::eventDate).sorted().toList();
        LocalDate last = dates.getLast();
        LocalDate yearAgoWindowStart = last.minusDays(365 - 30);
        return dates.stream()
                .filter(d -> d.isAfter(yearAgoWindowStart) && d.isBefore(last))
                .findFirst()
                .map(d -> d.plusWeeks(52));
    }
}
