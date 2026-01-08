package com.etuni.controller.chat;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.model.Event;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UniversityRepository;
import com.etuni.service.EventQueryBotService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final EventRepository eventRepo;
    private final UniversityRepository uniRepo;
    private final EventQueryBotService botService;

    public ChatController(EventRepository eventRepo, UniversityRepository uniRepo, EventQueryBotService botService) {
        this.eventRepo = eventRepo;
        this.uniRepo = uniRepo;
        this.botService = botService;
    }

    record ChatRequest(String query) {
    }

    record ChatResponse(String response) {
    }

    @PostMapping("/ask")
    public ApiResponse<ChatResponse> ask(@RequestBody ChatRequest req) {
        String q = req.query();
        if (q == null || q.isBlank()) {
            return ApiResponse.ok("OK", new ChatResponse("Size nasıl yardımcı olabilirim?"));
        }

        String response;

        // Try to get current user for personalized bot response
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            try {
                Long userId = Long.parseLong(auth.getPrincipal().toString());
                response = botService.answer(userId, q);
            } catch (Exception e) {
                response = getFallbackResponse(q);
            }
        } else {
            response = getFallbackResponse(q);
        }

        return ApiResponse.ok("OK", new ChatResponse(response));
    }

    private String getFallbackResponse(String q) {
        q = q.toLowerCase();
        if (q.contains("merhaba") || q.contains("selam")) {
            return "Merhaba! Ben ETUNI Asistan. Size nasıl yardımcı olabilirim? Etkinlikler hakkında bilgi verebilirim.";
        }

        if (q.contains("etkinlik") && (q.contains("var mı") || q.contains("listele"))) {
            List<Event> events = eventRepo.findAll().stream()
                    .filter(e -> "ACTIVE".equals(e.getStatus()))
                    .sorted((e1, e2) -> e2.getEventDate().compareTo(e1.getEventDate()))
                    .limit(3)
                    .collect(Collectors.toList());

            if (events.isEmpty()) {
                return "Şu an planlanmış aktif bir etkinlik bulunmuyor.";
            } else {
                String eventList = events.stream()
                        .map(e -> "- " + e.getTitle() + " (" + e.getEventDate() + ")")
                        .collect(Collectors.joining("\n"));
                return "İşte yaklaşan bazı etkinlikler:\n" + eventList;
            }
        }

        if (q.contains("üniversite")) {
            return "Sistemimizde " + uniRepo.count() + " üniversite kayıtlı. Detaylar için giriş yapmalısın.";
        }

        return "Üzgünüm, bunu tam anlayamadım. Giriş yaparak sana özel önerilerimi görebilir veya etkinlikleri sorgulayabilirsin.";
    }
}
