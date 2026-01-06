package com.etuni.service;

import com.etuni.dto.AuthDtos.*;
import com.etuni.model.UserEntity;
import com.etuni.model.University;
import com.etuni.repository.UniversityRepository;
import com.etuni.repository.UserRepository;
import com.etuni.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

  private final UserRepository userRepo;
  private final UniversityRepository uniRepo;
  private final PasswordEncoder encoder;
  private final JwtUtil jwt;

  public AuthService(UserRepository userRepo, UniversityRepository uniRepo, PasswordEncoder encoder, JwtUtil jwt) {
    this.userRepo = userRepo;
    this.uniRepo = uniRepo;
    this.encoder = encoder;
    this.jwt = jwt;
  }

  public AuthResponse register(RegisterRequest req) {
    userRepo.findByEmail(req.email()).ifPresent(u -> {
      throw new RuntimeException("EMAIL_IN_USE");
    });

    University uni = uniRepo.findById(req.universityId())
        .orElseThrow(() -> new RuntimeException("UNIVERSITY_NOT_FOUND"));

    String role = (req.role() == null || req.role().isBlank()) ? "STUDENT" : req.role().toUpperCase();

    UserEntity u = new UserEntity();
    u.setFullName(req.fullName());
    u.setEmail(req.email().toLowerCase());
    u.setPasswordHash(encoder.encode(req.password()));
    u.setRole(role);

    // Organizer kayıtları admin onaylı kurgulanabilir:
    u.setStatus(role.equals("ORGANIZER") ? "PENDING_APPROVAL" : "ACTIVE");

    u.setUniversity(uni);
    UserEntity saved = userRepo.save(u);

    String token = jwt.generateToken(saved.getId(), saved.getEmail(), saved.getRole());
    return new AuthResponse(token, "Bearer", toView(saved));
  }

  public AuthResponse login(LoginRequest req) {
    UserEntity u = userRepo.findByEmail(req.email().toLowerCase())
        .orElseThrow(() -> new RuntimeException("INVALID_CREDENTIALS"));

    if (!encoder.matches(req.password(), u.getPasswordHash())) {
      throw new RuntimeException("INVALID_CREDENTIALS");
    }
    if (!"ACTIVE".equalsIgnoreCase(u.getStatus())) {
      throw new RuntimeException("USER_NOT_ACTIVE");
    }

    String token = jwt.generateToken(u.getId(), u.getEmail(), u.getRole());
    return new AuthResponse(token, "Bearer", toView(u));
  }

  private UserView toView(UserEntity u) {
    Long uniId = (u.getUniversity() == null) ? null : u.getUniversity().getId();
    return new UserView(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.getStatus(), uniId);
  }
}
