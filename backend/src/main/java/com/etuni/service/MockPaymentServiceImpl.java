package com.etuni.service;

import com.etuni.repository.EventRepository;
import com.etuni.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Primary
public class MockPaymentServiceImpl implements PaymentService {

    private final UserRepository userRepo;
    private final EventRepository eventRepo;

    @Value("${api.url:http://localhost:8080}")
    private String appApiUrl;

    public MockPaymentServiceImpl(UserRepository userRepo, EventRepository eventRepo) {
        this.userRepo = userRepo;
        this.eventRepo = eventRepo;
    }

    @Override
    public PaymentInitiationResponse initiatePayment(Long eventId, Long userId, BigDecimal amount) {
        // Log to confirm activity
        System.out.println(">>> MOCK PAYMENT SERVICE INITIATED <<<");

        // Generate a mock token
        String token = "MOCK-" + UUID.randomUUID().toString();

        // Check if event and user exist (simple validation)
        boolean eventExists = eventRepo.existsById(eventId);
        boolean userExists = userRepo.existsById(userId);

        if (!eventExists || !userExists) {
            return new PaymentInitiationResponse(null, null, false, "Invalid event or user");
        }

        // Construct the mock payment URL
        // This URL points to our own backend, which will serve the HTML page
        String paymentUrl = appApiUrl + "/mock-payment?token=" + token +
                "&eventId=" + eventId +
                "&userId=" + userId +
                "&amount=" + amount;

        return new PaymentInitiationResponse(
                token,
                paymentUrl,
                true,
                "Mock payment initiated");
    }

    @Override
    public PaymentVerificationResponse verifyPayment(String transactionId) {
        // In this mock service, we treat all "MOCK-" tokens as valid/successful
        // You could add logic here to store pending tokens in a map if you wanted more
        // statefulness

        if (transactionId != null && transactionId.startsWith("MOCK-")) {
            return new PaymentVerificationResponse(
                    transactionId,
                    true,
                    "SUCCESS",
                    "Mock payment verified successfully");
        }

        return new PaymentVerificationResponse(
                transactionId,
                false,
                "FAILURE",
                "Invalid mock token");
    }
}
