package com.etuni.repository;

import com.etuni.model.Attendance;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
  Optional<Attendance> findByEventIdAndUserId(Long eventId, Long userId);

  Optional<Attendance> findByTicketCode(String ticketCode);

  long countByEventIdAndVerifiedTrue(Long eventId);

  @Query("SELECT a FROM Attendance a LEFT JOIN FETCH a.event WHERE a.user.id = :userId ORDER BY a.scannedAt DESC")
  List<Attendance> findByUserIdOrderByScannedAtDesc(@Param("userId") Long userId);

  @Query("SELECT a.event.id, COUNT(a) FROM Attendance a WHERE a.verified = true GROUP BY a.event.id")
  List<Object[]> findEventPopularityCounts();

  @Query("SELECT e.eventType, COUNT(a) FROM Attendance a JOIN a.event e WHERE a.verified = true GROUP BY e.eventType")
  List<Object[]> countByEventType();

  @Query("SELECT a FROM Attendance a WHERE a.event.university.id = :uniId AND a.verified = true")
  List<Attendance> findVerifiedByUniversity(@Param("uniId") Long uniId);

  @Query("SELECT a FROM Attendance a WHERE a.event.club.id = :clubId AND a.verified = true")
  List<Attendance> findVerifiedByClub(@Param("clubId") Long clubId);

  List<Attendance> findByEventId(Long eventId);

  List<Attendance> findAllByEventIdAndStatus(Long eventId, String status);
}
