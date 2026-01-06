package com.etuni.repository;

import com.etuni.model.Notification;
import com.etuni.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(UserEntity user);
}
