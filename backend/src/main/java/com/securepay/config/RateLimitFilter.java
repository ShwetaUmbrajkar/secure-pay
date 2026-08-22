package com.securepay.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Minimal in-memory fixed-window rate limiter, keyed by client IP.
 * Good enough for a single-instance demo; swap for Redis/Bucket4j if you
 * ever run more than one backend replica.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    private record Window(long windowStartMs, AtomicInteger count) {}

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String clientKey = request.getRemoteAddr();
        long now = System.currentTimeMillis();
        long oneMinuteMs = 60_000L;

        Window window = windows.compute(clientKey, (key, existing) -> {
            if (existing == null || now - existing.windowStartMs() > oneMinuteMs) {
                return new Window(now, new AtomicInteger(1));
            }
            existing.count().incrementAndGet();
            return existing;
        });

        if (window.count().get() > requestsPerMinute) {
            response.setStatus(429); // Too Many Requests
            response.getWriter().write("{\"error\":\"Rate limit exceeded, try again shortly.\"}");
            response.setContentType("application/json");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
