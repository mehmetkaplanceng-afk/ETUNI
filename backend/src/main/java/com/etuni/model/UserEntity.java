package com.etuni.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class UserEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String fullName;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  @Column(nullable = false)
  private String role; // STUDENT / ORGANIZER / UNIVERSITY_STAFF / ADMIN

  @Column(nullable = false)
  private String status; // ACTIVE / PENDING_APPROVAL / DISABLED

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "selected_university_id")
  private University university;

  @ElementCollection(fetch = FetchType.EAGER)
  private List<String> interests = new ArrayList<>();

  private String preferredTimeRange; // e.g. "18-22"

  @Column(length = 500)
  private String pushToken; // Expo push notification token

  public UserEntity() {
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public University getUniversity() {
    return university;
  }

  public void setUniversity(University university) {
    this.university = university;
  }

  public List<String> getInterests() {
    return interests;
  }

  public void setInterests(List<String> interests) {
    this.interests = interests;
  }

  public String getPreferredTimeRange() {
    return preferredTimeRange;
  }

  public void setPreferredTimeRange(String preferredTimeRange) {
    this.preferredTimeRange = preferredTimeRange;
  }

  public String getPushToken() {
    return this.pushToken;
  }

  public void setPushToken(String pushToken) {
    this.pushToken = pushToken;
  }
}
