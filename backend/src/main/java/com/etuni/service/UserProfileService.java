package com.etuni.service;

import com.etuni.dto.UserProfileDtos.*;
import com.etuni.model.Attendance;
import com.etuni.model.University;
import com.etuni.model.UserEntity;
import com.etuni.repository.AttendanceRepository;
import com.etuni.repository.UniversityRepository;
import com.etuni.repository.UserRepository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {

    private final UserRepository userRepo;
    private final UniversityRepository universityRepo;
    private final AttendanceRepository attendanceRepo;

    public UserProfileService(UserRepository userRepo, UniversityRepository universityRepo,
            AttendanceRepository attendanceRepo) {
        this.userRepo = userRepo;
        this.universityRepo = universityRepo;
        this.attendanceRepo = attendanceRepo;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
        return toDto(user);
    }

    @Transactional
    public UserProfileResponse updateInterests(Long userId, UpdateInterestsRequest req) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        if (req.interests() != null) {
            user.setInterests(req.interests());
        }

        if (req.preferredTimeRange() != null) {
            user.setPreferredTimeRange(req.preferredTimeRange());
        }

        return toDto(userRepo.save(user));
    }

    @Transactional
    public UserProfileResponse selectUniversity(Long userId, SelectUniversityRequest req) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        University uni = universityRepo.findById(req.universityId())
                .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));

        user.setUniversity(uni);
        return toDto(userRepo.save(user));
    }

    @Transactional(readOnly = true)
    public AttendanceHistoryResponse getAttendanceHistory(Long userId) {
        userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

        List<Attendance> attendances = attendanceRepo.findByUserIdOrderByScannedAtDesc(userId);

        List<AttendanceHistoryItem> items = attendances.stream()
            .map(a -> new AttendanceHistoryItem(
                a.getId(),
                a.getEvent().getId(),
                a.getEvent().getTitle(),
                a.getEvent().getEventType(),
                a.getScannedAt(),
                a.isVerified(),
                a.getStatus(),
                a.getTicketCode()))
            .toList();

        return new AttendanceHistoryResponse(items.size(), items);
    }

    public long countUsers() {
        return userRepo.count();
    }

    private UserProfileResponse toDto(UserEntity user) {
        Long uniId = user.getUniversity() != null ? user.getUniversity().getId() : null;
        String uniName = user.getUniversity() != null ? user.getUniversity().getName() : null;

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                uniId,
                uniName,
                user.getInterests(),
                user.getPreferredTimeRange());
    }
}
