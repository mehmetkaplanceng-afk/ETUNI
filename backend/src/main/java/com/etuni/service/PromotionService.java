package com.etuni.service;

import com.etuni.model.PromotionRequest;
import com.etuni.model.UserEntity;
import com.etuni.repository.PromotionRequestRepository;
import com.etuni.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PromotionService {

    private final PromotionRequestRepository requestRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;

    public PromotionService(PromotionRequestRepository requestRepo, UserRepository userRepo, NotificationService notificationService) {
        this.requestRepo = requestRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
    }

    @Transactional
    public void createRequest(Long userId) {
        if (userId == null)
            throw new RuntimeException("USER_ID_REQUIRED");
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        if (!"STUDENT".equals(user.getRole())) {
            throw new RuntimeException("ONLY_STUDENTS_CAN_REQUEST_PROMOTION");
        }

        PromotionRequest req = new PromotionRequest();
        req.setUser(user);
        req.setUniversity(user.getUniversity());
        requestRepo.save(req);
    }

    public List<PromotionRequest> getPendingRequests(Long universityId) {
        return requestRepo.findByUniversityIdAndStatus(universityId, "PENDING");
    }

    @Transactional
    public void approveRequest(Long requestId, Long staffUserId) {
        if (requestId == null)
            throw new RuntimeException("REQUEST_ID_REQUIRED");
        if (staffUserId == null)
            throw new RuntimeException("STAFF_ID_REQUIRED");

        UserEntity staff = userRepo.findById(staffUserId)
                .orElseThrow(() -> new RuntimeException("STAFF_NOT_FOUND"));

        if (!"UNIVERSITY_STAFF".equals(staff.getRole()) && !"ADMIN".equals(staff.getRole())) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        PromotionRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("REQUEST_NOT_FOUND"));

        if (staff.getUniversity() == null || req.getUniversity() == null ||
                !staff.getUniversity().getId().equals(req.getUniversity().getId())) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        req.setStatus("APPROVED");
        UserEntity user = req.getUser();
        user.setRole("ORGANIZER");
        userRepo.save(user);
        requestRepo.save(req);
        // create notification for the student
        if (user != null) {
            notificationService.createForUser(user.getId(), "Organizatör Başvurusu Onaylandı", "Tebrikler! Organizatör başvurunuz onaylandı.");
        }
    }

    @Transactional
    public void rejectRequest(Long requestId, String note, Long staffUserId) {
        if (requestId == null)
            throw new RuntimeException("REQUEST_ID_REQUIRED");
        if (staffUserId == null)
            throw new RuntimeException("STAFF_ID_REQUIRED");

        UserEntity staff = userRepo.findById(staffUserId)
                .orElseThrow(() -> new RuntimeException("STAFF_NOT_FOUND"));

        if (!"UNIVERSITY_STAFF".equals(staff.getRole()) && !"ADMIN".equals(staff.getRole())) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        PromotionRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("REQUEST_NOT_FOUND"));

        if (staff.getUniversity() == null || req.getUniversity() == null ||
                !staff.getUniversity().getId().equals(req.getUniversity().getId())) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        req.setStatus("REJECTED");
        req.setNote(note);
        requestRepo.save(req);
        // notify the student
        UserEntity u = req.getUser();
        if (u != null) {
            notificationService.createForUser(u.getId(), "Organizatör Başvurusu Reddedildi", "Üzgünüz, organizatör başvurunuz reddedildi.\nNot: " + (note == null ? "" : note));
        }
    }

    @Transactional
    public void promoteByEmail(String email, Long staffUserId) {
        if (staffUserId == null)
            throw new RuntimeException("STAFF_ID_REQUIRED");
        UserEntity staff = userRepo.findById(staffUserId)
                .orElseThrow(() -> new RuntimeException("STAFF_NOT_FOUND"));

        if (!"UNIVERSITY_STAFF".equals(staff.getRole()) && !"ADMIN".equals(staff.getRole())) {
            throw new RuntimeException("UNAUTHORIZED");
        }

        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        if (staff.getUniversity() == null || user.getUniversity() == null ||
                !user.getUniversity().getId().equals(staff.getUniversity().getId())) {
            throw new RuntimeException("STUDENT_NOT_IN_YOUR_UNIVERSITY");
        }

        user.setRole("ORGANIZER");
        userRepo.save(user);
        // notify the student
        if (user != null) {
            notificationService.createForUser(user.getId(), "Organizatör Olarak Atandınız", "Bir üniversite sorumlusu tarafından organizatör olarak atandınız.");
        }
    }
}
