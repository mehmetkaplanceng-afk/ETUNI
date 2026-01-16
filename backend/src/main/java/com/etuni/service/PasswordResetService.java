package com.etuni.service;

import com.etuni.model.PasswordResetToken;
import com.etuni.model.UserEntity;
import com.etuni.repository.PasswordResetTokenRepository;
import com.etuni.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.python-service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Delegates Forgot Password logic to Python Service
     */
    public void createPasswordResetTokenForUser(String email) {
        // We can optionally check if user exists here to avoid unnecessary network
        // call,
        // but for security (timing attacks), it might be better to just forward
        // everything.
        // However, the Python service checks DB anyway.

        try {
            String url = pythonServiceUrl + "/auth/forgot-password";

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("email", email);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            restTemplate.postForObject(url, entity, String.class);
        } catch (Exception e) {
            // Log error but don't leak info
            e.printStackTrace();
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
