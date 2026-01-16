package com.etuni.controller.chat;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.model.Event;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UniversityRepository;
import com.etuni.repository.UserRepository;
import com.etuni.service.EventQueryBotService;
import com.etuni.service.GeminiService;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final EventRepository eventRepo;
    private final UniversityRepository uniRepo;
    private final UserRepository userRepo;
    private final EventQueryBotService botService;
    private final GeminiService geminiService;

    public ChatController(EventRepository eventRepo, UniversityRepository uniRepo,
            UserRepository userRepo, EventQueryBotService botService, GeminiService geminiService) {
        this.eventRepo = eventRepo;
        this.uniRepo = uniRepo;
        this.userRepo = userRepo;
        this.botService = botService;
        this.geminiService = geminiService;
    }

    record ChatRequest(String query) {
    }

    record ChatResponse(String response) {
    }

    @Transactional(readOnly = true)
    @PostMapping("/ask")
    public ApiResponse<ChatResponse> ask(@RequestBody ChatRequest req) {
        String q = req.query();
        if (q == null || q.isBlank()) {
            return ApiResponse.ok("OK", new ChatResponse("Size nasıl yardımcı olabilirim?"));
        }

        String response;

        // Try Gemini AI first if configured
        if (geminiService.isConfigured()) {
            try {
                // Build event context for the AI (university-specific if user is logged in)
                Long userId = getAuthenticatedUserId();
                String eventContext = buildEventContext(userId);
                response = geminiService.chat(q, eventContext);

                if (response != null && !response.isBlank()) {
                    log.info("Gemini AI response generated successfully");
                    return ApiResponse.ok("OK", new ChatResponse(response));
                }
            } catch (Exception e) {
                log.warn("Gemini AI failed, falling back to rule-based bot: {}", e.getMessage());
            }
        }

        // Fallback to existing rule-based bot
        Long userId = getAuthenticatedUserId();
        if (userId != null) {
            try {
                response = botService.answer(userId, q);
            } catch (Exception e) {
                response = getFallbackResponse(q);
            }
        } else {
            response = getFallbackResponse(q);
        }

        return ApiResponse.ok("OK", new ChatResponse(response));
    }

    /**
     * Builds context about current events to give to the AI.
     */
    @Transactional(readOnly = true)
    private String buildEventContext(Long userId) {
        try {
            List<Event> activeEvents;
            if (userId != null) {
                var user = userRepo.findById(userId).orElse(null);
                if (user != null && user.getUniversity() != null) {
                    // Fetch university-specific events first
                    activeEvents = eventRepo.findTop20ByUniversityIdAndStatusOrderByEventDateDesc(
                            user.getUniversity().getId(), "ACTIVE");
                } else {
                    activeEvents = eventRepo.findAllActiveWithClubs();
                }
            } else {
                activeEvents = eventRepo.findAllActiveWithClubs();
            }

            // Limit to 15 events for context to avoid token limits but give enough info
            if (activeEvents.size() > 15) {
                activeEvents = activeEvents.subList(0, 15);
            }

            if (activeEvents.isEmpty()) {
                log.warn("No active events found for chat context (userId: {})", userId);
                return "Şu an sistemde aktif etkinlik bulunmuyor.";
            }

            StringBuilder sb = new StringBuilder("MEVCUT AKTİF ETKİNLİKLER (" + activeEvents.size() + " adet):\n\n");
            int index = 1;
            for (Event e : activeEvents) {
                sb.append(index++).append(". ").append(e.getTitle()).append("\n");
                sb.append("   📅 Tarih: ").append(e.getEventDate());
                if (e.getStartTime() != null) {
                    sb.append(" Saat: ").append(e.getStartTime());
                }
                sb.append("\n");
                sb.append("   📍 Konum: ").append(e.getLocation() != null ? e.getLocation() : "Belirtilmemiş")
                        .append("\n");
                sb.append("   🏷️ Tür: ").append(e.getEventType() != null ? e.getEventType() : "Genel").append("\n");
                sb.append("   💰 Fiyat: ").append(
                        e.getPrice() != null && e.getPrice().doubleValue() > 0 ? e.getPrice() + "₺" : "Ücretsiz")
                        .append("\n");
                if (e.getClub() != null) {
                    sb.append("   🎭 Organizatör: ").append(e.getClub().getName()).append("\n");
                }
                if (e.getDescription() != null && !e.getDescription().isBlank()) {
                    String desc = e.getDescription().length() > 100 ? e.getDescription().substring(0, 100) + "..."
                            : e.getDescription();
                    sb.append("   📝 Açıklama: ").append(desc).append("\n");
                }
                sb.append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error building event context: {}", e.getMessage());
            return "";
        }
    }

    private Long getAuthenticatedUserId() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            try {
                return Long.parseLong(auth.getPrincipal().toString());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
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
