package com.etuni.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

/**
 * Email service for sending notifications, reminders, and password resets.
 * Now delegates to the Python Microservice.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.python-service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    @Value("${app.name:ETUNI}")
    private String appName;

    /**
     * Send email via Python Service
     */
    @Async
    private void sendEmailViaPython(String to, String subject, String body, boolean isHtml) {
        try {
            String url = pythonServiceUrl + "/email/send";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("to", to);
            requestBody.put("subject", subject);
            requestBody.put("body", body);
            requestBody.put("is_html", isHtml);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            restTemplate.postForObject(url, entity, String.class);
            log.info("Email sent via Python service to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendSimpleEmail(String to, String subject, String body) {
        sendEmailViaPython(to, subject, body, false);
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        sendEmailViaPython(to, subject, htmlContent, true);
    }

    @Async
    public void sendWelcomeEmail(String to, String userName) {
        String subject = appName + "'e Hoş Geldiniz!";
        String body = String.format("""
                Merhaba %s,

                %s platformuna hoş geldiniz!

                Artık üniversitenizdeki etkinlikleri takip edebilir,
                katılım kaydı yapabilir ve QR kod ile check-in yapabilirsiniz.

                Keyifli kullanımlar dileriz!

                %s Ekibi
                """, userName, appName, appName);

        sendSimpleEmail(to, subject, body);
    }

    @Async
    public void sendEventReminder(String to, String userName, String eventTitle,
            String eventDate, String eventTime) {
        String subject = "Etkinlik Hatırlatma: " + eventTitle;
        String body = String.format("""
                Merhaba %s,

                Kayıt olduğunuz "%s" etkinliği yaklaşıyor!

                📅 Tarih: %s
                🕐 Saat: %s

                Etkinlikte görüşmek üzere!

                %s Ekibi
                """, userName, eventTitle, eventDate, eventTime, appName);

        sendSimpleEmail(to, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String to, String resetToken) {
        // Obsolete? Python handles this now inside /auth/forgot-password?
        // Wait, if we use the Python endpoint strictly for forgot-password logic
        // (token+email),
        // this method might not be needed OR logic in PasswordResetService changes.
        // But for safety/compatibility let's keep it working as a generic send for now
        // if ever called manually.

        String subject = appName + " - Şifre Sıfırlama";
        String resetLink = "http://13.53.170.220:8080/reset-password?token=" + resetToken;
        String body = String.format("""
                Merhaba,

                Şifre sıfırlama talebiniz alınmıştır.

                Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
                %s

                Bu bağlantı 30 dakika geçerlidir.

                Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin.

                %s Ekibi
                """, resetLink, appName);

        sendSimpleEmail(to, subject, body);
    }

    @Async
    public void sendPromotionApprovalEmail(String to, String userName) {
        String subject = appName + " - Organizatör Başvurunuz Onaylandı!";
        String body = String.format("""
                Merhaba %s,

                Tebrikler! Organizatör başvurunuz onaylanmıştır.

                Artık etkinlik oluşturabilir ve yönetebilirsiniz.

                Başarılı etkinlikler dileriz!

                %s Ekibi
                """, userName, appName);

        sendSimpleEmail(to, subject, body);
    }

    @Async
    public void sendPromotionRejectionEmail(String to, String userName, String reason) {
        String subject = appName + " - Organizatör Başvuru Sonucu";
        String body = String.format("""
                Merhaba %s,

                Organizatör başvurunuz incelenmiş olup maalesef onaylanamamıştır.

                Sebep: %s

                Daha sonra tekrar başvurabilirsiniz.

                %s Ekibi
                """, userName, reason != null ? reason : "Belirtilmedi", appName);

        sendSimpleEmail(to, subject, body);
    }
}
