package com.etuni.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email service for sending notifications, reminders, and password resets.
 * All email operations are async to prevent blocking.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@etuni.com}")
    private String fromEmail;

    @Value("${app.name:ETUNI}")
    private String appName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send a simple text email
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Simple email sent to: {}", to);
        } catch (MailException e) {
            log.error("Failed to send simple email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send an HTML email
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("HTML email sent to: {}", to);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Send welcome email to new users
     */
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

    /**
     * Send event reminder email
     */
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

    /**
     * Send password reset email
     */
    @Async
    public void sendPasswordResetEmail(String to, String resetToken) {
        String subject = appName + " - Şifre Sıfırlama";
        String resetLink = "https://etuni.com/reset-password?token=" + resetToken;
        String body = String.format("""
                Merhaba,

                Şifre sıfırlama talebiniz alınmıştır.

                Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
                %s

                Bu bağlantı 1 saat geçerlidir.

                Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin.

                %s Ekibi
                """, resetLink, appName);

        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send organizer promotion approval notification
     */
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

    /**
     * Send organizer promotion rejection notification
     */
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
