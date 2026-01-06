package com.etuni.controller;

import com.etuni.dto.AnalyticsDtos.*;
import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.service.AnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
    public ApiResponse<EventAnalyticsResponse> getEventAnalytics(@PathVariable Long eventId) {
        return ApiResponse.ok("OK", analyticsService.getEventAnalytics(eventId));
    }

    @GetMapping("/universities/{universityId}")
    @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_STAFF')")
    public ApiResponse<UniversityAnalyticsResponse> getUniversityAnalytics(@PathVariable Long universityId) {
        return ApiResponse.ok("OK", analyticsService.getUniversityAnalytics(universityId));
    }

    @GetMapping("/clubs/{clubId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
    public ApiResponse<ClubAnalyticsResponse> getClubAnalytics(@PathVariable Long clubId) {
        return ApiResponse.ok("OK", analyticsService.getClubAnalytics(clubId));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TrendResponse> getParticipationTrends() {
        return ApiResponse.ok("OK", analyticsService.getParticipationTrends());
    }

    @GetMapping("/top-events")
    public ApiResponse<TopEventsResponse> getTopEvents(
            @RequestParam(defaultValue = "month") String period) {
        return ApiResponse.ok("OK", analyticsService.getTopEvents(period));
    }
}
