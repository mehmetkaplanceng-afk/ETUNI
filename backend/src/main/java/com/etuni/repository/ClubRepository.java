package com.etuni.repository;

import com.etuni.model.Club;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClubRepository extends JpaRepository<Club, Long> {
  @Query("SELECT c FROM Club c JOIN FETCH c.university WHERE c.university.id = :universityId")
  List<Club> findByUniversityId(@Param("universityId") Long universityId);
}
