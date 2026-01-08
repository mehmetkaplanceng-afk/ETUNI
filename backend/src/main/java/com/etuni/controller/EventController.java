package com.etuni.controller;

import com.etuni.dto.AuthDtos.ApiResponse;
import com.etuni.dto.EventDtos.*;
import com.etuni.service.EventService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

  private final EventService eventService;
  private final com.etuni.service.RecommendationService recommendationService;
  private final com.etuni.service.UserProfileService userProfileService;

  public EventController(EventService eventService,
      com.etuni.service.RecommendationService recommendationService,
      com.etuni.service.UserProfileService userProfileService) {
    this.eventService = eventService;
    this.recommendationService = recommendationService;
    this.userProfileService = userProfileService;
  }

  @GetMapping("/recommended")
  public ApiResponse<List<com.etuni.service.RecommendationService.ScoredEvent>> getRecommended() {
    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    Long userId = Long.parseLong(auth.getPrincipal().toString());
    return ApiResponse.ok("Recommended events", recommendationService.recommend(userId));
  }

  @GetMapping("/my-events")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
  public ApiResponse<List<EventResponse>> getMyEvents() {
    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    Long userId = Long.parseLong(auth.getPrincipal().toString());
    var profile = userProfileService.getProfile(userId);
    return ApiResponse.ok("OK", eventService.listAllByUniversity(profile.selectedUniversityId()));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
  public ApiResponse<EventResponse> create(@Valid @RequestBody EventRequest req) {
    if (req.universityId() == null) {
      var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
      Long userId = Long.parseLong(auth.getPrincipal().toString());
      var profile = userProfileService.getProfile(userId);
      EventRequest updatedReq = new EventRequest(
          profile.selectedUniversityId(),
          req.clubId(),
          req.title(),
          req.description(),
          req.eventType(),
          req.category(),
          req.targetAudience(),
          req.eventDate(),
          req.startTime(),
          req.location(),
          req.latitude(),
          req.longitude(),
          req.price());
      return ApiResponse.ok("EVENT_CREATED", eventService.create(updatedReq));
    }
    return ApiResponse.ok("EVENT_CREATED", eventService.create(req));
  }

  @GetMapping("/university/{universityId}")
  public ApiResponse<List<EventResponse>> list(@PathVariable("universityId") Long universityId) {
    return ApiResponse.ok("OK", eventService.listLatestByUniversity(universityId));
  }

  @GetMapping("/{id}/attendees")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
  public ApiResponse<java.util.Map<String, Object>> attendees(@PathVariable("id") Long id) {
    var list = eventService.getAttendees(id);
    long count = list.stream().filter(a -> a.userId() != null).count();
    java.util.Map<String, Object> resp = new java.util.HashMap<>();
    resp.put("count", count);
    resp.put("attendees", list);
    return ApiResponse.ok("OK", resp);
  }

  @GetMapping("/{id}")
  public ApiResponse<EventResponse> get(@PathVariable("id") Long id) {
    return ApiResponse.ok("OK", eventService.get(id));
  }

  @PostMapping("/{id}/cancel")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
  public ApiResponse<EventResponse> cancel(@PathVariable("id") Long id) {
    return ApiResponse.ok("EVENT_CANCELLED", eventService.cancel(id));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
  public ApiResponse<EventResponse> update(@PathVariable("id") Long id, @Valid @RequestBody EventUpdateRequest req) {
    return ApiResponse.ok("EVENT_UPDATED", eventService.update(id, req));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_STAFF')")
  public ApiResponse<String> delete(@PathVariable("id") Long id) {
    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    Long userId = Long.parseLong(auth.getPrincipal().toString());
    var profile = userProfileService.getProfile(userId);

    var eventEntity = eventService.getEntity(id);

    // Admin can delete any event
    if ("ADMIN".equals(profile.role())) {
      eventService.delete(id);
      return ApiResponse.ok("DELETED", "Event deleted");
    }

    // University staff can delete events only for their university
    if ("UNIVERSITY_STAFF".equals(profile.role())) {
      Long staffUni = profile.selectedUniversityId();
      Long eventUni = eventEntity.getUniversity() == null ? null : eventEntity.getUniversity().getId();
      if (staffUni != null && staffUni.equals(eventUni)) {
        eventService.delete(id);
        return ApiResponse.ok("DELETED", "Event deleted");
      }
    }

    throw new RuntimeException("UNAUTHORIZED");
  }

  @GetMapping("/{id}/qr")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN','UNIVERSITY_STAFF')")
  public ApiResponse<String> qr(@PathVariable("id") Long id) {
    return ApiResponse.ok("OK", eventService.getQrPayload(id));
  }
}
