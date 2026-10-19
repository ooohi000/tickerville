package com.usstockmap.server.admin;

import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 관리자: 데이터 품질 이상 목록 (확인이 필요한 기업만) */
@RestController
@RequestMapping("/api/admin/quality-issues")
public class AdminQualityController {

    public record Issue(String ticker, String code, String detail, int calcVersion, Instant detectedAt) {
    }

    private final JdbcTemplate jdbc;

    public AdminQualityController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Issue> issues() {
        return jdbc.query("""
                select c.ticker, q.code, q.detail, q.calc_version, q.detected_at
                from data_quality_issue q join company c on c.id = q.company_id
                order by c.ticker, q.code
                """, (rs, i) -> new Issue(rs.getString(1), rs.getString(2), rs.getString(3), rs.getInt(4),
                rs.getTimestamp(5).toInstant()));
    }
}
