package com.etuni.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class AttendanceDtos {

    public record ScanRequest(
            Long userId,
            @NotBlank String qrPayload,
            Long currentEventId) {
    }

    public record AttendanceView(
            Long id,
            Long eventId,
            Long userId,
            LocalDateTime scannedAt,
            boolean verified) {
    }

    public record QRValidationResponse(
            boolean valid,
            String message,
            Long eventId,
            String eventTitle,
            LocalDateTime checkInTime,
            Long userId,
            String userFullName,
            String userEmail) {
    }
    public record ApplicantResponse(
            Long attendanceId,
            Long userId,
            String userFullName,
            String userEmail,
            LocalDateTime appliedAt,
            String status) {
    }
}
