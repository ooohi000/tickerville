package com.usstockmap.server.common.geo;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * 본사 주소 → 지도 좌표. 순서대로:
 * 정확한 주소 지점(인구조사국, 주소 줄마다 — 사서함 줄은 건너뜀) → 우편번호 중심 → 같은 지역 가장 가까운 우편번호 중심 → empty
 */
@Component
public class HqLocator {

    private final AddressGeocoder geocoder;
    private final ZipCentroids zips;

    public HqLocator(AddressGeocoder geocoder, ZipCentroids zips) {
        this.geocoder = geocoder;
        this.zips = zips;
    }

    public Optional<GeoPoint> locate(String street, String city, String state, String zip) {
        return locate(java.util.Collections.singletonList(street), city, state, zip);
    }

    /** SEC 주소는 줄이 두 개 (street1, street2). 번지가 둘째 줄에 있는 회사가 있다 */
    public Optional<GeoPoint> locate(List<String> streets, String city, String state, String zip) {
        for (String street : streets) {
            if (street == null || street.isBlank() || isPoBox(street)) {
                continue;
            }
            Optional<GeoPoint> exact = geocoder.geocode(street, city, state, zip);
            if (exact.isPresent()) {
                return exact;
            }
        }
        return zips.find(zip).or(() -> zips.findNearby(zip));
    }

    /** "P.O. BOX 660199", "P O BOX 34067", "PO BOX 1" — 지점 주소가 아니라 인구조사국이 못 찾는다 */
    static boolean isPoBox(String street) {
        return street.toUpperCase().replaceAll("[^A-Z0-9 ]", "").replaceAll("\\s+", " ").trim()
                .matches("(P ?O|POST OFFICE) BOX.*");
    }
}
