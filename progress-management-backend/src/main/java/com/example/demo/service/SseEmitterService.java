package com.example.demo.service;

import com.example.demo.dto.response.NotificationResponse;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Service interface for handling Server-Sent Events (SSE) connections and real-time notifications.
 */
public interface SseEmitterService {

    /**
     * Creates and registers a new SSE emitter for a specified user.
     *
     * @param userId the ID of the user connecting to SSE
     * @return the configured SseEmitter instance
     */
    SseEmitter createEmitter(Long userId);

    /**
     * Sends a real-time notification to an active SSE connection for a specific user.
     *
     * @param userId the recipient user ID
     * @param notification the notification payload to send
     */
    void sendNotification(Long userId, NotificationResponse notification);
}
