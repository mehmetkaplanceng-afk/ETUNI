package com.etuni.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

@Service
public class PushNotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private final RestTemplate restTemplate;

    public PushNotificationService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send push notification via Expo Push Notification service
     * 
     * @param pushToken Expo push token (starts with ExponentPushToken[...])
     * @param title     Notification title
     * @param body      Notification body/message
     */
    public void sendPushNotification(String pushToken, String title, String body) {
        if (pushToken == null || pushToken.trim().isEmpty()) {
            return; // No token, skip
        }

        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("to", pushToken);
            notification.put("sound", "default");
            notification.put("title", title);
            notification.put("body", body);
            notification.put("priority", "high");
            notification.put("channelId", "default");

            // Optional: Add data payload
            Map<String, String> data = new HashMap<>();
            data.put("type", "organizer_approval");
            notification.put("data", data);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("Accept-Encoding", "gzip, deflate");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(notification, headers);

            restTemplate.postForEntity(EXPO_PUSH_URL, request, String.class);

            System.out.println(
                    "Push notification sent to: " + pushToken.substring(0, Math.min(20, pushToken.length())) + "...");
        } catch (Exception e) {
            // Don't fail if push notification fails, just log
            System.err.println("Failed to send push notification: " + e.getMessage());
        }
    }
}
