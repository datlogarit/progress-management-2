package com.example.demo.service.impl;

import com.example.demo.dto.response.NotificationResponse;
import com.example.demo.service.SseEmitterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementation of {@link SseEmitterService} managing in-memory SSE connections and message dispatching.
 */
@Slf4j
@Service
public class SseEmitterServiceImpl implements SseEmitterService {

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * {@inheritDoc}
     */
    @Override
    public SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1 hour timeout
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError(e -> emitters.remove(userId));

        // Send an initial event to keep the connection alive
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected"));
        } catch (IOException e) {
            log.error("Error sending initial event for user {}", userId, e);
            emitters.remove(userId);
        }

        return emitter;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void sendNotification(Long userId, NotificationResponse notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("NOTIFICATION").data(notification));
                log.info("Sent real-time notification to user {}", userId);
            } catch (IOException e) {
                log.error("Error sending notification to user {}", userId, e);
                emitters.remove(userId);
            }
        }
    }
}
