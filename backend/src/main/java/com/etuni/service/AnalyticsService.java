package com.etuni.service;

import com.etuni.dto.AnalyticsDtos.*;
import com.etuni.model.Attendance;
import com.etuni.model.Club;
import com.etuni.model.Event;
import com.etuni.model.University;
import com.etuni.repository.AttendanceRepository;
import com.etuni.repository.ClubRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UniversityRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private final EventRepository eventRepo;
    private final AttendanceRepository attendanceRepo;
    private final UniversityRepository universityRepo;
    private final ClubRepository clubRepo;

    public AnalyticsService(EventRepository eventRepo, AttendanceRepository attendanceRepo,
            UniversityRepository universityRepo, ClubRepository clubRepo) {
        this.eventRepo = eventRepo;
        this.attendanceRepo = attendanceRepo;
        this.universityRepo = universityRepo;
        this.clubRepo = clubRepo;
    }

    /**
     * Tek etkinlik analizi: QR doğrulamalı gerçek katılım sayısı
     */
    public EventAnalyticsResponse getEventAnalytics(Long eventId) {
        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new RuntimeException("EVENT_NOT_FOUND"));

        List<Attendance> attendances = attendanceRepo.findByEventId(eventId);
        int verified = (int) attendances.stream().filter(Attendance::isVerified).count();

        return new EventAnalyticsResponse(
                event.getId(),
                event.getTitle(),
                event.getEventType(),
                event.getEventDate(),
                verified,
                attendances.size());
    }

    /**
     * Üniversite bazlı rapor
     */
    public UniversityAnalyticsResponse getUniversityAnalytics(Long universityId) {
        University uni = universityRepo.findById(universityId)
                .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));

        List<Event> events = eventRepo.findByUniversityId(universityId);
        List<Attendance> attendances = attendanceRepo.findVerifiedByUniversity(universityId);

        // Etkinlik türüne göre katılım
        Map<String, Integer> byType = new HashMap<>();
        for (Attendance a : attendances) {
            String type = a.getEvent().getEventType();
            byType.merge(type, 1, Integer::sum);
        }

        // En popüler etkinlikler
        Map<Long, Integer> eventCounts = new HashMap<>();
        Map<Long, String> eventTitles = new HashMap<>();
        for (Attendance a : attendances) {
            Long eid = a.getEvent().getId();
            eventCounts.merge(eid, 1, Integer::sum);
            eventTitles.put(eid, a.getEvent().getTitle());
        }

        List<TopEventItem> topEvents = eventCounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(e -> new TopEventItem(e.getKey(), eventTitles.get(e.getKey()), e.getValue()))
                .toList();

        return new UniversityAnalyticsResponse(
                uni.getId(),
                uni.getName(),
                events.size(),
                attendances.size(),
                byType,
                topEvents);
    }

    /**
     * Kulüp bazlı rapor
     */
    public ClubAnalyticsResponse getClubAnalytics(Long clubId) {
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new RuntimeException("CLUB_NOT_FOUND"));

        List<Event> events = eventRepo.findByClubId(clubId);
        List<Attendance> attendances = attendanceRepo.findVerifiedByClub(clubId);

        double avg = events.isEmpty() ? 0 : (double) attendances.size() / events.size();

        return new ClubAnalyticsResponse(
                club.getId(),
                club.getName(),
                club.getUniversity().getId(),
                events.size(),
                attendances.size(),
                Math.round(avg * 100.0) / 100.0);
    }

    /**
     * Genel katılım trendleri
     */
    public TrendResponse getParticipationTrends() {
        // Etkinlik türüne göre
        List<Object[]> typeResults = attendanceRepo.countByEventType();
        Map<String, Integer> byType = new HashMap<>();
        for (Object[] row : typeResults) {
            String type = (String) row[0];
            Long count = (Long) row[1];
            byType.put(type != null ? type : "UNKNOWN", count.intValue());
        }

        // Aylık trend (son 6 ay)
        List<Attendance> allAttendances = attendanceRepo.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, int[]> monthly = new TreeMap<>();

        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);

        for (Attendance a : allAttendances) {
            if (a.getScannedAt() != null && a.getScannedAt().toLocalDate().isAfter(sixMonthsAgo)) {
                String month = a.getScannedAt().format(formatter);
                monthly.computeIfAbsent(month, k -> new int[] { 0, 0 });
                monthly.get(month)[1]++;
            }
        }

        // Aylık etkinlik sayısı
        List<Event> allEvents = eventRepo.findAll();
        for (Event e : allEvents) {
            if (e.getEventDate() != null && e.getEventDate().isAfter(sixMonthsAgo)) {
                String month = e.getEventDate().format(formatter);
                monthly.computeIfAbsent(month, k -> new int[] { 0, 0 });
                monthly.get(month)[0]++;
            }
        }

        List<MonthlyTrendItem> trends = monthly.entrySet().stream()
                .map(e -> new MonthlyTrendItem(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        return new TrendResponse(byType, trends);
    }

    /**
     * En popüler etkinlikler
     */
    public TopEventsResponse getTopEvents(String period) {
        LocalDate start;
        if ("week".equalsIgnoreCase(period)) {
            start = LocalDate.now().minusWeeks(1);
        } else if ("month".equalsIgnoreCase(period)) {
            start = LocalDate.now().minusMonths(1);
        } else {
            start = LocalDate.now().minusMonths(3);
        }

        List<Attendance> attendances = attendanceRepo.findAll().stream()
                .filter(a -> a.isVerified() && a.getScannedAt() != null
                        && a.getScannedAt().toLocalDate().isAfter(start))
                .toList();

        Map<Long, Integer> counts = new HashMap<>();
        Map<Long, String> titles = new HashMap<>();
        for (Attendance a : attendances) {
            Long eid = a.getEvent().getId();
            counts.merge(eid, 1, Integer::sum);
            titles.put(eid, a.getEvent().getTitle());
        }

        List<TopEventItem> top = counts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(10)
                .map(e -> new TopEventItem(e.getKey(), titles.get(e.getKey()), e.getValue()))
                .toList();

        return new TopEventsResponse(period, top);
    }
}
