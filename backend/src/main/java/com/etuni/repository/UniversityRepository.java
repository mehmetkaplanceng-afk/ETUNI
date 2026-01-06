package com.etuni.repository;

import com.etuni.model.University;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UniversityRepository extends JpaRepository<University, Long> {
  Optional<University> findByNameIgnoreCase(String name);
}
