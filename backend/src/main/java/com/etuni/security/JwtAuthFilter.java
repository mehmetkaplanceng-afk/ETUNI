package com.etuni.security;

import com.etuni.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;
  private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

  public JwtAuthFilter(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain) throws ServletException, IOException {

    String auth = request.getHeader("Authorization");
    String token = null;

    if (auth != null && auth.startsWith("Bearer ")) {
      token = auth.substring(7);
    } else if (request.getCookies() != null) {
      for (var cookie : request.getCookies()) {
        if ("jwt_token".equals(cookie.getName())) {
          token = cookie.getValue();
          break;
        }
      }
    }

    if (token != null && !token.isBlank()) {
      try {
        String role = jwtUtil.extractRole(token);
        String subject = jwtUtil.extractSubject(token);

        if (subject != null && SecurityContextHolder.getContext().getAuthentication() == null) {
          List<SimpleGrantedAuthority> authorities = role == null
              ? List.of()
              : List.of(new SimpleGrantedAuthority("ROLE_" + role));
          var principal = subject; // userId
          var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
          authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(authentication);
          logger.debug("JWT_AUTH_SUCCESS: User {} Role {}", subject, role);
        }
      } catch (Exception e) {
        logger.warn("JWT_AUTH_ERROR: {}", e.getMessage(), e);
      }
    }

    filterChain.doFilter(request, response);
  }
}
