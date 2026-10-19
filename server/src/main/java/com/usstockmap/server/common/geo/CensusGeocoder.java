package com.usstockmap.server.common.geo;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * 미국 인구조사국 지오코더 (무료·키 없음·공공 저작물). https://geocoding.geo.census.gov
 * 주소 한 건씩. 실패·못 찾음은 empty (HqLocator 가 우편번호 중심으로 대체).
 */
@Component
public class CensusGeocoder implements AddressGeocoder {

    private static final Logger log = LoggerFactory.getLogger(CensusGeocoder.class);
    static final String ENDPOINT = "https://geocoding.geo.census.gov/geocoder/locations/address";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final JsonMapper json = JsonMapper.builder().build();

    @Override
    public Optional<GeoPoint> geocode(String street, String city, String state, String zip) {
        if (street == null || state == null) {
            return Optional.empty();
        }
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url(street, city, state, zip)))
                    .timeout(Duration.ofSeconds(20)).GET().build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                return Optional.empty();
            }
            return parse(json.readTree(res.body()));
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("census geocode failed: {}", e.toString());
            return Optional.empty();
        }
    }

    static String url(String street, String city, String state, String zip) {
        Map<String, String> q = new java.util.LinkedHashMap<>();
        q.put("street", AddressNormalizer.street(street));
        if (city != null) {
            q.put("city", city);
        }
        q.put("state", state);
        if (zip != null) {
            q.put("zip", zip.length() >= 5 ? zip.substring(0, 5) : zip);
        }
        q.put("benchmark", "Public_AR_Current");
        q.put("format", "json");
        return ENDPOINT + "?" + q.entrySet().stream()
                .map(e -> e.getKey() + "=" + java.net.URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    /** result.addressMatches[0].coordinates {x: 경도, y: 위도} */
    static Optional<GeoPoint> parse(JsonNode root) {
        JsonNode matches = root.path("result").path("addressMatches");
        if (!matches.isArray() || matches.isEmpty()) {
            return Optional.empty();
        }
        JsonNode c = matches.get(0).path("coordinates");
        if (!c.hasNonNull("x") || !c.hasNonNull("y")) {
            return Optional.empty();
        }
        return Optional.of(new GeoPoint(c.get("y").asDouble(), c.get("x").asDouble(), GeoPoint.Precision.ADDRESS));
    }
}
