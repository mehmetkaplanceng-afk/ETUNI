package com.etuni.config;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

/**
 * Simple in-memory rate limiter using token bucket algorithm.
 * For production, consider using Redis-based distributed rate limiting.
 */
@Component
public class RateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Default: 100 requests per minute per IP/user
    private static final int DEFAULT_CAPACITY = 100;
    private static final Duration DEFAULT_REFILL_PERIOD = Duration.ofMinutes(1);

    // Auth endpoints: 10 requests per minute (prevent brute force)
    private static final int AUTH_CAPACITY = 10;

    /**
     * Get or create a bucket for the given key
     */
    public Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, this::createDefaultBucket);
    }

    /**
     * Get or create an auth-specific bucket (stricter limits)
     */
    public Bucket resolveAuthBucket(String key) {
        return buckets.computeIfAbsent("auth:" + key, this::createAuthBucket);
    }

    /**
     * Check if request is allowed and consume a token
     */
    public boolean tryConsume(String key) {
        return resolveBucket(key).tryConsume(1);
    }

    /**
     * Check if auth request is allowed
     */
    public boolean tryConsumeAuth(String key) {
        return resolveAuthBucket(key).tryConsume(1);
    }

    /**
     * Get available tokens for a key
     */
    public long getAvailableTokens(String key) {
        return resolveBucket(key).getAvailableTokens();
    }

    private Bucket createDefaultBucket(String key) {
        Bandwidth limit = Bandwidth.classic(DEFAULT_CAPACITY,
                Refill.greedy(DEFAULT_CAPACITY, DEFAULT_REFILL_PERIOD));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket createAuthBucket(String key) {
        Bandwidth limit = Bandwidth.classic(AUTH_CAPACITY,
                Refill.intervally(AUTH_CAPACITY, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Clear all buckets (useful for testing)
     */
    public void clearAll() {
        buckets.clear();
    }

    /**
     * Remove a specific bucket
     */
    public void removeBucket(String key) {
        buckets.remove(key);
    }
}
