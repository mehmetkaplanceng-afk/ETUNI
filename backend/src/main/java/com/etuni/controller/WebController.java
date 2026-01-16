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
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WebController {

    private static final Logger logger = LoggerFactory.getLogger(WebController.class);

    private final EventService eventService;
    private final UniversityService universityService;
    private final UserProfileService userProfileService;
    private final com.etuni.service.ClubService clubService;

    public WebController(EventService eventService, UniversityService universityService,
            UserProfileService userProfileService,
            PromotionService promotionService,
            com.etuni.service.ClubService clubService,
            RecommendationService recommendationService,
            com.etuni.service.NotificationService notificationService,
            com.etuni.service.AttendanceService attendanceService) {
        this.eventService = eventService;
        this.universityService = universityService;
        this.userProfileService = userProfileService;
        this.promotionService = promotionService;
        this.clubService = clubService;
        this.recommendationService = recommendationService;
        this.notificationService = notificationService;
        this.attendanceService = attendanceService;
    }

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("title", "ETUNI - Akıllı Etkinlik Platformu");
        return "index";
    }

    @GetMapping("/events")
    public String events(@RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "clubId", required = false) Long clubId,
            @RequestParam(name = "status", required = false) String status,
            Model model) {
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

        // Add clubs for sidebar logic
        model.addAttribute("clubs", clubService.listByUniversity(universityId));

        if ((search != null && !search.isBlank()) || clubId != null || status != null) {
            model.addAttribute("events", eventService.search(universityId, search, clubId, status));
        } else {
            model.addAttribute("events", eventService.listLatestByUniversity(universityId));
        }

        model.addAttribute("searchQuery", search);
        model.addAttribute("selectedClubId", clubId);
        model.addAttribute("selectedStatus", status);
        model.addAttribute("title", "Etkinlikler | ETUNI");
        return "events";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                logger.warn("Unauthenticated dashboard access attempt");
                return "redirect:/login";
            }

            String principal = auth.getPrincipal().toString();
            Long userId;
            try {
                userId = Long.parseLong(principal);
            } catch (NumberFormatException e) {
                logger.error("Invalid principal in security context: {}", principal);
                return "redirect:/login";
            }

            var profile = userProfileService.getProfile(userId);
            if (profile == null) {
                logger.error("Profile not found for authenticated user ID: {}", userId);
                return "redirect:/login";
            }

            model.addAttribute("user", profile);
            model.addAttribute("title", "Panelim | ETUNI");

            String role = profile.role();
            logger.info("Accessing dashboard for user: {}, role: {}", userId, role);

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

                // Calculate and add total revenue
                java.math.BigDecimal totalRevenue = attendanceService
                        .calculateTotalRevenueForUniversity(profile.selectedUniversityId());
                model.addAttribute("totalRevenue", totalRevenue);

                return "dashboard-staff";
            }
            if ("ORGANIZER".equals(role)) {
                model.addAttribute("events", eventService.listAllByUniversity(profile.selectedUniversityId()));
                return "dashboard-organizer";
            }

            // Default: STUDENT
            try {
                var attendance = userProfileService.getAttendanceHistory(userId);
                model.addAttribute("attendanceCheck", attendance);

                var notifications = notificationService.listForUser(userId);
                model.addAttribute("notifications", notifications);

                // Add relevant events for the student
                var upcomingEvents = eventService.listAllByUniversity(profile.selectedUniversityId());
                model.addAttribute("events", upcomingEvents);

            } catch (Exception inner) {
                logger.error("Error loading student data for userId: {}", userId, inner);
                model.addAttribute("error", "Veriler yüklenirken bir hata oluştu.");
            }

            return "dashboard-student";
        } catch (Exception e) {
            logger.error("Critical dashboard rendering failure", e);
            return "redirect:/error";
        }
    }

    @GetMapping("/admin/users")
    public String adminUsers(Model model) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:/login";
        }
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        var profile = userProfileService.getProfile(userId);

        if (!"ADMIN".equals(profile.role())) {
            return "redirect:/dashboard";
        }

        model.addAttribute("user", profile);
        model.addAttribute("users", userProfileService.findAllUsers());
        return "admin-users";
    }

    @GetMapping("/dashboard/events/{id}")
    public String dashboardEventDetail(@PathVariable("id") Long id, Model model) {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return "redirect:/login";
            }
            Long userId = Long.parseLong(auth.getPrincipal().toString());
            var profile = userProfileService.getProfile(userId);

            // Access control: Organizer, Staff, or Admin
            if (!"ORGANIZER".equals(profile.role()) && !"UNIVERSITY_STAFF".equals(profile.role())
                    && !"ADMIN".equals(profile.role())) {
                return "redirect:/dashboard";
            }

            // In a real app, we should also check if the event belongs to this organizer's
            // university/club
            // For now, simpler role check matches existing logic

            model.addAttribute("user", profile);
            model.addAttribute("event", eventService.get(id));
            model.addAttribute("attendees", eventService.getAttendees(id));
            model.addAttribute("title", "Etkinlik Detayı | Panel");

            return "dashboard-event-detail";
        } catch (Exception e) {
            logger.error("Error loading dashboard event detail", e);
            return "redirect:/dashboard";
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

    @GetMapping("/events/{id}/edit")
    public String editEvent(@PathVariable("id") Long id, Model model) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:/login";
        }
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        var profile = userProfileService.getProfile(userId);

        if (!"ORGANIZER".equals(profile.role()) && !"UNIVERSITY_STAFF".equals(profile.role())
                && !"ADMIN".equals(profile.role())) {
            return "redirect:/dashboard";
        }

        model.addAttribute("event", eventService.get(id));
        model.addAttribute("user", profile);
        return "events-edit";
    }

    @GetMapping("/clubs/new")
    public String createClub(Model model) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:/login";
        }
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        var profile = userProfileService.getProfile(userId);

        // Only Organizer or Staff can create clubs (Admin too)
        if (!"ORGANIZER".equals(profile.role()) && !"UNIVERSITY_STAFF".equals(profile.role())
                && !"ADMIN".equals(profile.role())) {
            return "redirect:/dashboard";
        }

        model.addAttribute("user", profile);
        return "clubs-new";
    }

    @GetMapping("/register")
    public String register(Model model) {
        model.addAttribute("universities", universityService.list());
        return "register";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                logger.warn("Unauthorized profile access attempt");
                return "redirect:/login";
            }

            String principal = auth.getPrincipal().toString();
            Long userId;
            try {
                userId = Long.parseLong(principal);
            } catch (NumberFormatException e) {
                logger.error("Invalid principal for profile access: {}", principal);
                return "redirect:/login";
            }

            var profile = userProfileService.getProfile(userId);
            if (profile == null) {
                logger.error("Profile not found for userId: {}", userId);
                return "redirect:/dashboard";
            }

            model.addAttribute("user", profile);
            model.addAttribute("universities", universityService.list());
            model.addAttribute("title", "Profilim | ETUNI");

            logger.info("Profile successfully loaded for user: {}", userId);
            return "profile";
        } catch (Exception e) {
            logger.error("Profile page loading failed", e);
            return "redirect:/dashboard";
        }
    }

    @GetMapping("/map")
    public String map(Model model) {
        model.addAttribute("title", "Etkinlik Haritası | ETUNI");
        return "map";
    }

    @GetMapping("/payment/{eventId}")
    public String paymentPage(@PathVariable("eventId") Long eventId, Model model) {
        var event = eventService.get(eventId);
        model.addAttribute("event", event);
        return "payment";
    }

    @GetMapping("/payment/success")
    public String paymentSuccess(@RequestParam("txn") String transactionId, Model model) {
        model.addAttribute("transactionId", transactionId);
        // In a real system, fetch event details from transaction
        model.addAttribute("eventTitle", "Etkinlik");
        return "payment-success";
    }

    @GetMapping("/forgot-password")
    public String forgotPasswordPage(Model model) {
        model.addAttribute("title", "Şifremi Unuttum | ETUNI");
        return "forgot-password";
    }

    @GetMapping("/reset-password")
    public String resetPasswordPage(@RequestParam(name = "token", required = false) String token, Model model) {
        if (token == null || token.isEmpty()) {
            return "redirect:/forgot-password";
        }
        model.addAttribute("token", token);
        model.addAttribute("title", "Şifre Sıfırlama | ETUNI");
        return "reset-password";
    }
}
