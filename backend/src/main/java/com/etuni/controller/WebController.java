package com.etuni.controller;

import com.etuni.service.RecommendationService;
import com.etuni.service.EventService;
import com.etuni.service.UniversityService;
import com.etuni.service.UserProfileService;
import com.etuni.service.PromotionService;
import org.springframework.stereotype.Controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class WebController {

    private static final Logger logger = LoggerFactory.getLogger(WebController.class);

    private final EventService eventService;
    private final UniversityService universityService;
    private final UserProfileService userProfileService;
    private final PromotionService promotionService;
    private final com.etuni.service.NotificationService notificationService;
    private final RecommendationService recommendationService;

    public WebController(EventService eventService, UniversityService universityService,
            UserProfileService userProfileService,
            PromotionService promotionService,
            RecommendationService recommendationService,
            com.etuni.service.NotificationService notificationService) {
        this.eventService = eventService;
        this.universityService = universityService;
        this.userProfileService = userProfileService;
        this.promotionService = promotionService;
        this.recommendationService = recommendationService;
        this.notificationService = notificationService;
    }

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("title", "ETUNI - Akıllı Etkinlik Platformu");
        return "index";
    }

    @GetMapping("/events")
    public String events(Model model) {
        Long universityId = 1L; // Fallback

        // Try to get logged in user's university
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            try {
                Long userId = Long.parseLong(auth.getPrincipal().toString());
                var profile = userProfileService.getProfile(userId);
                if (profile.selectedUniversityId() != null) {
                    universityId = profile.selectedUniversityId();
                }

                // Add recommendations
                model.addAttribute("recommendedEvents", recommendationService.recommend(userId));

                // Ensure we use the profile's uni, or fallback to 1L
                if (universityId == null)
                    universityId = 1L;

            } catch (Exception ignored) {
                // If profile loading fails, continue safely
            }
        }

        // Always try to load events for the selected (or default) university
        if (eventService.listLatestByUniversity(universityId).isEmpty()) {
            // Fallback logic for demo
            Long finalUniversiyId = universityId;
            universityId = universityService.list().stream()
                    .filter(u -> !eventService.listLatestByUniversity(u.id()).isEmpty())
                    .findFirst()
                    .map(com.etuni.dto.UniversityDtos.UniversityResponse::id)
                    .orElse(finalUniversiyId);
        }

        model.addAttribute("events", eventService.listLatestByUniversity(universityId));
        model.addAttribute("title", "Etkinlikler | ETUNI");
        return "events";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return "redirect:/login";
            }

            Long userId = Long.parseLong(auth.getPrincipal().toString());
            var profile = userProfileService.getProfile(userId);
            model.addAttribute("user", profile);
            model.addAttribute("title", "Panelim | ETUNI");

            String role = profile.role();
            if ("ADMIN".equals(role)) {
                model.addAttribute("universities", universityService.list());
                model.addAttribute("totalEvents", eventService.count());
                model.addAttribute("totalUsers", userProfileService.countUsers());
                return "dashboard-admin";
            }
            if ("UNIVERSITY_STAFF".equals(role)) {
                model.addAttribute("universityName", profile.selectedUniversityName());
                model.addAttribute("pendingRequests",
                        promotionService.getPendingRequests(profile.selectedUniversityId()));
                return "dashboard-staff";
            }
            if ("ORGANIZER".equals(role)) {
                model.addAttribute("events", eventService.listAllByUniversity(profile.selectedUniversityId()));
                return "dashboard-organizer";
            }
            // STUDENT
            model.addAttribute("attendanceCheck", userProfileService.getAttendanceHistory(userId));
            model.addAttribute("notifications", notificationService.listForUser(userId));
            return "dashboard-student";
        } catch (Exception e) {
            logger.error("Dashboard rendering failed", e);
            throw e;
        }
    }

    @GetMapping("/events/{id}")
    public String eventDetail(@PathVariable("id") Long id, Model model) {
        model.addAttribute("event", eventService.get(id));
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            try {
                Long userId = Long.parseLong(auth.getPrincipal().toString());
                var profile = userProfileService.getProfile(userId);
                model.addAttribute("user", profile);
            } catch (Exception ignored) {
            }
        }
        return "event-detail";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/events/new")
    public String createEvent(Model model) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:/login";
        }
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        var profile = userProfileService.getProfile(userId);

        // Only Organizer or Staff can create events (Admin too)
        if (!"ORGANIZER".equals(profile.role()) && !"UNIVERSITY_STAFF".equals(profile.role())
                && !"ADMIN".equals(profile.role())) {
            return "redirect:/dashboard";
        }

        model.addAttribute("user", profile);
        return "events-new";
    }

    @GetMapping("/register")
    public String register(Model model) {
        model.addAttribute("universities", universityService.list());
        return "register";
    }
}
