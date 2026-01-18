package com.etuni.controller;

import com.etuni.model.Event;
import com.etuni.repository.EventRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

@Controller
public class MockPaymentController {

    private final EventRepository eventRepo;

    public MockPaymentController(EventRepository eventRepo) {
        this.eventRepo = eventRepo;
    }

    @GetMapping("/mock-payment")
    public String showMockPaymentPage(@RequestParam("token") String token,
            @RequestParam("eventId") Long eventId,
            @RequestParam("userId") Long userId,
            @RequestParam("amount") BigDecimal amount,
            Model model) {

        // Fetch event details for better UI
        Event event = eventRepo.findById(eventId).orElse(null);
        String eventName = (event != null) ? event.getTitle() : "Unknown Event";

        model.addAttribute("token", token);
        model.addAttribute("eventId", eventId);
        model.addAttribute("userId", userId);
        model.addAttribute("amount", amount);
        model.addAttribute("eventName", eventName);

        return "mock-payment";
    }
}
