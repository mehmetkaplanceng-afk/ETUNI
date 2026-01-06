package com.etuni.repository;

import com.etuni.model.Event;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
  List<Event> findTop20ByUniversityIdAndStatusOrderByEventDateDesc(Long universityId, String status);

  List<Event> findByUniversityIdOrderByEventDateDesc(Long universityId);

  List<Event> findByUniversityIdAndEventDateBetweenAndStatus(Long universityId, LocalDate start, LocalDate end,
      String status);

  List<Event> findByUniversityId(Long universityId);

  List<Event> findByClubId(Long clubId);
}
