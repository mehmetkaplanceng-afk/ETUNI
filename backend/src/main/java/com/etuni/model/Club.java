package com.etuni.model;

import jakarta.persistence.*;

@Entity
@Table(name = "clubs")
public class Club {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "university_id", nullable = false)
  private University university;

  @Column(nullable = false)
  private String name;

  @Column(columnDefinition = "text")
  private String description;

  public Club() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public University getUniversity() { return university; }
  public void setUniversity(University university) { this.university = university; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
}
