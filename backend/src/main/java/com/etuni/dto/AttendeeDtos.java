package com.etuni.dto;

import java.time.LocalDateTime;

public class AttendeeDtos {

  public record AttendeeInfo(
      Long attendanceId,
      Long userId,
      String userFullName,
      String userEmail,
      LocalDateTime scannedAt,
      String ticketCode) {
  }

}
