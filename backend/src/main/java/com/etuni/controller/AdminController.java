package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.model.University;
import com.etuni.model.UserEntity;
import com.etuni.repository.UniversityRepository;
import com.etuni.service.EventService;
import com.etuni.service.AuthService;
import com.etuni.repository.UserRepository;
import com.etuni.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

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

    public static record AdminUserDto(Long id, String fullName, String email, String role) {
    }

    @GetMapping("/search-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<java.util.List<AdminUserDto>> searchUsers(
            @RequestParam(value = "q", required = false) String q) {
        var list = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && ("STUDENT".equals(u.getRole()) || "ORGANIZER".equals(u.getRole())))
                .filter(u -> q == null || q.isBlank() || u.getFullName().toLowerCase().contains(q.toLowerCase())
                        || u.getEmail().toLowerCase().contains(q.toLowerCase()))
                .map(u -> new AdminUserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole()))
                .toList();
        return ApiResponse.ok("OK", list);
    }

    @PostMapping("/assign-events")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> assignEvents(@RequestParam("universityId") Long universityId,
            @RequestParam(value = "sourceUniversityId", required = false) Long sourceUniversityId) {
        int updated = eventService.assignEventsToUniversity(universityId, sourceUniversityId);
        return ApiResponse.ok("OK", "Assigned " + updated + " events to university");
    }

    public static record UpdateUserRequest(String fullName, String email, String role, Long universityId) {
    }

    @org.springframework.web.bind.annotation.PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> updateUser(@org.springframework.web.bind.annotation.PathVariable("id") Long id,
            @org.springframework.web.bind.annotation.RequestBody UpdateUserRequest request) {
        try {
            UserEntity user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

            // Check email uniqueness if email is being changed
            if (request.email() != null && !request.email().equals(user.getEmail())) {
                if (userRepository.findByEmail(request.email()).isPresent()) {
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
            }

            // Update university if provided
            if (request.universityId() != null) {
                University uni = universityRepository.findById(request.universityId())
                        .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));
                user.setUniversity(uni);
            }

            userRepository.save(user);
            return ApiResponse.ok("OK", "User updated successfully");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("UPDATE_FAILED");
        }
    }
}
