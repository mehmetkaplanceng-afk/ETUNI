package com.etuni.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * HTTP filter that applies rate limiting to incoming requests.
 * Uses client IP address as the key for rate limiting.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiter rateLimiter;

    public RateLimitFilter(RateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        boolean allowed;

        // Stricter rate limiting for auth endpoints
        if (path.contains("/api/auth/")) {
            allowed = rateLimiter.tryConsumeAuth(clientIp);
        } else {
            allowed = rateLimiter.tryConsume(clientIp);
        }

        if (!allowed) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", "60");
            response.getWriter().write(
                    "{\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"," +
                            "\"status\":429," +
                            "\"errorCode\":\"RATE_LIMIT_EXCEEDED\"," +
                            "\"message\":\"Çok fazla istek gönderildi. 60 saniye sonra tekrar deneyin.\"," +
                            "\"path\":\"" + path + "\"}");
            return;
        }

        // Add rate limit headers
        long remaining = rateLimiter.getAvailableTokens(clientIp);
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        // Don't rate limit static resources
        return path.startsWith("/css/") ||
                path.startsWith("/js/") ||
                path.startsWith("/images/") ||
                path.equals("/api/health");
    }
}
