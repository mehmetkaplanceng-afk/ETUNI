package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.dto.PaymentDtos.*;
import com.etuni.service.PaymentService;
import com.etuni.service.EventService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final EventService eventService;

    public PaymentController(PaymentService paymentService, EventService eventService) {
        this.paymentService = paymentService;
        this.eventService = eventService;
    }

    @PostMapping("/initiate")
    public ApiResponse<PaymentInitiateResponse> initiatePayment(@RequestBody PaymentInitiateRequest req) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        Long userId = Long.parseLong(auth.getPrincipal().toString());

        var event = eventService.get(req.eventId());
        var result = paymentService.initiatePayment(req.eventId(), userId, event.price());

        return ApiResponse.ok("PAYMENT_INITIATED", new PaymentInitiateResponse(
                result.transactionId(),
                result.paymentUrl(),
                result.success(),
                result.message(),
                event.price(),
                event.title()));
    }

    @PostMapping("/verify")
    public ApiResponse<PaymentVerifyResponse> verifyPayment(@RequestBody PaymentVerifyRequest req) {
        var result = paymentService.verifyPayment(req.transactionId());

        return ApiResponse.ok("PAYMENT_VERIFIED", new PaymentVerifyResponse(
                result.verified(),
                result.status(),
                result.message(),
                null // eventId can be extracted from transaction if needed
        ));
    }

    @GetMapping("/status/{transactionId}")
    public ApiResponse<PaymentVerifyResponse> getPaymentStatus(@PathVariable("transactionId") String transactionId) {
        var result = paymentService.verifyPayment(transactionId);

        return ApiResponse.ok("OK", new PaymentVerifyResponse(
                result.verified(),
                result.status(),
                result.message(),
                null));
    }
}
