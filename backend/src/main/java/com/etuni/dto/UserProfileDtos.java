package com.etuni.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UserProfileDtos {

        public record UpdateInterestsRequest(
                        List<String> interests,
                        String preferredTimeRange // e.g. "18-22"
        ) {
        }

        public record SelectUniversityRequest(
                        Long universityId) {
        }

        public record UserProfileResponse(
                        Long id,
                        String fullName,
                        String email,
                        String role,
                        Long selectedUniversityId,
                        String selectedUniversityName,
                        List<String> interests,
                        String preferredTimeRange) {
        }

        public record AttendanceHistoryItem(
                        Long attendanceId,
                        Long eventId,
                        String eventTitle,
                        String eventType,
                        LocalDateTime scannedAt,
                        boolean verified,
                        String status,
                        String ticketCode) {
        }

        public record AttendanceHistoryResponse(
                        int totalAttendance,
                        List<AttendanceHistoryItem> items) {
        }
}
