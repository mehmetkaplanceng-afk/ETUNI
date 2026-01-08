package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.dto.UserProfileDtos.*;
import com.etuni.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ApiResponse<UserProfileResponse> getProfile(Authentication auth) {
        Long userId = Long.valueOf(auth.getPrincipal().toString());
        return ApiResponse.ok("OK", userProfileService.getProfile(userId));
    }

    @PutMapping("/interests")
    public ApiResponse<UserProfileResponse> updateInterests(
            Authentication auth,
            @Valid @RequestBody UpdateInterestsRequest req) {
        Long userId = Long.valueOf(auth.getPrincipal().toString());
        return ApiResponse.ok("INTERESTS_UPDATED", userProfileService.updateInterests(userId, req));
    }

    @PutMapping("/university")
    public ApiResponse<UserProfileResponse> selectUniversity(
            Authentication auth,
            @Valid @RequestBody SelectUniversityRequest req) {
        Long userId = Long.valueOf(auth.getPrincipal().toString());
        return ApiResponse.ok("UNIVERSITY_SELECTED", userProfileService.selectUniversity(userId, req));
    }

    @GetMapping("/attendance-history")
    public ApiResponse<AttendanceHistoryResponse> getAttendanceHistory(Authentication auth) {
        Long userId = Long.valueOf(auth.getPrincipal().toString());
        return ApiResponse.ok("OK", userProfileService.getAttendanceHistory(userId));
    }

    @PutMapping("/update")
    public ApiResponse<UserProfileResponse> updateProfile(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest req) {
        Long userId = Long.valueOf(auth.getPrincipal().toString());
        return ApiResponse.ok("PROFILE_UPDATED", userProfileService.updateProfile(userId, req));
    }
}
