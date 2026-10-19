package com.usstockmap.server.common.geo;

/** 위경도 + 얼마나 정확한지 (주소 지점 / 우편번호 중심) */
public record GeoPoint(double lat, double lng, Precision precision) {

    public enum Precision { ADDRESS, ZIP }

    /** 두 지점 거리(km), 하버사인 */
    public double distanceKm(double otherLat, double otherLng) {
        double r = 6371.0088;
        double dLat = Math.toRadians(otherLat - lat);
        double dLng = Math.toRadians(otherLng - lng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat)) * Math.cos(Math.toRadians(otherLat))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }
}
