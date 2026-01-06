package com.etuni.repository;

import com.etuni.model.PromotionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PromotionRequestRepository extends JpaRepository<PromotionRequest, Long> {
    @Query("SELECT r FROM PromotionRequest r JOIN FETCH r.user WHERE r.university.id = :universityId AND r.status = :status")
    List<PromotionRequest> findByUniversityIdAndStatus(@Param("universityId") Long universityId,
            @Param("status") String status);

    List<PromotionRequest> findByUserId(Long userId);
}
