package com.etuni.controller;

import com.etuni.dto.AuthDtos.*;
import com.etuni.model.UserEntity;
import com.etuni.repository.UserRepository;
import com.etuni.service.AuthService;
import com.etuni.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final PasswordResetService passwordResetService;
  private final UserRepository userRepository;

  public AuthController(AuthService authService, PasswordResetService passwordResetService,
      UserRepository userRepository) {
    this.authService = authService;
    this.passwordResetService = passwordResetService;
    this.userRepository = userRepository;
  }

  @PostMapping("/register")
  public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
    return ApiResponse.ok("REGISTER_OK", authService.register(req));
  }

  @PostMapping("/login")
  public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req,
      jakarta.servlet.http.HttpServletResponse response) {
    AuthResponse res = authService.login(req);

    // Set HttpOnly cookie for robust web session handling
    jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt_token", res.token());
    cookie.setHttpOnly(true); // Prevent JS access (XSS protection)
    cookie.setSecure(false); // Valid for localhost (set true in production with SSL)
    cookie.setPath("/");
    cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
    response.addCookie(cookie);

    // Set a visible cookie for UI logic (checking if logged in)
    jakarta.servlet.http.Cookie uiCookie = new jakarta.servlet.http.Cookie("is_campus_user", "true");
    uiCookie.setHttpOnly(false); // JS can read this
    uiCookie.setPath("/");
    uiCookie.setMaxAge(7 * 24 * 60 * 60);
    response.addCookie(uiCookie);

    return ApiResponse.ok("LOGIN_OK", res);
  }

  @PostMapping("/logout")
  public ApiResponse<String> logout(jakarta.servlet.http.HttpServletResponse response) {
    // Clear user's push token to prevent duplicate notifications
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated()) {
      try {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user != null) {
          user.setPushToken(null);
          userRepository.save(user);
        }
      } catch (Exception e) {
        // Log but don't fail logout
        System.err.println("Failed to clear push token during logout: " + e.getMessage());
      }
    }

    // Clear security cookie
    jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt_token", null);
    cookie.setHttpOnly(true);
    cookie.setPath("/");
    cookie.setMaxAge(0); // Delete immediately
    response.addCookie(cookie);

    // Clear UI cookie
    jakarta.servlet.http.Cookie uiCookie = new jakarta.servlet.http.Cookie("is_campus_user", null);
    uiCookie.setHttpOnly(false);
    uiCookie.setPath("/");
    uiCookie.setMaxAge(0);
    response.addCookie(uiCookie);

    return ApiResponse.ok("LOGOUT_OK", "Logged out successfully");
  }

  // --- Password Reset ---

  record ForgotPasswordRequest(String email) {
  }

  record ResetPasswordRequest(String token, String newPassword) {
  }

  @PostMapping("/forgot-password")
  public ApiResponse<String> forgotPassword(@RequestBody ForgotPasswordRequest req) {
    boolean sent = passwordResetService.createPasswordResetTokenForUser(req.email());
    if (sent) {
      return ApiResponse.ok("FORGOT_PASSWORD_SENT", "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } else {
      return new ApiResponse<>(false, "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.", null);
    }
  }

  @PostMapping("/reset-password")
  public ApiResponse<String> resetPassword(@RequestBody ResetPasswordRequest req) {
    try {
      passwordResetService.resetPassword(req.token(), req.newPassword());
      return ApiResponse.ok("RESET_PASSWORD_SUCCESS", "Şifreniz başarıyla güncellendi.");
    } catch (RuntimeException e) {
      // In a real app we might want to differentiate, but for now generic error
      // or specific message if safe
      return new ApiResponse<>(false, e.getMessage(), null);
    }
  }
}
