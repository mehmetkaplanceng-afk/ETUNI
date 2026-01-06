package com.etuni.service;

import com.etuni.model.Notification;
import com.etuni.model.UserEntity;
import com.etuni.repository.NotificationRepository;
import com.etuni.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void createForUser(Long userId, String title, String message) {
        if (userId == null) return;
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        notificationRepository.save(n);
    }

    public List<Notification> listForUser(Long userId) {
        if (userId == null) return List.of();
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return List.of();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }
}
