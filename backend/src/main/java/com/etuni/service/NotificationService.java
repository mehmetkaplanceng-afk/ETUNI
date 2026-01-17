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
    private final PushNotificationService pushNotificationService;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository,
            PushNotificationService pushNotificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
    }

    public void createForUser(Long userId, String title, String message) {
        if (userId == null)
            return;
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return;

        // Save to database
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        notificationRepository.save(n);

        // Send push notification if user has a push token
        if (user.getPushToken() != null && !user.getPushToken().trim().isEmpty()) {
            pushNotificationService.sendPushNotification(user.getPushToken(), title, message);
        }
    }

    public List<Notification> listForUser(Long userId) {
        if (userId == null)
            return List.of();
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return List.of();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public int sendBroadcastNotification(String title, String message) {
        List<UserEntity> allUsers = userRepository.findAll();
        int count = 0;
        for (UserEntity user : allUsers) {
            try {
                // Save to database
                Notification n = new Notification();
                n.setUser(user);
                n.setTitle(title);
                n.setMessage(message);
                notificationRepository.save(n);

                // Send push notification if user has a push token
                if (user.getPushToken() != null && !user.getPushToken().trim().isEmpty()) {
                    pushNotificationService.sendPushNotification(user.getPushToken(), title, message);
                }
                count++;
            } catch (Exception e) {
                System.err.println("Broadcast failed for user " + user.getId() + ": " + e.getMessage());
            }
        }
        return count;
    }
}
