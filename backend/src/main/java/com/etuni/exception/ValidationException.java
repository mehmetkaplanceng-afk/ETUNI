package com.etuni.exception;

import java.util.Map;
import java.util.HashMap;

/**
 * Exception thrown when validation fails.
 * Can contain multiple field-level errors.
 */
public class ValidationException extends BusinessException {

    private final Map<String, String> fieldErrors;

    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", 400);
        this.fieldErrors = new HashMap<>();
    }

    public ValidationException(String field, String error) {
        super("Doğrulama hatası: " + field, "VALIDATION_ERROR", 400);
        this.fieldErrors = new HashMap<>();
        this.fieldErrors.put(field, error);
    }

    public ValidationException(Map<String, String> fieldErrors) {
        super("Doğrulama hataları mevcut", "VALIDATION_ERROR", 400);
        this.fieldErrors = fieldErrors != null ? fieldErrors : new HashMap<>();
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }

    public void addFieldError(String field, String error) {
        this.fieldErrors.put(field, error);
    }

    public boolean hasErrors() {
        return !fieldErrors.isEmpty();
    }
}
