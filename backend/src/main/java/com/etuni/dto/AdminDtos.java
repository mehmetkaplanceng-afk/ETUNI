package com.etuni.dto;

import java.util.List;

public class AdminDtos {

    public record AdminUserDto(
            Long id,
            String fullName,
            String email,
            String role,
            Long universityId,
            String universityName) {
    }

    public record DashboardStats(
            long totalUsers,
            long totalEvents,
            long activeUniversities) {
    }

    public record UpdateUserRequest(
            String fullName,
            String email,
            String role,
            Long universityId,
            String status) {
    }
}
