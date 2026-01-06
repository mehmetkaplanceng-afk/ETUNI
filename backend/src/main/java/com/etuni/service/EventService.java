package com.etuni.service;

import com.etuni.dto.EventDtos.*;
import com.etuni.exception.ResourceNotFoundException;
import com.etuni.model.Club;
import com.etuni.model.Event;
import com.etuni.model.University;
import com.etuni.repository.ClubRepository;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UniversityRepository;
import com.etuni.util.QrPayloadUtil;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EventService {

  private static final Logger log = LoggerFactory.getLogger(EventService.class);

  private final EventRepository eventRepo;
  private final UniversityRepository uniRepo;
  private final ClubRepository clubRepo;
  private final com.etuni.repository.AttendanceRepository attendanceRepo;
  private final QrPayloadUtil qrUtil;

  public EventService(EventRepository eventRepo, UniversityRepository uniRepo, ClubRepository clubRepo,
      com.etuni.repository.AttendanceRepository attendanceRepo, QrPayloadUtil qrUtil) {
    this.eventRepo = eventRepo;
    this.uniRepo = uniRepo;
    this.clubRepo = clubRepo;
    this.attendanceRepo = attendanceRepo;
    this.qrUtil = qrUtil;
  }

  public EventResponse create(EventRequest req) {
    University uni = uniRepo.findById(req.universityId())
        .orElseThrow(() -> new ResourceNotFoundException("Üniversite", req.universityId()));

    Club club = null;
    if (req.clubId() != null) {
      club = clubRepo.findById(req.clubId())
          .orElseThrow(() -> new ResourceNotFoundException("Kulüp", req.clubId()));
    }

    log.info("Yeni etkinlik oluşturuluyor: {} (Üniversite: {})", req.title(), uni.getName());

    Event e = new Event();
    e.setUniversity(uni);
    e.setClub(club);
    e.setTitle(req.title());
    e.setDescription(req.description());
    e.setEventType(req.eventType());
    e.setCategory(req.category());
    e.setTargetAudience(req.targetAudience());
    e.setEventDate(req.eventDate());
    e.setStartTime(req.startTime());
    e.setStatus("ACTIVE");

    Event saved = eventRepo.save(e);
    saved.setQrPayload(qrUtil.generateForEvent(saved.getId()));
    saved = eventRepo.save(saved);

    return toDto(saved);
  }

  public List<EventResponse> listLatestByUniversity(Long universityId) {
    return eventRepo.findTop20ByUniversityIdAndStatusOrderByEventDateDesc(universityId, "ACTIVE")
        .stream().map(this::toDto).toList();
  }

  public List<EventResponse> listAllByUniversity(Long universityId) {
    return eventRepo.findByUniversityIdOrderByEventDateDesc(universityId)
        .stream().map(this::toDto).toList();
  }

  public EventResponse get(Long id) {
    return toDto(eventRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Etkinlik", id)));
  }

  public EventResponse cancel(Long id) {
    Event e = eventRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Etkinlik", id));
    e.setStatus("CANCELLED");
    log.info("Etkinlik iptal edildi: {} (ID: {})", e.getTitle(), id);
    return toDto(eventRepo.save(e));
  }

  public java.util.List<com.etuni.dto.AttendeeDtos.AttendeeInfo> getAttendees(Long eventId) {
    var list = attendanceRepo.findByEventId(eventId);
    return list.stream().map(a -> new com.etuni.dto.AttendeeDtos.AttendeeInfo(
        a.getId(),
        a.getUser() == null ? null : a.getUser().getId(),
        a.getUser() == null ? null : a.getUser().getFullName(),
        a.getUser() == null ? null : a.getUser().getEmail(),
        a.getScannedAt(),
        a.getTicketCode())).toList();
  }

  public EventResponse update(Long id, EventUpdateRequest req) {
    Event e = eventRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Etkinlik", id));

    if (req.title() != null)
      e.setTitle(req.title());
    if (req.description() != null)
      e.setDescription(req.description());
    if (req.eventType() != null)
      e.setEventType(req.eventType());
    if (req.category() != null)
      e.setCategory(req.category());
    if (req.targetAudience() != null)
      e.setTargetAudience(req.targetAudience());
    if (req.eventDate() != null)
      e.setEventDate(req.eventDate());
    if (req.startTime() != null)
      e.setStartTime(req.startTime());
    if (req.status() != null)
      e.setStatus(req.status());

    return toDto(eventRepo.save(e));
  }

  public String getQrPayload(Long id) {
    Event e = eventRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Etkinlik", id));
    if (e.getQrPayload() == null || e.getQrPayload().isBlank()) {
      e.setQrPayload(qrUtil.generateForEvent(e.getId()));
      eventRepo.save(e);
    }
    return e.getQrPayload();
  }

  public com.etuni.model.Event getEntity(Long id) {
    return eventRepo.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Etkinlik", id));
  }

  public void delete(Long id) {
    var e = getEntity(id);
    eventRepo.delete(e);
  }

  private EventResponse toDto(Event e) {
    Long uniId = e.getUniversity() == null ? null : e.getUniversity().getId();
    Long clubId = e.getClub() == null ? null : e.getClub().getId();
    return new EventResponse(
        e.getId(),
        uniId,
        clubId,
        e.getTitle(),
        e.getDescription(),
        e.getEventType(),
        e.getCategory(),
        e.getTargetAudience(),
        e.getEventDate(),
        e.getStartTime(),
        e.getStatus());
  }

  public long count() {
    return eventRepo.count();
  }

  public int assignEventsToUniversity(Long targetUniversityId, Long sourceUniversityId) {
    University target = uniRepo.findById(targetUniversityId)
        .orElseThrow(() -> new ResourceNotFoundException("Üniversite", targetUniversityId));
    List<Event> toUpdate;
    if (sourceUniversityId == null) {
      toUpdate = eventRepo.findAll();
    } else {
      toUpdate = eventRepo.findByUniversityId(sourceUniversityId);
    }
    for (Event e : toUpdate) {
      e.setUniversity(target);
    }
    eventRepo.saveAll(toUpdate);
    return toUpdate.size();
  }
}
