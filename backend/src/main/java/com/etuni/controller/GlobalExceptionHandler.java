package com.etuni.controller;

import com.etuni.dto.ApiErrorResponse;
import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.exception.*;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for consistent API error responses.
 * Handles custom exceptions, validation errors, and unexpected errors.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /**
   * Handle BusinessException and its subclasses
   */
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiErrorResponse> handleBusinessException(
      BusinessException ex, HttpServletRequest request) {

    log.warn("Business exception: {} - {}", ex.getErrorCode(), ex.getMessage());

    ApiErrorResponse error = new ApiErrorResponse(
        ex.getHttpStatus(),
        ex.getErrorCode(),
        ex.getMessage(),
        request.getRequestURI());

    return ResponseEntity.status(ex.getHttpStatus()).body(error);
  }

  /**
   * Handle ValidationException with field errors
   */
  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<ApiErrorResponse> handleValidationException(
      ValidationException ex, HttpServletRequest request) {

    log.warn("Validation exception: {}", ex.getFieldErrors());

    ApiErrorResponse error = new ApiErrorResponse(
        ex.getHttpStatus(),
        ex.getErrorCode(),
        ex.getMessage(),
        request.getRequestURI(),
        ex.getFieldErrors());

    return ResponseEntity.status(ex.getHttpStatus()).body(error);
  }

  /**
   * Handle Spring validation errors (@Valid annotation)
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidationErrors(
      MethodArgumentNotValidException ex, HttpServletRequest request) {

    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
    }

    log.warn("Validation errors: {}", fieldErrors);

    ApiErrorResponse error = new ApiErrorResponse(
        400,
        "VALIDATION_ERROR",
        "Doğrulama hataları mevcut",
        request.getRequestURI(),
        fieldErrors);

    return ResponseEntity.badRequest().body(error);
  }

  /**
   * Handle RateLimitException with Retry-After header
   */
  @ExceptionHandler(RateLimitException.class)
  public ResponseEntity<ApiErrorResponse> handleRateLimitException(
      RateLimitException ex, HttpServletRequest request) {

    log.warn("Rate limit exceeded for: {}", request.getRequestURI());

    ApiErrorResponse error = new ApiErrorResponse(
        429,
        ex.getErrorCode(),
        ex.getMessage(),
        request.getRequestURI());

    return ResponseEntity
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
        .body(error);
  }

  /**
   * Handle missing resources (e.g. 404 for static files)
   */
  @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNoResourceFoundException(
      org.springframework.web.servlet.resource.NoResourceFoundException ex, HttpServletRequest request) {

    log.warn("Resource not found: {} - {}", request.getRequestURI(), ex.getMessage());

    ApiErrorResponse error = new ApiErrorResponse(
        404,
        "RESOURCE_NOT_FOUND",
        "İstenen kaynak bulunamadı",
        request.getRequestURI());

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  /**
   * Handle legacy RuntimeException (backward compatibility)
   */
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
    log.error("Unexpected runtime exception", ex);
    String msg = ex.getMessage() == null ? "Beklenmeyen bir hata oluştu" : ex.getMessage();
    return ResponseEntity.badRequest().body(ApiResponse.fail(msg));
  }

  /**
   * Handle all other unexpected exceptions
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleGenericException(
      Exception ex, HttpServletRequest request) {

    log.error("Unexpected exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);

    ApiErrorResponse error = new ApiErrorResponse(
        500,
        "INTERNAL_ERROR",
        "Beklenmeyen bir sunucu hatası oluştu",
        request.getRequestURI());

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
  }
}
