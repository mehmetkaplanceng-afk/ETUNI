package com.etuni.exception;

/**
 * Exception thrown when rate limiting is triggered.
 * Returns HTTP 429 status.
 */
public class RateLimitException extends BusinessException {

    private final long retryAfterSeconds;

    public RateLimitException() {
        super("Çok fazla istek gönderildi, lütfen bekleyin", "RATE_LIMIT_EXCEEDED", 429);
        this.retryAfterSeconds = 60;
    }

    public RateLimitException(long retryAfterSeconds) {
        super(
                String.format("Çok fazla istek. %d saniye sonra tekrar deneyin", retryAfterSeconds),
                "RATE_LIMIT_EXCEEDED",
                429);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
