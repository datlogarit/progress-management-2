package com.example.demo.service;

import com.example.demo.constant.NotificationType;
import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.entity.User;

import java.util.List;

public interface NotificationService {

    void sendNotification(User recipient, String message, NotificationType type, Long taskId, Long commentId);

    default void sendNotification(User recipient, String message, NotificationType type, Long taskId) {
        sendNotification(recipient, message, type, taskId, null);
    }

    default void sendNotification(User recipient, String title, String message, NotificationType type, Long taskId) {
        sendNotification(recipient, message, type, taskId, null);
    }

    List<NotificationResponse> getUserNotifications(Long recipientId);

    void markAsRead(Long notificationId, Long recipientId);

    void markAllAsRead(Long recipientId);

    long getUnreadCount(Long recipientId);
}
