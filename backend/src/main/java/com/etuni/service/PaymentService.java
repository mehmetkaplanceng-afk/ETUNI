package com.etuni.service;

import java.math.BigDecimal;

/**
 * Payment Service Interface for future payment provider integration (Stripe,
 * Iyzico, etc.)
 */
public interface PaymentService {

    /**
     * Initiate a payment for a paid event
     * 
     * @param eventId The ID of the paid event
     * @param userId  The ID of the user making the payment
     * @param amount  The amount to be charged
     * @return Payment initiation response with transaction details
     */
    PaymentInitiationResponse initiatePayment(Long eventId, Long userId, BigDecimal amount);

    /**
     * Verify a payment transaction
     * 
     * @param transactionId The transaction ID from the payment provider
     * @return Payment verification response with status
     */
    PaymentVerificationResponse verifyPayment(String transactionId);

    /**
     * Payment Initiation Response
     */
    record PaymentInitiationResponse(
            String transactionId,
            String paymentUrl,
            boolean success,
            String message) {
    }

    /**
     * Payment Verification Response
     */
    record PaymentVerificationResponse(
            String transactionId,
            boolean verified,
            String status,
            String message) {
    }
}
