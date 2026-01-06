package com.etuni.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class AnalyticsDtos {

    // Etkinlik Analizi
    public record EventAnalyticsResponse(
            Long eventId,
            String eventTitle,
            String eventType,
            LocalDate eventDate,
            int totalVerifiedAttendance,
            int totalRegistrations) {
    }

    // Üniversite Analizi
    public record UniversityAnalyticsResponse(
            Long universityId,
            String universityName,
            int totalEvents,
            int totalAttendance,
            Map<String, Integer> attendanceByEventType,
            List<TopEventItem> topEvents) {
    }

    // Kulüp Analizi
    public record ClubAnalyticsResponse(
            Long clubId,
            String clubName,
            Long universityId,
            int totalEvents,
            int totalAttendance,
            double averageAttendancePerEvent) {
    }

    // Trend Raporu
    public record TrendResponse(
            Map<String, Integer> attendanceByEventType,
            List<MonthlyTrendItem> monthlyTrends) {
    }

    public record MonthlyTrendItem(
            String month, // "2026-01"
            int eventCount,
            int attendanceCount) {
    }

    public record TopEventItem(
            Long eventId,
            String title,
            int attendanceCount) {
    }

    // En popüler etkinlikler
    public record TopEventsResponse(
            String period,
            List<TopEventItem> events) {
    }
}
