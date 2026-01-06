package com.etuni.service;

import com.etuni.model.Attendance;
import com.etuni.model.Event;
import com.etuni.model.UserEntity;
import com.etuni.repository.AttendanceRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EventQueryBotService {

  private final UserRepository userRepo;
  private final EventRepository eventRepo;
  private final AttendanceRepository attendanceRepo;
  private final RecommendationService recommendationService;
  private final AnalyticsService analyticsService;

  public EventQueryBotService(UserRepository userRepo, EventRepository eventRepo,
      AttendanceRepository attendanceRepo,
      RecommendationService recommendationService,
      AnalyticsService analyticsService) {
    this.userRepo = userRepo;
    this.eventRepo = eventRepo;
    this.attendanceRepo = attendanceRepo;
    this.recommendationService = recommendationService;
    this.analyticsService = analyticsService;
  }

  /**
   * Chatbot: yalnızca sistem içi veri sorgusu.
   * Desteklenen intent'ler:
   * 1. "bu hafta teknik etkinlik var mı" -> Bu hafta aralığında eventType içinde
   * "TECH" arar
   * 2. "bana etkinlik önerir misin" -> RecommendationService çağır
   * 3. "en çok katılım alan etkinlik" -> AnalyticsService çağır
   * 4. "daha önce katıldığım etkinlikler" -> Katılım geçmişi döndür
   * 5. "benzer etkinlikler öner" -> Geçmiş katılıma göre öneri
   */
  public String answer(Long userId, String question) {
    UserEntity user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
    if (user.getUniversity() == null)
      return "Önce üniversite seçmelisin.";

    String q = question == null ? "" : question.toLowerCase();
    Long uniId = user.getUniversity().getId();

    // Intent detection
    if (containsAny(q, "öner", "öneri", "tavsiye", "recommend")) {
      return handleRecommendation(userId);
    }

    if (containsAny(q, "katıldığım", "geçmiş", "daha önce", "history")) {
      return handleAttendanceHistory(userId);
    }

    if (containsAny(q, "en çok katılım", "popüler", "en popüler", "top")) {
      return handleTopEvents();
    }

    if (containsAny(q, "benzer", "similar")) {
      return handleSimilarEvents(userId);
    }

    // Default: haftalık etkinlik arama
    return handleWeeklyEventSearch(uniId, q);
  }

  private boolean containsAny(String text, String... keywords) {
    for (String kw : keywords) {
      if (text.contains(kw))
        return true;
    }
    return false;
  }

  private String handleRecommendation(Long userId) {
    var recommendations = recommendationService.recommend(userId);
    if (recommendations.isEmpty()) {
      return "Şu an sana uygun etkinlik bulunamadı.";
    }

    StringBuilder sb = new StringBuilder("Sana önerilen etkinlikler:\n");
    int count = 0;
    for (var rec : recommendations) {
      if (count >= 3)
        break;
      sb.append("• ").append(rec.title())
          .append(" (").append(rec.eventDate()).append(")")
          .append(" - ").append(rec.explanation())
          .append("\n");
      count++;
    }
    return sb.toString().trim();
  }

  private String handleAttendanceHistory(Long userId) {
    List<Attendance> attendances = attendanceRepo.findByUserIdOrderByScannedAtDesc(userId);
    if (attendances.isEmpty()) {
      return "Henüz herhangi bir etkinliğe katılmadın.";
    }

    StringBuilder sb = new StringBuilder("Katıldığın etkinlikler:\n");
    int count = 0;
    for (Attendance a : attendances) {
      if (count >= 5)
        break;
      sb.append("• ").append(a.getEvent().getTitle())
          .append(" (").append(a.getScannedAt().toLocalDate()).append(")")
          .append("\n");
      count++;
    }
    return sb.toString().trim();
  }

  private String handleTopEvents() {
    var topEvents = analyticsService.getTopEvents("month");
    if (topEvents.events().isEmpty()) {
      return "Bu ay için yeterli katılım verisi bulunamadı.";
    }

    StringBuilder sb = new StringBuilder("Bu ay en çok katılım alan etkinlikler:\n");
    int count = 0;
    for (var e : topEvents.events()) {
      if (count >= 3)
        break;
      sb.append("• ").append(e.title())
          .append(" - ").append(e.attendanceCount()).append(" katılımcı")
          .append("\n");
      count++;
    }
    return sb.toString().trim();
  }

  private String handleSimilarEvents(Long userId) {
    // Geçmiş katılımlara göre benzer etkinlik öner
    List<Attendance> attendances = attendanceRepo.findByUserIdOrderByScannedAtDesc(userId);
    if (attendances.isEmpty()) {
      return "Henüz katıldığın etkinlik olmadığı için benzer etkinlik öneremiyorum.";
    }

    // En son katıldığı etkinlik türüne göre
    String lastType = attendances.get(0).getEvent().getEventType();
    var recommendations = recommendationService.recommend(userId);

    var similar = recommendations.stream()
        .filter(r -> r.eventType() != null && r.eventType().equalsIgnoreCase(lastType))
        .limit(3)
        .toList();

    if (similar.isEmpty()) {
      return "Benzer etkinlik bulunamadı.";
    }

    StringBuilder sb = new StringBuilder("Son katıldığın etkinliğe benzer etkinlikler:\n");
    for (var e : similar) {
      sb.append("• ").append(e.title())
          .append(" (").append(e.eventDate()).append(")")
          .append("\n");
    }
    return sb.toString().trim();
  }

  private String handleWeeklyEventSearch(Long uniId, String q) {
    LocalDate now = LocalDate.now();
    LocalDate start = now;
    LocalDate end = now.plusDays(7);

    boolean wantsTechnical = containsAny(q, "teknik", "technical", "yazılım", "yazilim", "tech");
    boolean wantsSocial = containsAny(q, "sosyal", "social", "eğlence");
    boolean wantsWorkshop = containsAny(q, "workshop", "atölye", "seminer");

    List<Event> events = eventRepo.findByUniversityIdAndEventDateBetweenAndStatus(uniId, start, end, "ACTIVE");

    if (wantsTechnical) {
      events = events.stream()
          .filter(e -> e.getEventType() != null && e.getEventType().toLowerCase().contains("tech"))
          .toList();
    } else if (wantsSocial) {
      events = events.stream()
          .filter(e -> e.getEventType() != null && e.getEventType().toLowerCase().contains("social"))
          .toList();
    } else if (wantsWorkshop) {
      events = events.stream()
          .filter(e -> e.getEventType() != null &&
              (e.getEventType().toLowerCase().contains("workshop") ||
                  e.getEventType().toLowerCase().contains("seminar")))
          .toList();
    }

    if (events.isEmpty()) {
      return "Bu hafta kriterlerine uygun etkinlik bulunamadı.";
    }

    StringBuilder sb = new StringBuilder("Bu hafta bulunan etkinlikler:\n");
    int count = 0;
    for (Event e : events) {
      if (count >= 5)
        break;
      sb.append("• ").append(e.getTitle())
          .append(" (").append(e.getEventDate())
          .append(" ").append(e.getStartTime() != null ? e.getStartTime() : "").append(")")
          .append("\n");
      count++;
    }
    return sb.toString().trim();
  }
}
