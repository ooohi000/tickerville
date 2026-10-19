package com.usstockmap.server.company;

/**
 * SEC 업종 코드(SIC) → 우리 섹터 추정. 등록할 때 섹터를 안 주면 쓰는 기본값 (관리자가 고칠 수 있음).
 * SIC 는 오래된 분류라 대략적이다 (예: 아마존 5961 = 통신판매 → consumer).
 */
public final class SectorGuess {

    private SectorGuess() {
    }

    public static Sector fromSic(String sic) {
        int c;
        try {
            c = Integer.parseInt(sic == null ? "" : sic.trim());
        } catch (NumberFormatException e) {
            return Sector.OTHER;
        }
        if (in(c, 3570, 3579) || in(c, 3670, 3679) || in(c, 7370, 7379) || c == 3661 || c == 3663) {
            return Sector.TECH;
        }
        if (in(c, 4800, 4899) || in(c, 2710, 2799) || in(c, 7810, 7819)) {
            return Sector.COMMUNICATION;
        }
        if (in(c, 6000, 6799)) {
            return Sector.FINANCE;
        }
        if (in(c, 2830, 2836) || in(c, 3840, 3851) || in(c, 8000, 8099) || c == 8731) {
            return Sector.HEALTHCARE;
        }
        if (in(c, 1300, 1399) || in(c, 2900, 2999) || in(c, 4900, 4949)) {
            return Sector.ENERGY;
        }
        if (in(c, 2000, 2399) || in(c, 3710, 3711) || in(c, 5200, 5999) || in(c, 7000, 7099) || in(c, 5800, 5899)) {
            return Sector.CONSUMER;
        }
        if (in(c, 1500, 1799) || in(c, 3400, 3569) || in(c, 3580, 3669) || in(c, 3700, 3799) || in(c, 4000, 4799)) {
            return Sector.INDUSTRIAL;
        }
        return Sector.OTHER;
    }

    private static boolean in(int c, int from, int to) {
        return c >= from && c <= to;
    }
}
