package com.etuni.repository;

import com.etuni.model.Club;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubRepository extends JpaRepository<Club, Long> {
  List<Club> findByUniversityId(Long universityId);
}
