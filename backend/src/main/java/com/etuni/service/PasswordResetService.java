package com.etuni.service;

import com.etuni.model.PasswordResetToken;
import com.etuni.model.UserEntity;
import com.etuni.repository.PasswordResetTokenRepository;
import com.etuni.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Creates a password reset token and sends the reset email.
     * Returns true if email was sent, false if user not found.
     */
    @Transactional
    public boolean createPasswordResetTokenForUser(String email) {
        var userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.warn("Password reset requested for non-existent email: {}", email);
            return false; // User not found
        }

        UserEntity user = userOpt.get();

        // Delete any existing token for this user (must flush to ensure delete happens
        // before insert)
        tokenRepository.deleteByUser(user);
        tokenRepository.flush();

        // Generate new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(30));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        // Send email
        emailService.sendPasswordResetEmail(user.getEmail(), token);
        log.info("Password reset email sent to: {}", email);

        return true;
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
