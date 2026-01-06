package com.etuni.dto;

import jakarta.validation.constraints.*;

public class AuthDtos {

  public record RegisterRequest(
      @NotBlank(message = "Ad soyad boş olamaz") @Size(min = 2, max = 100, message = "Ad soyad 2-100 karakter arasında olmalıdır") String fullName,

      @NotBlank(message = "E-posta adresi boş olamaz") @Email(message = "Geçerli bir e-posta adresi giriniz") @Size(max = 255, message = "E-posta adresi çok uzun") String email,

      @NotBlank(message = "Şifre boş olamaz") @Size(min = 8, max = 100, message = "Şifre 8-100 karakter arasında olmalıdır") @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", message = "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir") String password,

      @NotNull(message = "Üniversite seçilmelidir") Long universityId,

      @Pattern(regexp = "^(STUDENT|ORGANIZER)?$", message = "Geçersiz rol") String role) {
  }

  public record LoginRequest(
      @NotBlank(message = "E-posta adresi boş olamaz") @Email(message = "Geçerli bir e-posta adresi giriniz") String email,

      @NotBlank(message = "Şifre boş olamaz") String password) {
  }

  public record UserView(
      Long id,
      String fullName,
      String email,
      String role,
      String status,
      Long universityId) {
  }

  public record AuthResponse(
      String token,
      String type,
      UserView user) {
  }

  public record ApiResponse<T>(boolean success, String message, T data) {
    public static <T> ApiResponse<T> ok(String msg, T data) {
      return new ApiResponse<>(true, msg, data);
    }

    public static <T> ApiResponse<T> ok(T data) {
      return new ApiResponse<>(true, "İşlem başarılı", data);
    }

    public static <T> ApiResponse<T> fail(String msg) {
      return new ApiResponse<>(false, msg, null);
    }
  }
}
