package com.usstockmap.server.collector.sec;

import static org.assertj.core.api.Assertions.assertThat;

import com.usstockmap.server.common.config.AppProperties;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

/**
 * 실제 SEC 에 접속해 보는 확인용 테스트. 평소엔 건너뛴다.
 * 실행: SEC_CONTACT_EMAIL=내메일 ./gradlew test --tests '*SecLiveSmokeTest' -Dsec.live=true
 * (요청 6번, 초당 8회 제한 안)
 */
@EnabledIfSystemProperty(named = "sec.live", matches = "true")
class SecLiveSmokeTest {

    @Test
    @DisplayName("실제 SEC: 애플·JP모건을 받아 계산하면 지도 지표가 나온다")
    void realSec() {
        String email = System.getenv().getOrDefault("SEC_CONTACT_EMAIL", "change-me@example.com");
        AppProperties props = new AppProperties(new AppProperties.Cors(List.of()),
                new AppProperties.Sec("UsStockMap/0.1 (" + email + ")", 8, false, ""),
                new AppProperties.Admin(""), new AppProperties.Fred(""));
        HttpSecClient client = new HttpSecClient(props);

        String aaplCik = CompanyTickersParser.parse(client.companyTickers()).get("AAPL");
        assertThat(aaplCik).isEqualTo("0000320193");

        for (String[] t : new String[][]{{"AAPL", aaplCik}, {"JPM", "0000019617"}}) {
            SecCompanyUpdate u = SecCompanyUpdate.compute(t[0], client.submissions(t[1]), client.companyFacts(t[1]),
                    LocalDate.now());
            System.out.println("[live] " + t[0] + " " + u.metrics() + " filings30d=" + u.filingActivity()
                    + " next=" + u.nextEarningsEstimate().orElse(null) + " issues=" + u.issues());
            assertThat(u.metrics().revenueTtmUsd()).isPositive();
            assertThat(u.submission().filings()).isNotEmpty();
        }

        // 인구조사국 지오코더: 팔란티어 SEC 주소 → 아벤투라 (우편번호 33180 중심과 수 km 이내)
        var point = new com.usstockmap.server.common.geo.CensusGeocoder()
                .geocode("19505 Biscayne Blvd", "AVENTURA", "FL", "33180").orElseThrow();
        System.out.println("[live] census PLTR " + point);
        assertThat(point.distanceKm(25.962149, -80.140904)).isLessThan(10);
    }
}
