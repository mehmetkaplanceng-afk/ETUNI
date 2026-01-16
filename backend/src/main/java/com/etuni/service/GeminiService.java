package com.etuni.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Service for integrating with Google Gemini AI API.
 * Uses the free tier (gemini-1.5-flash) for intelligent chatbot responses.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    private static final String SYSTEM_PROMPT = """
            Sen ETUNI platformunun yapay zeka asistanısın. ETUNI, üniversite öğrencileri için akıllı bir etkinlik yönetimi ve katılım analiz platformudur.

            Platform Özellikleri:
            - Üniversite etkinliklerini keşfetme ve katılma
            - QR kod ile etkinlik check-in
            - Kulüp/topluluk takibi
            - Kişiselleştirilmiş etkinlik önerileri
            - Etkinlik haritası
            - Organizatör paneli (etkinlik oluşturma/yönetme)

            Kuralların:
            1. Her zaman Türkçe yanıt ver
            2. Kısa ve öz cevaplar ver (maksimum 2-3 paragraf)
            3. Nazik ve yardımsever ol
            4. Etkinlikler, platform özellikleri ve üniversite hayatı hakkında sorulara cevap ver
            5. Bilmediğin konularda dürüst ol
            6. Emoji kullanabilirsin ama abartma

            ETKİNLİK LİSTELEME:
            - Sana verilen etkinlik bilgilerini kullanarak kullanıcıya detaylı liste sunabilirsin
            - Kullanıcı "etkinlikleri listele", "ne etkinlikler var", "yaklaşan etkinlikler" gibi sorular sorduğunda verilen etkinlik listesini güzel bir şekilde formatla
            - Her etkinlik için: isim, tarih, saat, konum, tür ve fiyat bilgisini ver
            - Ücretsiz etkinlikler için "Ücretsiz" yaz

            Kullanıcıya her zaman yardımcı olmaya çalış!
            """;

    /**
     * Sends a message to Gemini API and returns the AI response.
     * 
     * @param userMessage  The user's query
     * @param eventContext Optional context about current events (can be null)
     * @return AI-generated response or null if API fails
     */
    public String chat(String userMessage, String eventContext) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured");
            return null;
        }

        try {
            String url = String.format(GEMINI_API_URL, model, apiKey);

            // Build prompt with context
            String fullPrompt = SYSTEM_PROMPT;
            if (eventContext != null && !eventContext.isBlank()) {
                fullPrompt += "\n\nMevcut Etkinlik Bilgisi:\n" + eventContext;
            }
            fullPrompt += "\n\nKullanıcı Sorusu: " + userMessage;

            // Build request body for Gemini API
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "parts", List.of(
                                            Map.of("text", fullPrompt)))),
                    "generationConfig", Map.of(
                            "temperature", 0.7,
                            "maxOutputTokens", 1000,
                            "topP", 0.9));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return extractResponseText(response.getBody());
            }

            log.warn("Gemini API returned non-success status: {}", response.getStatusCode());
            return null;

        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extracts the text content from Gemini API response.
     */
    private String extractResponseText(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode candidates = root.path("candidates");

            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");

                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText();
                }
            }

            log.warn("Could not extract text from Gemini response");
            return null;

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Check if Gemini service is properly configured.
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
