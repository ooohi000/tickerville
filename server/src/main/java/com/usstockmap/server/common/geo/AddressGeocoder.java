package com.usstockmap.server.common.geo;

import java.util.Optional;

/** 주소 → 지점. 실제 구현은 CensusGeocoder (테스트는 가짜) */
public interface AddressGeocoder {

    Optional<GeoPoint> geocode(String street, String city, String state, String zip);
}
