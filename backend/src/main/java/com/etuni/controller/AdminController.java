package com.etuni.controller;

import com.etuni.dto.AdminDtos.*;
import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.model.University;
import com.etuni.model.UserEntity;
import com.etuni.repository.UniversityRepository;
import com.etuni.repository.UserRepository;
import com.etuni.service.AuthService;
import com.etuni.service.EventService;
import com.etuni.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final NotificationService notificationService;
    private final AuthService authService;
    private final EventService eventService;

    public AdminController(UserRepository userRepository, UniversityRepository universityRepository,
            NotificationService notificationService, AuthService authService, EventService eventService) {
        this.userRepository = userRepository;
        this.universityRepository = universityRepository;
        this.notificationService = notificationService;
        this.authService = authService;
        this.eventService = eventService;
    }

    @PostMapping("/add-staff")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<String> addStaff(@RequestParam("email") String email,
            @RequestParam("universityId") Long universityId) {
        UserEntity user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        University uni = universityRepository.findById(universityId)
                .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));
        user.setRole("UNIVERSITY_STAFF");
        user.setUniversity(uni);
        userRepository.save(user);
        notificationService.createForUser(user.getId(), "Üniversite Sorumlusu Ataması", "Siz artık "
                + (uni.getName() == null ? "bu üniversitenin" : uni.getName()) + " üniversite sorumlususunuz.");
        return ApiResponse.ok("OK", "User promoted to university staff");
    }

    @PostMapping("/create-and-assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<String> createAndAssign(@RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("universityId") Long universityId) {
        // Use AuthService to register the user with role UNIVERSITY_STAFF
        var req = new com.etuni.dto.AuthDtos.RegisterRequest(fullName, email, password, universityId,
                "UNIVERSITY_STAFF");
        var res = authService.register(req);
        Long newUserId = res.user().id();
        notificationService.createForUser(newUserId, "Üniversite Sorumlusu Ataması", "Siz artık atandınız.");
        return ApiResponse.ok("OK", "User created and assigned");
    }

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ApiResponse<DashboardStats> getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalEvents = eventService.count();
        long activeUniversities = universityRepository.count();
        return ApiResponse.ok("OK", new DashboardStats(totalUsers, totalEvents, activeUniversities));
    }

    @GetMapping("/search-users")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ApiResponse<List<AdminUserDto>> searchUsers(
            @RequestParam(value = "q", required = false) String q) {
        var list = userRepository.findAll().stream()
                .filter(u -> q == null || q.isBlank() || u.getFullName().toLowerCase().contains(q.toLowerCase())
                        || u.getEmail().toLowerCase().contains(q.toLowerCase()))
                .map(u -> new AdminUserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole(),
                        u.getUniversity() != null ? u.getUniversity().getId() : null,
                        u.getUniversity() != null ? u.getUniversity().getName() : null))
                .toList();
        return ApiResponse.ok("OK", list);
    }

    @PostMapping("/assign-events")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<String> assignEvents(@RequestParam("universityId") Long universityId,
            @RequestParam(value = "sourceUniversityId", required = false) Long sourceUniversityId) {
        int updated = eventService.assignEventsToUniversity(universityId, sourceUniversityId);
        return ApiResponse.ok("OK", "Assigned " + updated + " events to university");
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<String> updateUser(@PathVariable("id") Long id,
            @RequestBody UpdateUserRequest request) {
        try {
            log.info("Updating user id={}: role={}, universityId={}, status={}", id, request.role(),
                    request.universityId(), request.status());
            UserEntity user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

            // Check email uniqueness if email is being changed
            if (request.email() != null && !request.email().equals(user.getEmail())) {
                if (userRepository.findByEmail(request.email()).isPresent()) {
                    log.warn("Email already exists: {}", request.email());
                    throw new RuntimeException("EMAIL_ALREADY_EXISTS");
                }
                user.setEmail(request.email());
            }

            // Update full name if provided
            if (request.fullName() != null && !request.fullName().isBlank()) {
                user.setFullName(request.fullName());
            }

            // Update role if provided
            if (request.role() != null && !request.role().isBlank()) {
                user.setRole(request.role());
                log.info("Role updated for user {}: {}", id, request.role());
            }

            // Update status if provided
            if (request.status() != null && !request.status().isBlank()) {
                user.setStatus(request.status());
                log.info("Status updated for user {}: {}", id, request.status());
            }

            // Update university if provided
            if (request.universityId() != null) {
                University uni = universityRepository.findById(request.universityId())
                        .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));
                user.setUniversity(uni);
                log.info("University updated for user {}: {}", id, uni.getName());
            } else {
                // To allow clearing university, if universityId explicitly null in DTO but DTO
                // logic can vary.
                // For now, only update if not null.
            }

            userRepository.save(user);
            log.info("User {} saved successfully in DB", id);
            return ApiResponse.ok("OK", "User updated successfully");
        } catch (RuntimeException e) {
            log.error("Runtime error updating user {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("General error updating user {}", id, e);
            throw new RuntimeException("UPDATE_FAILED");
        }
    }

    @PostMapping("/broadcast-notification")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<String> broadcastNotification(@RequestParam("title") String title,
            @RequestParam("message") String message) {
        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            throw new RuntimeException("TITLE_OR_MESSAGE_EMPTY");
        }
        int count = notificationService.sendBroadcastNotification(title, message);
        return ApiResponse.ok("OK", "Broadcast notification sent to " + count + " users");
    }
}
