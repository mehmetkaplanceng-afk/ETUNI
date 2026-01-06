package com.etuni.controller;

import com.etuni.dto.AttendanceDtos.*;
import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.model.Attendance;
import com.etuni.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

  private final AttendanceService attendanceService;

  public AttendanceController(AttendanceService attendanceService) {
    this.attendanceService = attendanceService;
  }

  @PostMapping("/join/{eventId}")
  public ApiResponse<String> join(@PathVariable("eventId") Long eventId) {
    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    Long userId = Long.parseLong(auth.getPrincipal().toString());
    attendanceService.joinEvent(userId, eventId);
    return ApiResponse.ok("JOINED", "Successfully joined event");
  }

  @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
  public ResponseEntity<byte[]> qr(@PathVariable("id") Long id) {
    byte[] img = attendanceService.generateAttendanceQrImage(id);
    return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(img);
  }

  @PostMapping("/scan")
  public ApiResponse<QRValidationResponse> scan(Authentication auth, @Valid @RequestBody ScanRequest req) {
    Long organizerId = null;
    if (auth != null) {
      try { organizerId = Long.parseLong(auth.getPrincipal().toString()); } catch (Exception ignored) {}
    }
    return ApiResponse.ok("OK", attendanceService.scan(req, organizerId));
  }

  @PostMapping("/validate-code")
  public ApiResponse<QRValidationResponse> validateCode(Authentication auth, @RequestBody java.util.Map<String, String> body) {
    String code = body.get("code");
    if (code == null || code.isBlank()) throw new RuntimeException("CODE_REQUIRED");
    Long organizerId = null;
    if (auth != null) {
      try { organizerId = Long.parseLong(auth.getPrincipal().toString()); } catch (Exception ignored) {}
    }
    return ApiResponse.ok("OK", attendanceService.validateTicketCode(code, organizerId));
  }

  @PostMapping("/{id}/approve")
  public ApiResponse<String> approve(@PathVariable("id") Long id) {
    attendanceService.approveAttendance(id);
    return ApiResponse.ok("APPROVED", "Request approved");
  }

  @PostMapping("/{id}/reject")
  public ApiResponse<String> reject(@PathVariable("id") Long id) {
    attendanceService.rejectAttendance(id);
    return ApiResponse.ok("REJECTED", "Request rejected");
  }

  @GetMapping("/event/{eventId}/pending")
  public ApiResponse<java.util.List<ApplicantResponse>> getPending(@PathVariable("eventId") Long eventId) {
    return ApiResponse.ok("OK", attendanceService.getPendingApplicants(eventId));
  }
}
