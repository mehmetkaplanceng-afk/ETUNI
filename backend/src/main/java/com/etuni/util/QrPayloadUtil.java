package com.etuni.util;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class QrPayloadUtil {

  private final String secret;
  private final long ttlMinutes;

  public QrPayloadUtil(
      @Value("${etuni.qr.secret}") String secret,
      @Value("${etuni.qr.ttlMinutes:240}") long ttlMinutes
  ) {
    this.secret = secret;
    this.ttlMinutes = ttlMinutes;
  }

  public String generateForEvent(Long eventId) {
    long exp = Instant.now().plusSeconds(ttlMinutes * 60).getEpochSecond();
    String body = eventId + "|" + exp;
    String sig = hmac(body);
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString((body + "|" + sig).getBytes(StandardCharsets.UTF_8));
  }

  public String generateForAttendance(Long attendanceId, String ticketCode) {
    long exp = Instant.now().plusSeconds(ttlMinutes * 60).getEpochSecond();
    String body = attendanceId + "|" + ticketCode + "|" + exp;
    String sig = hmac(body);
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString((body + "|" + sig).getBytes(StandardCharsets.UTF_8));
  }

  public ValidationResult validate(String encoded) {
    try {
      String decoded = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
      String[] parts = decoded.split("\\|");
      if (parts.length == 3) {
        // event payload: eventId|exp|sig
        Long eventId = Long.valueOf(parts[0]);
        long exp = Long.parseLong(parts[1]);
        String sig = parts[2];
        String body = parts[0] + "|" + parts[1];
        if (!hmac(body).equals(sig)) return ValidationResult.invalid("QR_SIGNATURE_INVALID");
        if (Instant.now().getEpochSecond() > exp) return ValidationResult.invalid("QR_EXPIRED");
        return ValidationResult.validEvent(eventId);
      } else if (parts.length == 4) {
        // attendance payload: attendanceId|ticketCode|exp|sig
        Long attendanceId = Long.valueOf(parts[0]);
        String ticketCode = parts[1];
        long exp = Long.parseLong(parts[2]);
        String sig = parts[3];
        String body = parts[0] + "|" + parts[1] + "|" + parts[2];
        if (!hmac(body).equals(sig)) return ValidationResult.invalid("QR_SIGNATURE_INVALID");
        if (Instant.now().getEpochSecond() > exp) return ValidationResult.invalid("QR_EXPIRED");
        return ValidationResult.validAttendance(attendanceId, ticketCode);
      } else {
        return ValidationResult.invalid("QR_FORMAT_INVALID");
      }
    } catch (Exception e) {
      return ValidationResult.invalid("QR_INVALID");
    }
  }

  private String hmac(String data) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] out = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(out);
    } catch (Exception e) {
      throw new IllegalStateException("HMAC_ERROR", e);
    }
  }

  public record ValidationResult(boolean valid, String message, Long eventId, Long attendanceId, String ticketCode) {
    public static ValidationResult validEvent(Long eventId){ return new ValidationResult(true, "OK", eventId, null, null); }
    public static ValidationResult validAttendance(Long attendanceId, String ticketCode){ return new ValidationResult(true, "OK", null, attendanceId, ticketCode); }
    public static ValidationResult invalid(String msg){ return new ValidationResult(false, msg, null, null, null); }
  }
}
