package com.etuni.controller;

import com.etuni.dto.AuthDtos.*;
import com.etuni.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
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
}
