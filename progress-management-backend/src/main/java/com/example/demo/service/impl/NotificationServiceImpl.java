package com.example.demo.service.impl;

import com.example.demo.constant.NotificationType;
import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void sendNotification(User recipient, String message, NotificationType type, Long taskId, Long commentId) {
        if (recipient == null) {
            log.warn("Cannot send notification: recipient is null");
            return;
        }

        log.info("Sending notification type {} to user id {}", type, recipient.getId());

        String truncatedMessage = message;
        if (truncatedMessage != null && truncatedMessage.length() > 255) {
            truncatedMessage = truncatedMessage.substring(0, 252) + "...";
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(truncatedMessage)
                .type(type)
                .taskId(taskId)
                .commentId(commentId)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long recipientId) {
        log.info("Fetching notifications for user id: {}", recipientId);
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long recipientId) {
        log.info("Marking notification {} as read for user id {}", notificationId, recipientId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getRecipient().getId().equals(recipientId)) {
            throw new UnauthorizedException("You cannot access this notification");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long recipientId) {
        log.info("Marking all notifications as read for user id {}", recipientId);
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        notifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        String title = switch (notification.getType()) {
            case TASK_ASSIGNED -> "Bạn được giao công việc mới";
            case TASK_STATUS_CHANGED -> "Trạng thái công việc thay đổi";
            case NEW_COMMENT -> "Bình luận mới trên công việc";
            default -> "Thông báo hệ thống";
        };

        return NotificationResponse.builder()
                .id(notification.getId())
                .title(title)
                .message(notification.getMessage())
                .type(notification.getType())
                .taskId(notification.getTaskId())
                .commentId(notification.getCommentId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
