package com.etuni.service;

import com.etuni.model.Attendance;
import com.etuni.model.UserEntity;
import com.etuni.repository.AttendanceRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UserRepository;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

  private final UserRepository userRepo;
  private final EventRepository eventRepo;
  private final AttendanceRepository attendanceRepo;

  public RecommendationService(UserRepository userRepo, EventRepository eventRepo,
      AttendanceRepository attendanceRepo) {
    this.userRepo = userRepo;
    this.eventRepo = eventRepo;
    this.attendanceRepo = attendanceRepo;
  }

  /**
   * Açıklanabilir öneri sistemi:
   * 
   * PUANLAMA AĞIRLIKLARI:
   * - İlgi alanı uyumu: 0.30
   * - Tür uyumu (geçmiş katılıma göre): 0.25
   * - Güncellik: 0.20
   * - Popülerlik: 0.15
   * - Kategori uyumu: 0.10
   */
  public List<ScoredEvent> recommend(Long userId) {
    UserEntity user = userRepo.findById(userId)
        .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
    if (user.getUniversity() == null)
      return List.of();

    Long uniId = user.getUniversity().getId();
    var events = eventRepo.findTop20ByUniversityIdAndStatusOrderByEventDateAsc(uniId, "ACTIVE");

    List<String> tags = user.getInterests();

    // Kullanıcının geçmiş katılımlarından tercih edilen türü hesapla
    Map<String, Integer> typePreference = calculateTypePreference(userId);
    String preferredType = getMostPreferredType(typePreference);

    // Popülerlik için katılım sayıları
    Map<Long, Long> eventPopularity = calculateEventPopularity();

    List<ScoredEvent> out = new ArrayList<>();
    for (var e : events) {
      Map<String, Double> breakdown = new LinkedHashMap<>();

      // 1. İlgi alanı uyumu (0.30)
      double interestScore = matchInterests(tags, e.getTitle(), e.getDescription());
      breakdown.put("interestMatch", Math.round(interestScore * 100.0) / 100.0);

      // 2. Tür uyumu - geçmiş katılıma dayalı (0.25)
      double typeScore = calculateTypeScore(e.getEventType(), typePreference, preferredType);
      breakdown.put("typeMatch", Math.round(typeScore * 100.0) / 100.0);

      // 3. Güncellik (0.20)
      double recencyScore = calculateRecency(e.getEventDate());
      breakdown.put("recency", Math.round(recencyScore * 100.0) / 100.0);

      // 4. Popülerlik (0.15)
      double popularityScore = calculatePopularity(e.getId(), eventPopularity);
      breakdown.put("popularity", Math.round(popularityScore * 100.0) / 100.0);

      // 5. Kategori uyumu (0.10)
      double categoryScore = matchCategory(tags, e.getCategory());
      breakdown.put("categoryMatch", Math.round(categoryScore * 100.0) / 100.0);

      // Toplam skor hesapla
      double totalScore = interestScore * 0.30 +
          typeScore * 0.25 +
          recencyScore * 0.20 +
          popularityScore * 0.15 +
          categoryScore * 0.10;

      out.add(new ScoredEvent(
          e.getId(),
          e.getTitle(),
          e.getEventType(),
          e.getEventDate(),
          Math.round(Math.min(1.0, totalScore) * 100.0) / 100.0,
          breakdown,
          generateExplanation(breakdown, e.getTitle())));
    }

    out.sort((a, b) -> Double.compare(b.totalScore(), a.totalScore()));
    return out;
  }

  /**
   * Kullanıcının geçmişte katıldığı etkinlik türlerini analiz et
   */
  private Map<String, Integer> calculateTypePreference(Long userId) {
    List<Attendance> attendances = attendanceRepo.findByUserIdOrderByScannedAtDesc(userId);
    Map<String, Integer> typeCount = new HashMap<>();

    for (Attendance a : attendances) {
      String type = a.getEvent().getEventType();
      if (type != null) {
        typeCount.merge(type.toUpperCase(), 1, Integer::sum);
      }
    }
    return typeCount;
  }

  private String getMostPreferredType(Map<String, Integer> typePreference) {
    return typePreference.entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey)
        .orElse("");
  }

  private double calculateTypeScore(String eventType, Map<String, Integer> prefs, String mostPreferred) {
    if (eventType == null || prefs.isEmpty())
      return 0.0;

    String upperType = eventType.toUpperCase();

    // En çok tercih edilen türle tam eşleşme
    if (upperType.contains(mostPreferred) || mostPreferred.contains(upperType)) {
      return 1.0;
    }

    // Kısmi eşleşme
    for (String preferred : prefs.keySet()) {
      if (upperType.contains(preferred) || preferred.contains(upperType)) {
        return 0.6;
      }
    }

    return 0.0;
  }

  private Map<Long, Long> calculateEventPopularity() {
    Map<Long, Long> popularity = new HashMap<>();
    List<Object[]> counts = attendanceRepo.findEventPopularityCounts();
    for (Object[] row : counts) {
      if (row[0] != null && row[1] != null) {
        popularity.put((Long) row[0], ((Number) row[1]).longValue());
      }
    }
    return popularity;
  }

  private double calculatePopularity(Long eventId, Map<Long, Long> popularity) {
    Long count = popularity.getOrDefault(eventId, 0L);
    if (count == 0)
      return 0.0;

    // En yüksek katılıma göre normalize et
    long max = popularity.values().stream().max(Long::compare).orElse(1L);
    return (double) count / max;
  }

  private double matchInterests(List<String> tags, String title, String desc) {
    if (tags == null || tags.isEmpty())
      return 0.0;

    String t = (title == null ? "" : title.toLowerCase()) + " " + (desc == null ? "" : desc.toLowerCase());

    for (String tag : tags) {
      if (tag.length() >= 3 && t.contains(tag.toLowerCase()))
        return 1.0;
    }
    return 0.0;
  }

  private double matchCategory(List<String> tags, String category) {
    if (category == null || tags == null || tags.isEmpty())
      return 0.0;

    String catLower = category.toLowerCase();
    for (String tag : tags) {
      if (tag.length() >= 3 && catLower.contains(tag.toLowerCase()))
        return 1.0;
    }
    return 0.0;
  }

  private double calculateRecency(LocalDate d) {
    if (d == null)
      return 0.0;
    long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), d);
    if (days < 0)
      return 0.0;
    if (days <= 3)
      return 1.0;
    if (days <= 7)
      return 0.8;
    if (days <= 14)
      return 0.5;
    return 0.2;
  }

  private String generateExplanation(Map<String, Double> breakdown, String title) {
    List<String> reasons = new ArrayList<>();

    if (breakdown.getOrDefault("typeMatch", 0.0) > 0.5) {
      reasons.add("geçmiş katılımlarınla benzer türde");
    }
    if (breakdown.getOrDefault("interestMatch", 0.0) > 0.5) {
      reasons.add("ilgi alanlarınla uyumlu");
    }
    if (breakdown.getOrDefault("recency", 0.0) > 0.7) {
      reasons.add("yakında gerçekleşecek");
    }
    if (breakdown.getOrDefault("popularity", 0.0) > 0.5) {
      reasons.add("popüler bir etkinlik");
    }

    if (reasons.isEmpty())
      return "Bu etkinlik sana uygun olabilir.";
    return "Bu etkinlik " + String.join(", ", reasons) + ".";
  }

  // Açıklanabilir öneri kaydı
  public record ScoredEvent(
      Long eventId,
      String title,
      String eventType,
      LocalDate eventDate,
      double totalScore,
      Map<String, Double> scoreBreakdown,
      String explanation) {
  }
}
