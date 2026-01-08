package com.etuni.service;

import java.math.BigDecimal;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Dummy implementation of PaymentService for development/testing purposes.
 * This will be replaced with a real payment provider integration (Stripe,
 * Iyzico, etc.) in production.
 */
@Service
public class DummyPaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(DummyPaymentServiceImpl.class);

    @Override
    public PaymentInitiationResponse initiatePayment(Long eventId, Long userId, BigDecimal amount) {
        String transactionId = "DUMMY_TXN_" + UUID.randomUUID().toString();
        String paymentUrl = "https://dummy-payment-gateway.example.com/pay/" + transactionId;

        log.info("🧪 DUMMY PAYMENT: Initiating payment for Event #{} by User #{} - Amount: {} TL",
                eventId, userId, amount);
        log.info("🧪 DUMMY PAYMENT: Transaction ID: {}", transactionId);
        log.info("🧪 DUMMY PAYMENT: Payment URL: {}", paymentUrl);

        return new PaymentInitiationResponse(
                transactionId,
                paymentUrl,
                true,
                "Dummy payment initiated successfully. This is a test transaction.");
    }

    @Override
    public PaymentVerificationResponse verifyPayment(String transactionId) {
        log.info("🧪 DUMMY PAYMENT: Verifying payment for Transaction ID: {}", transactionId);

        // Dummy implementation always returns success
        boolean verified = transactionId.startsWith("DUMMY_TXN_");
        String status = verified ? "COMPLETED" : "FAILED";

        return new PaymentVerificationResponse(
                transactionId,
                verified,
                status,
                verified ? "Dummy payment verified successfully." : "Invalid transaction ID.");
    }
}
