package com.etuni.controller;

import com.etuni.service.PromotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/promotion")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestPromotion() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();

        try {
            Long userId = Long.parseLong(auth.getPrincipal().toString());
            promotionService.createRequest(userId);
            return ResponseEntity.ok("Request submitted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/approve/{id}")
    public ResponseEntity<?> approveRequest(@PathVariable("id") Long id) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();

        try {
            Long staffId = Long.parseLong(auth.getPrincipal().toString());
            promotionService.approveRequest(id, staffId);
            return ResponseEntity.ok("Approved");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reject/{id}")
    public ResponseEntity<?> rejectRequest(@PathVariable("id") Long id, @RequestParam(value = "note", required = false) String note) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();

        try {
            Long staffId = Long.parseLong(auth.getPrincipal().toString());
            promotionService.rejectRequest(id, note, staffId);
            return ResponseEntity.ok("Rejected");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/promote-manual")
    public ResponseEntity<?> promoteManual(@RequestParam("email") String email) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();

        try {
            // This is a bit simplified, ideally we fetch the staff user profile here
            // But for brevity, we assume the service handles the check
            // We need the staff's university ID.
            // Better to pass it or have the service find it from the context user.
            Long staffId = Long.parseLong(auth.getPrincipal().toString());
            promotionService.promoteByEmail(email, staffId);
            return ResponseEntity.ok("Promoted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
