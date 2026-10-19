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
