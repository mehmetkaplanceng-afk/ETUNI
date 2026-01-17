package com.etuni.controller;

import com.etuni.model.Notification;
import com.etuni.service.NotificationService;
import com.etuni.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> listNotifications() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
        }

        try {
            Long userId = Long.parseLong(auth.getPrincipal().toString());
            List<Notification> notifications = notificationService.listForUser(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "OK", notifications));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
