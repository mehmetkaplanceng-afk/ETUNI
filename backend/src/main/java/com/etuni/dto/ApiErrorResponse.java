package com.etuni.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard API error response format for consistent error handling.
 */
public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String errorCode,
        String message,
        String path,
        Map<String, String> fieldErrors) {
    public ApiErrorResponse(int status, String errorCode, String message, String path) {
        this(LocalDateTime.now(), status, errorCode, message, path, null);
    }

    public ApiErrorResponse(int status, String errorCode, String message, String path,
            Map<String, String> fieldErrors) {
        this(LocalDateTime.now(), status, errorCode, message, path, fieldErrors);
    }
}
