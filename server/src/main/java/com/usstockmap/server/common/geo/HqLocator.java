package com.usstockmap.server.common.geo;

import java.util.Optional;
import org.springframework.stereotype.Component;

/** 본사 주소 → 지도 좌표. 정확한 주소 지점(인구조사국) → 안 되면 우편번호 중심 → 그래도 없으면 empty */
@Component
public class HqLocator {

    private final AddressGeocoder geocoder;
    private final ZipCentroids zips;

    public HqLocator(AddressGeocoder geocoder, ZipCentroids zips) {
        this.geocoder = geocoder;
        this.zips = zips;
    }

    public Optional<GeoPoint> locate(String street, String city, String state, String zip) {
        return geocoder.geocode(street, city, state, zip).or(() -> zips.find(zip));
    }
}
