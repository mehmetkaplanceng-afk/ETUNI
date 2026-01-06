package com.etuni.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

  private final Key key;
  private final long accessMinutes;

  public JwtUtil(
      @Value("${etuni.jwt.secret}") String secret,
      @Value("${etuni.jwt.accessTokenMinutes:120}") long accessMinutes) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.accessMinutes = accessMinutes;
  }

  public String generateToken(Long userId, String email, String role) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(accessMinutes * 60);

    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claims(Map.of("email", email, "role", role))
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(key)
        .compact();
  }

  public String extractSubject(String token) {
    if (token == null || token.chars().filter(ch -> ch == '.').count() != 2)
      return null;
    try {
      return Jwts.parser().verifyWith((javax.crypto.SecretKey) key).build()
          .parseSignedClaims(token).getPayload().getSubject();
    } catch (Exception e) {
      return null;
    }
  }

  public String extractRole(String token) {
    if (token == null || token.chars().filter(ch -> ch == '.').count() != 2)
      return null;
    try {
      Object role = Jwts.parser().verifyWith((javax.crypto.SecretKey) key).build()
          .parseSignedClaims(token).getPayload().get("role");
      return role == null ? null : role.toString();
    } catch (Exception e) {
      return null;
    }
  }
}
