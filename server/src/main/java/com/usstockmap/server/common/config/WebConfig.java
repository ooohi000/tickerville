package com.usstockmap.server.common.config;

import java.util.concurrent.TimeUnit;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** 공통 웹 설정: CORS, 캐시 헤더 (docs/api.md 공통 규칙) */
@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class WebConfig implements WebMvcConfigurer {

    public static final String API_PATH = "/api/v1/**";
    /** 데이터가 하루 한 번 바뀌므로 5분 캐시 */
    public static final CacheControl API_CACHE = CacheControl.maxAge(300, TimeUnit.SECONDS).cachePublic();

    private final AppProperties props;

    public WebConfig(AppProperties props) {
        this.props = props;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping(API_PATH)
            .allowedOrigins(props.cors().allowedOrigins().toArray(String[]::new))
            .allowedMethods(HttpMethod.GET.name());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        HandlerInterceptor cacheHeader = new HandlerInterceptor() {
            @Override
            public boolean preHandle(
                jakarta.servlet.http.HttpServletRequest request,
                jakarta.servlet.http.HttpServletResponse response,
                Object handler
            ) {
                if (HttpMethod.GET.matches(request.getMethod())) {
                    response.setHeader("Cache-Control", API_CACHE.getHeaderValue());
                }
                return true;
            }
        };
        registry.addInterceptor(cacheHeader).addPathPatterns(API_PATH);
    }
}
