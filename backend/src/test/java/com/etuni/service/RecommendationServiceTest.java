package com.etuni.service;

import com.etuni.model.Event;
import com.etuni.model.University;
import com.etuni.model.UserEntity;
import com.etuni.repository.AttendanceRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private EventRepository eventRepo;

    @Mock
    private AttendanceRepository attendanceRepo;

    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(userRepo, eventRepo, attendanceRepo);
    }

    @Test
    @DisplayName("Kullanıcı bulunamadığında exception fırlatmalı")
    void recommend_userNotFound_throwsException() {
        when(userRepo.findById(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> recommendationService.recommend(1L));
    }

    @Test
    @DisplayName("Üniversite seçilmemiş kullanıcı için boş liste dönmeli")
    void recommend_noUniversitySelected_returnsEmptyList() {
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setUniversity(null);

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        var result = recommendationService.recommend(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Etkinlikler skor değerine göre sıralanmalı")
    void recommend_eventsAreSortedByScore() {
        // Arrange
        University uni = new University();
        uni.setId(1L);

        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setUniversity(uni);
        user.setInterests(java.util.List.of("teknik", "yazılım"));

        Event technicalEvent = new Event();
        technicalEvent.setId(1L);
        technicalEvent.setTitle("Yazılım Workshop");
        technicalEvent.setDescription("Teknik eğitim etkinliği");
        technicalEvent.setEventType("TECHNICAL");
        technicalEvent.setEventDate(LocalDate.now().plusDays(2));

        Event socialEvent = new Event();
        socialEvent.setId(2L);
        socialEvent.setTitle("Sosyal Buluşma");
        socialEvent.setDescription("Tanışma etkinliği");
        socialEvent.setEventType("SOCIAL");
        socialEvent.setEventDate(LocalDate.now().plusDays(10));

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(eventRepo.findTop20ByUniversityIdAndStatusOrderByEventDateAsc(1L, "ACTIVE"))
                .thenReturn(List.of(socialEvent, technicalEvent)); // Ters sırada
        when(attendanceRepo.findByUserIdOrderByScannedAtDesc(1L)).thenReturn(List.of());
        when(attendanceRepo.findAll()).thenReturn(List.of());

        // Act
        var result = recommendationService.recommend(1L);

        // Assert
        assertFalse(result.isEmpty());
        // Technical event should score higher due to interest match
        assertEquals("Yazılım Workshop", result.get(0).title());
    }

    @Test
    @DisplayName("Öneri açıklaması skor dökümü içermeli")
    void recommend_includesScoreBreakdown() {
        University uni = new University();
        uni.setId(1L);

        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setUniversity(uni);
        user.setInterests(java.util.List.of("teknik"));

        Event event = new Event();
        event.setId(1L);
        event.setTitle("Teknik Seminer");
        event.setEventType("TECHNICAL");
        event.setEventDate(LocalDate.now().plusDays(3));

        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(eventRepo.findTop20ByUniversityIdAndStatusOrderByEventDateAsc(1L, "ACTIVE"))
                .thenReturn(List.of(event));
        when(attendanceRepo.findByUserIdOrderByScannedAtDesc(1L)).thenReturn(List.of());
        when(attendanceRepo.findAll()).thenReturn(List.of());

        var result = recommendationService.recommend(1L);

        assertFalse(result.isEmpty());
        assertNotNull(result.get(0).scoreBreakdown());
        assertTrue(result.get(0).scoreBreakdown().containsKey("interestMatch"));
        assertTrue(result.get(0).scoreBreakdown().containsKey("typeMatch"));
        assertTrue(result.get(0).scoreBreakdown().containsKey("recency"));
        assertTrue(result.get(0).scoreBreakdown().containsKey("popularity"));
    }
}
