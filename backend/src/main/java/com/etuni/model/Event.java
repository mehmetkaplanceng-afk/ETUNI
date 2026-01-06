package com.etuni.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "events")
public class Event {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "university_id", nullable = false)
  private University university;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "club_id")
  private Club club;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "text")
  private String description;

  @Column(nullable = false)
  private String eventType;

  private String category;
  private String targetAudience;

  private LocalDate eventDate;
  private LocalTime startTime;

  @Column(columnDefinition = "text")
  private String qrPayload;

  @Column(nullable = false)
  private String status; // ACTIVE / CANCELLED / DRAFT

  public Event() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public University getUniversity() { return university; }
  public void setUniversity(University university) { this.university = university; }

  public Club getClub() { return club; }
  public void setClub(Club club) { this.club = club; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public String getEventType() { return eventType; }
  public void setEventType(String eventType) { this.eventType = eventType; }

  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }

  public String getTargetAudience() { return targetAudience; }
  public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

  public LocalDate getEventDate() { return eventDate; }
  public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

  public LocalTime getStartTime() { return startTime; }
  public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

  public String getQrPayload() { return qrPayload; }
  public void setQrPayload(String qrPayload) { this.qrPayload = qrPayload; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}
