package com.etuni.service;

import com.etuni.model.PasswordResetToken;
import com.etuni.model.UserEntity;
import com.etuni.repository.PasswordResetTokenRepository;
import com.etuni.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${server.port}")
    private String serverPort;

    // In production, this should be a configured domain URL
    private String getBaseUrl() {
        return "http://localhost:" + serverPort;
    }

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void createPasswordResetTokenForUser(String email) {
        // Silently fail if user not found to prevent enumeration
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return;
        }

        UserEntity user = userOpt.get();

        // Invalidate existing tokens for this user? Optional, but good practice to
        // clean up
        // We can just create a new one.

        String token = UUID.randomUUID().toString();
        PasswordResetToken myToken = new PasswordResetToken(token, user, LocalDateTime.now().plusMinutes(30));
        tokenRepository.save(myToken);

        sendResetTokenEmail(user, token);
    }

    private void sendResetTokenEmail(UserEntity user, String token) {
        String resetUrl = getBaseUrl() + "/reset-password?token=" + token;
        String subject = "Şifre Sıfırlama İsteği - ETUNI";

        String htmlContent = String.format(
                "<html>" +
                        "<body>" +
                        "<h3>Merhaba %s,</h3>" +
                        "<p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>" +
                        "<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>" +
                        "<p><a href=\"%s\">Şifremi Sıfırla</a></p>" +
                        "<p>Bu bağlantı 30 dakika süreyle geçerlidir.</p>" +
                        "<p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>" +
                        "<br/>" +
                        "<p>ETUNI Ekibi</p>" +
                        "</body>" +
                        "</html>",
                user.getFullName(), resetUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("mehmetkaplanceng@gmail.com");
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
            // Log error but don't throw to user
        }
    }

    @Transactional
    public boolean validatePasswordResetToken(String token) {
        var passTokenOpt = tokenRepository.findByToken(token);
        if (passTokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetToken passToken = passTokenOpt.get();
        if (passToken.isUsed() || isTokenExpired(passToken)) {
            return false;
        }

        return true;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        var passTokenOpt = tokenRepository.findByToken(token);
        if (passTokenOpt.isEmpty()) {
            throw new RuntimeException("Geçersiz token");
        }

        PasswordResetToken passToken = passTokenOpt.get();
        if (passToken.isUsed() || isTokenExpired(passToken)) {
            throw new RuntimeException("Token süresi dolmuş veya kullanılmış");
        }

        UserEntity user = passToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passToken.setUsed(true);
        tokenRepository.save(passToken);
    }

    private boolean isTokenExpired(PasswordResetToken passToken) {
        return passToken.getExpiryDate().isBefore(LocalDateTime.now());
    }
}
