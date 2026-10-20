package com.usstockmap.server.common.geo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.zip.GZIPInputStream;
import org.springframework.stereotype.Component;

/**
 * 미국 우편번호(ZCTA) 중심점. 출처: US Census 2024 Gazetteer (공공 저작물).
 * classpath data/zcta-centroids.csv.gz (약 3.4만 개, 340KB). 네트워크 없이 본사 위치를 대략(수 km 이내) 잡는다.
 */
@Component
public class ZipCentroids {

    static final String RESOURCE = "/data/zcta-centroids.csv.gz";

    private final Map<String, double[]> byZip;

    public ZipCentroids() {
        this.byZip = load();
    }

    /** "95014" 또는 "95014-2083" */
    public Optional<GeoPoint> find(String zip) {
        if (zip == null || zip.length() < 5) {
            return Optional.empty();
        }
        double[] p = byZip.get(zip.substring(0, 5));
        return p == null ? Optional.empty() : Optional.of(new GeoPoint(p[0], p[1], GeoPoint.Precision.ZIP));
    }

    /**
     * 회사 전용 우편번호(월마트 72716, 일라이 릴리 46285 등)·사서함 번호는 ZCTA 에 없다.
     * 앞 3자리(같은 우편 지역)가 같은 번호 중 숫자로 가장 가까운 것 (같으면 작은 번호). 같은 도시 안에 들어온다.
     */
    public Optional<GeoPoint> findNearby(String zip) {
        if (zip == null || zip.length() < 5 || !zip.substring(0, 5).chars().allMatch(Character::isDigit)) {
            return Optional.empty();
        }
        String zip5 = zip.substring(0, 5);
        int target = Integer.parseInt(zip5);
        String prefix = zip5.substring(0, 3);
        String best = null;
        int bestGap = Integer.MAX_VALUE;
        for (String candidate : byZip.keySet()) {
            if (!candidate.startsWith(prefix)) {
                continue;
            }
            int value = Integer.parseInt(candidate);
            int gap = Math.abs(value - target);
            if (gap < bestGap || (gap == bestGap && value < Integer.parseInt(best))) {
                best = candidate;
                bestGap = gap;
            }
        }
        if (best == null) {
            return Optional.empty();
        }
        double[] p = byZip.get(best);
        return Optional.of(new GeoPoint(p[0], p[1], GeoPoint.Precision.NEARBY_ZIP));
    }

    public int size() {
        return byZip.size();
    }

    private static Map<String, double[]> load() {
        try (InputStream in = ZipCentroids.class.getResourceAsStream(RESOURCE)) {
            if (in == null) {
                throw new IllegalStateException("missing " + RESOURCE);
            }
            Map<String, double[]> out = new HashMap<>(40_000);
            BufferedReader r = new BufferedReader(new InputStreamReader(new GZIPInputStream(in), StandardCharsets.UTF_8));
            String line;
            while ((line = r.readLine()) != null) {
                if (line.startsWith("#") || line.isBlank()) {
                    continue;
                }
                String[] p = line.split(",");
                out.put(p[0], new double[]{Double.parseDouble(p[1]), Double.parseDouble(p[2])});
            }
            return out;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
