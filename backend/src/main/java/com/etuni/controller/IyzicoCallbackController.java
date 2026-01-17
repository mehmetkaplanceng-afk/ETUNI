package com.etuni.controller;

import com.etuni.service.AttendanceService;
import com.etuni.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import java.util.Map;

@Controller
@RequestMapping("/api/payments/iyzico")
public class IyzicoCallbackController {

    private static final Logger log = LoggerFactory.getLogger(IyzicoCallbackController.class);

    private final PaymentService paymentService;
    private final AttendanceService attendanceService;

    public IyzicoCallbackController(PaymentService paymentService, AttendanceService attendanceService) {
        this.paymentService = paymentService;
        this.attendanceService = attendanceService;
    }

    @PostMapping("/callback")
    public ModelAndView handleIyzicoCallback(
            @RequestParam("token") String token,
            @RequestParam("eventId") Long eventId,
            @RequestParam("userId") Long userId) {

        log.info("Received Iyzico callback for Token: {}, EventId: {}, UserId: {}", token, eventId, userId);

        var verification = paymentService.verifyPayment(token);

        ModelAndView mav = new ModelAndView();
        if (verification.verified()) {
            try {
                attendanceService.createPaidAttendance(userId, eventId, token);
                mav.setViewName("redirect:/payment-success?eventId=" + eventId);
            } catch (Exception e) {
                log.error("Error creating attendance after successful payment", e);
                mav.setViewName("redirect:/payment-error?message=INTERNAL_ERROR");
            }
        } else {
            log.warn("Payment verification failed for token {}: {}", token, verification.message());
            mav.setViewName("redirect:/payment-error?message=" + verification.message());
        }

        return mav;
    }

    @org.springframework.web.bind.annotation.GetMapping("/success")
    public String showSuccess() {
        return "payment-success";
    }

    @org.springframework.web.bind.annotation.GetMapping("/error")
    public String showError() {
        return "payment-error";
    }
}
