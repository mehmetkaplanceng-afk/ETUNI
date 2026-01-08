package com.etuni.dto;

import java.math.BigDecimal;

public class PaymentDtos {

    public record PaymentInitiateRequest(
            Long eventId,
            Long userId) {
    }

    public record PaymentInitiateResponse(
            String transactionId,
            String paymentUrl,
            boolean success,
            String message,
            BigDecimal amount,
            String eventTitle) {
    }

    public record PaymentVerifyRequest(
            String transactionId) {
    }

    public record PaymentVerifyResponse(
            boolean verified,
            String status,
            String message,
            Long eventId) {
    }
}
