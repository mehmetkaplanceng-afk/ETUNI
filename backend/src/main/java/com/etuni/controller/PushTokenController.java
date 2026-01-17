package com.etuni.controller;

import com.etuni.model.UserEntity;
import com.etuni.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push-token")
public class PushTokenController {

    private final UserRepository userRepository;

    public PushTokenController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> registerPushToken(@RequestBody Map<String, String> payload) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Long userId = Long.parseLong(auth.getPrincipal().toString());
            String pushToken = payload.get("pushToken");

            if (pushToken == null || pushToken.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Push token is required");
            }

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setPushToken(pushToken.trim());
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Push token registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deletePushToken() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Long userId = Long.parseLong(auth.getPrincipal().toString());
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setPushToken(null);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Push token deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
