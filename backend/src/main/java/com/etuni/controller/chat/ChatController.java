package com.etuni.controller.chat;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.model.Event;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UniversityRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final EventRepository eventRepo;
    private final UniversityRepository uniRepo;

    public ChatController(EventRepository eventRepo, UniversityRepository uniRepo) {
        this.eventRepo = eventRepo;
        this.uniRepo = uniRepo;
    }

    record ChatRequest(String query) {
    }

    record ChatResponse(String response) {
    }

    @PostMapping("/ask")
    public ApiResponse<ChatResponse> ask(@RequestBody ChatRequest req) {
        String q = req.query().toLowerCase();
        String response = "Üzgünüm, bunu tam anlayamadım. Etkinlikler, üniversiteler veya öneriler hakkında sorabilirsin.";

        if (q.contains("merhaba") || q.contains("selam")) {
            response = "Merhaba! Size nasıl yardımcı olabilirim? Etkinlikler hakkında bilgi verebilirim.";
        } else if (q.contains("etkinlik") && (q.contains("var mı") || q.contains("listele"))) {
            // List latest 3 events
            List<Event> events = eventRepo.findAll().stream()
                    .filter(e -> "ACTIVE".equals(e.getStatus()))
                    .sorted((e1, e2) -> e2.getEventDate().compareTo(e1.getEventDate()))
                    .limit(3)
                    .collect(Collectors.toList());

            if (events.isEmpty()) {
                response = "Şu an planlanmış aktif bir etkinlik bulunmuyor.";
            } else {
                String eventList = events.stream()
                        .map(e -> "- " + e.getTitle() + " (" + e.getEventDate() + ")")
                        .collect(Collectors.joining("\n"));
                response = "İşte yaklaşan bazı etkinlikler:\n" + eventList;
            }
        } else if (q.contains("üniversite") && q.contains("hangi")) {
            long count = uniRepo.count();
            response = "Sistemimizde şu an " + count + " üniversite kayıtlı.";
        } else if (q.contains("teknik") || q.contains("teknoloji")) {
            long count = eventRepo.findAll().stream()
                    .filter(e -> "Teknoloji".equalsIgnoreCase(e.getCategory()) && "ACTIVE".equals(e.getStatus()))
                    .count();
            response = "Şu an sistemde " + count
                    + " adet teknoloji odaklı etkinlik var. 'Etkinlikler' sayfasından detaylara bakabilirsin.";
        }

        return ApiResponse.ok("OK", new ChatResponse(response));
    }
}
