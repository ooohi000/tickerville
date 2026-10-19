package com.usstockmap.server.common.admin;

import com.usstockmap.server.common.api.ApiException;
import com.usstockmap.server.common.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 관리자 API(/api/admin/**) 보호: 헤더 X-Admin-Key 가 설정한 키와 같아야 한다.
 * 사용자 로그인이 생기기 전까지의 최소 보호 (docs/checklist.md 인증). 키가 비어 있으면 전부 거절.
 * 응답 캐시 금지, CORS 미허용(브라우저에서 직접 못 부름).
 */
public class AdminKeyInterceptor implements HandlerInterceptor {

    public static final String PATH = "/api/admin/**";
    public static final String HEADER = "X-Admin-Key";

    private final AppProperties.Admin admin;

    public AdminKeyInterceptor(AppProperties.Admin admin) {
        this.admin = admin;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        response.setHeader("Cache-Control", "no-store");
        String given = request.getHeader(HEADER);
        if (admin == null || !admin.enabled() || given == null || !constantTimeEquals(given, admin.apiKey())) {
            throw ApiException.unauthorized();
        }
        return true;
    }

    /** 글자마다 비교 시간이 달라서 키를 추측당하지 않게 */
    static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
