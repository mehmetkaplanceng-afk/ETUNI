package com.etuni.repository;

import com.etuni.model.Event;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {
  @Query("SELECT e FROM Event e LEFT JOIN FETCH e.club WHERE e.university.id = :universityId AND e.status = :status ORDER BY e.eventDate DESC")
  List<Event> findTop20ByUniversityIdAndStatusOrderByEventDateDesc(@Param("universityId") Long universityId,
      @Param("status") String status);

  @Query("SELECT e FROM Event e LEFT JOIN FETCH e.club WHERE e.university.id = :universityId ORDER BY e.eventDate DESC")
  List<Event> findByUniversityIdOrderByEventDateDesc(@Param("universityId") Long universityId);

  List<Event> findByUniversityIdAndEventDateBetweenAndStatus(Long universityId, LocalDate start, LocalDate end,
      String status);

  @Query("SELECT e FROM Event e LEFT JOIN FETCH e.club WHERE e.university.id = :universityId")
  List<Event> findByUniversityId(@Param("universityId") Long universityId);

  List<Event> findByClubId(Long clubId);
}
