package com.etuni.service;

import com.etuni.dto.AttendanceDtos.*;
import com.etuni.model.Attendance;
import com.etuni.model.Event;
import com.etuni.model.UserEntity;
import com.etuni.repository.AttendanceRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UserRepository;
import com.etuni.util.QrPayloadUtil;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AttendanceService {

  private final AttendanceRepository attendanceRepo;
  private final EventRepository eventRepo;
  private final UserRepository userRepo;
  private final QrPayloadUtil qrUtil;
  private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

  public AttendanceService(AttendanceRepository attendanceRepo, EventRepository eventRepo, UserRepository userRepo,
      QrPayloadUtil qrUtil) {
    this.attendanceRepo = attendanceRepo;
    this.eventRepo = eventRepo;
    this.userRepo = userRepo;
    this.qrUtil = qrUtil;
  }
  @org.springframework.transaction.annotation.Transactional
  public byte[] generateAttendanceQrImage(Long attendanceId) {
    Attendance a = attendanceRepo.findById(attendanceId).orElseThrow(() -> new RuntimeException("ATTENDANCE_NOT_FOUND"));
    String payload = qrUtil.generateForAttendance(a.getId(), a.getTicketCode());
    try {
      com.google.zxing.qrcode.QRCodeWriter writer = new com.google.zxing.qrcode.QRCodeWriter();
      com.google.zxing.common.BitMatrix bitMatrix = writer.encode(payload, com.google.zxing.BarcodeFormat.QR_CODE, 300, 300);
      java.awt.image.BufferedImage img = new java.awt.image.BufferedImage(300, 300, java.awt.image.BufferedImage.TYPE_INT_RGB);
      for (int x = 0; x < 300; x++) {
        for (int y = 0; y < 300; y++) {
          img.setRGB(x, y, bitMatrix.get(x, y) ? 0xFF000000 : 0xFFFFFFFF);
        }
      }
      java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
      javax.imageio.ImageIO.write(img, "png", baos);
      return baos.toByteArray();
    } catch (Exception e) {
      throw new RuntimeException("QR_GENERATION_FAILED", e);
    }
  }

  @org.springframework.transaction.annotation.Transactional
  public QRValidationResponse validateTicketCode(String code, Long organizerId) {
    var opt = attendanceRepo.findByTicketCode(code);
    if (opt.isEmpty()) throw new RuntimeException("TICKET_NOT_FOUND");
    Attendance a = opt.get();
    if (a.isVerified()) {
      var u = a.getUser();
      return new QRValidationResponse(true, "ALREADY_CHECKED_IN", a.getEvent().getId(), a.getEvent().getTitle(), a.getScannedAt(), u == null ? null : u.getId(), u == null ? null : u.getFullName(), u == null ? null : u.getEmail());
    }
    a.setVerified(true);
    a.setScannedAt(LocalDateTime.now());
    a.setStatus("APPROVED");
    attendanceRepo.save(a);
    var u = a.getUser();
    return new QRValidationResponse(true, "CHECK_IN_OK", a.getEvent().getId(), a.getEvent().getTitle(), a.getScannedAt(), u == null ? null : u.getId(), u == null ? null : u.getFullName(), u == null ? null : u.getEmail());
  }

  @org.springframework.transaction.annotation.Transactional
  public void joinEvent(Long userId, Long eventId) {
    if (userId == null || eventId == null)
      throw new RuntimeException("ID_REQUIRED");
    UserEntity user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
    Event event = eventRepo.findById(eventId).orElseThrow(() -> new RuntimeException("EVENT_NOT_FOUND"));

    if (attendanceRepo.findByEventIdAndUserId(eventId, userId).isPresent()) {
      throw new RuntimeException("ALREADY_JOINED");
    }

    Attendance a = new Attendance();
    a.setEvent(event);
    a.setUser(user);
    a.setScannedAt(LocalDateTime.now());
    a.setVerified(false); // Not scanned yet
    a.setStatus("PENDING"); // Initial status
    // generate ticket code
    String code = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    // avoid collision
    while (attendanceRepo.findByTicketCode(code).isPresent()) {
      code = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
    a.setTicketCode(code);
    attendanceRepo.save(a);
  }
  @org.springframework.transaction.annotation.Transactional
  public QRValidationResponse scan(ScanRequest req, Long organizerId) {
    var res = qrUtil.validate(req.qrPayload());
    if (!res.valid()) {
      return new QRValidationResponse(false, res.message(), null, null, null, null, null, null);
    }

    if (res.attendanceId() != null) {
      // attendance-level QR
      Attendance a = attendanceRepo.findById(res.attendanceId()).orElseThrow(() -> new RuntimeException("ATTENDANCE_NOT_FOUND"));
      logger.info("SCAN_CHECK: Biletin Etkinliği={}, Organizatörün Bulunduğu Etkinlik={}", 
                     a.getEvent().getId(), req.currentEventId());
      if (req.currentEventId() != null && !a.getEvent().getId().equals(req.currentEventId())) {
             var u = a.getUser();
             return new QRValidationResponse(
                 false, 
                 "WRONG_EVENT", // Hata kodu: YANLIŞ ETKİNLİK
                 a.getEvent().getId(), 
                 a.getEvent().getTitle(), // Biletin ait olduğu asıl etkinlik
                 null, 
                 u == null ? null : u.getId(), 
                 u == null ? null : u.getFullName(), 
                 u == null ? null : u.getEmail()
             );
        }
      // verify ticket code
      if (a.getTicketCode() == null || !a.getTicketCode().equals(res.ticketCode())) {
        var uu = a.getUser();
        return new QRValidationResponse(false, "TICKET_CODE_MISMATCH", a.getEvent().getId(), a.getEvent().getTitle(), null, uu == null ? null : uu.getId(), uu == null ? null : uu.getFullName(), uu == null ? null : uu.getEmail());
      }
      if (a.isVerified()) {
        var uu = a.getUser();
        return new QRValidationResponse(true, "ALREADY_CHECKED_IN", a.getEvent().getId(), a.getEvent().getTitle(), a.getScannedAt(), uu == null ? null : uu.getId(), uu == null ? null : uu.getFullName(), uu == null ? null : uu.getEmail());
      }
      logger.info("Organizer {} checking in attendance {} for event {}", organizerId, a.getId(), a.getEvent().getId());
      a.setVerified(true);
      a.setScannedAt(LocalDateTime.now());
      a.setStatus("APPROVED");
      attendanceRepo.save(a);
      var uu = a.getUser();
      return new QRValidationResponse(true, "CHECK_IN_OK", a.getEvent().getId(), a.getEvent().getTitle(), a.getScannedAt(), uu == null ? null : uu.getId(), uu == null ? null : uu.getFullName(), uu == null ? null : uu.getEmail());
    }

    // fallback: event-level QR (existing behavior)
    Long evId = res.eventId();
    if (evId == null)
      throw new RuntimeException("EVENT_ID_MISSING");
    Event event = eventRepo.findById(evId).orElseThrow(() -> new RuntimeException("EVENT_NOT_FOUND"));

    // If user provided a userId (legacy), try to check-in that user
    if (req.userId() != null) {
      UserEntity user = userRepo.findById(req.userId()).orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
      java.util.Optional<Attendance> existingProp = attendanceRepo.findByEventIdAndUserId(evId, user.getId());
      if (existingProp.isPresent()) {
        Attendance existing = existingProp.get();
          if (existing.isVerified()) {
            var uuu = existing.getUser();
            return new QRValidationResponse(true, "ALREADY_CHECKED_IN", evId, event.getTitle(), existing.getScannedAt(), uuu == null ? null : uuu.getId(), uuu == null ? null : uuu.getFullName(), uuu == null ? null : uuu.getEmail());
          } else {
          if (!"APPROVED".equals(existing.getStatus())) {
              var uuu = existing.getUser();
              return new QRValidationResponse(false, "NOT_APPROVED_FOR_THIS_EVENT", evId, event.getTitle(), null, uuu == null ? null : uuu.getId(), uuu == null ? null : uuu.getFullName(), uuu == null ? null : uuu.getEmail());
          }
          logger.info("Organizer {} approving existing attendance {}", organizerId, existing.getId());
          existing.setVerified(true);
          existing.setScannedAt(LocalDateTime.now());
          attendanceRepo.save(existing);
            var uuu = existing.getUser();
            return new QRValidationResponse(true, "CHECK_IN_OK", evId, event.getTitle(), existing.getScannedAt(), uuu == null ? null : uuu.getId(), uuu == null ? null : uuu.getFullName(), uuu == null ? null : uuu.getEmail());
        }
      }
    }

    // Direct scan without join: create approved attendance
    Attendance a = new Attendance();
    a.setEvent(event);
    a.setUser(userRepo.findById(req.userId() == null ? 1L : req.userId()).orElse(null));
    a.setScannedAt(LocalDateTime.now());
    a.setVerified(true);
    a.setStatus("APPROVED");
    // generate ticket code
    String code = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    while (attendanceRepo.findByTicketCode(code).isPresent()) {
      code = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
    a.setTicketCode(code);
    Attendance saved = attendanceRepo.save(a);
    logger.info("Organizer {} created direct attendance {} for event {}", organizerId, saved.getId(), evId);
    var uu = saved.getUser();
    return new QRValidationResponse(true, "CHECK_IN_OK", evId, event.getTitle(), saved.getScannedAt(), uu == null ? null : uu.getId(), uu == null ? null : uu.getFullName(), uu == null ? null : uu.getEmail());
  }

  @org.springframework.transaction.annotation.Transactional
  public void approveAttendance(Long attendanceId) {
    Attendance a = attendanceRepo.findById(attendanceId).orElseThrow(() -> new RuntimeException("NOT_FOUND"));
    a.setStatus("APPROVED");
    attendanceRepo.save(a);
  }

  @org.springframework.transaction.annotation.Transactional
  public void rejectAttendance(Long attendanceId) {
    Attendance a = attendanceRepo.findById(attendanceId).orElseThrow(() -> new RuntimeException("NOT_FOUND"));
    a.setStatus("REJECTED");
    attendanceRepo.save(a);
  }

  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public java.util.List<ApplicantResponse> getPendingApplicants(Long eventId) {
    return attendanceRepo.findAllByEventIdAndStatus(eventId, "PENDING")
        .stream()
        .map(a -> new ApplicantResponse(
            a.getId(),
            a.getUser().getId(),
            a.getUser().getFullName(),
            a.getUser().getEmail(),
            a.getScannedAt(), // Using scannedAt as application time for now
            a.getStatus()))
        .toList();
  }
}
