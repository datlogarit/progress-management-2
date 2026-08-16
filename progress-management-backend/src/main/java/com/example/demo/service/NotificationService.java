package com.example.demo.service;

import com.example.demo.constant.NotificationType;
import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.entity.User;

import java.util.List;

/**
 * Service interface for dispatching and managing system notifications.
 */
public interface NotificationService {

    /**
     * Sends a notification to a specific recipient with task and comment context.
     *
     * @param recipient the user receiving the notification
     * @param message the notification message content
     * @param type the type of notification
     * @param taskId the associated task ID (optional)
     * @param commentId the associated comment ID (optional)
     */
    void sendNotification(User recipient, String message, NotificationType type, Long taskId, Long commentId);

    /**
     * Overloaded helper to send a task-related notification without a comment ID.
     *
     * @param recipient the user receiving the notification
     * @param message the notification message content
     * @param type the type of notification
     * @param taskId the associated task ID
     */
    default void sendNotification(User recipient, String message, NotificationType type, Long taskId) {
        sendNotification(recipient, message, type, taskId, null);
    }

    /**
     * Overloaded helper to send a notification specifying a title and message.
     *
     * @param recipient the user receiving the notification
     * @param title the notification title
     * @param message the notification message content
     * @param type the type of notification
     * @param taskId the associated task ID
     */
    default void sendNotification(User recipient, String title, String message, NotificationType type, Long taskId) {
        sendNotification(recipient, message, type, taskId, null);
    }

    /**
     * Retrieves all notifications for a given user ordered by creation time descending.
     *
     * @param recipientId the user ID
     * @return a list of notification responses
     */
    List<NotificationResponse> getUserNotifications(Long recipientId);

    /**
     * Marks a specific notification as read.
     *
     * @param notificationId the notification ID
     * @param recipientId the recipient user ID
     */
    void markAsRead(Long notificationId, Long recipientId);

    /**
     * Marks all notifications as read for a given user.
     *
     * @param recipientId the user ID
     */
    void markAllAsRead(Long recipientId);

    /**
     * Returns the count of unread notifications for a user.
     *
     * @param recipientId the user ID
     * @return count of unread notifications
     */
    long getUnreadCount(Long recipientId);
}
