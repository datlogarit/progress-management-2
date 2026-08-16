package com.example.demo.service.impl;

import com.example.demo.constant.NotificationType;

import com.example.demo.dto.request.CreateCommentRequest;
import com.example.demo.dto.response.CommentResponse;
import com.example.demo.dto.response.UserSummaryDto;
import com.example.demo.entity.Comment;
import com.example.demo.entity.Task;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.CommentService;
import com.example.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link CommentService} providing comment management and notification triggers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final com.example.demo.repository.ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public CommentResponse addComment(Long taskId, CreateCommentRequest request, UserPrincipal currentUser) {
        log.info("Adding comment to task id: {} by user: {}", taskId, currentUser.getUsername());

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        if (!Boolean.TRUE.equals(user.getIsAdmin())) {
            boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(task.getProject().getId(), user.getId());
            if (!isMember) {
                throw new UnauthorizedException("You do not have permission to comment on this task");
            }
        }

        Comment comment = Comment.builder()
                .task(task)
                .user(user)
                .content(request.getContent().trim())
                .build();

        Comment savedComment = commentRepository.save(comment);

        User creator = task.getCreatedBy();
        if (!creator.getId().equals(user.getId())) {
            notificationService.sendNotification(
                    creator,
                    String.format("%s đã bình luận trên công việc '%s'", user.getFullName(), task.getTitle()),
                    NotificationType.NEW_COMMENT,
                    task.getId(),
                    savedComment.getId()
            );
        }

        User assignee = task.getAssignee();
        if (assignee != null && !assignee.getId().equals(user.getId()) && !assignee.getId().equals(creator.getId())) {
            notificationService.sendNotification(
                    assignee,
                    String.format("%s đã bình luận trên công việc '%s'", user.getFullName(), task.getTitle()),
                    NotificationType.NEW_COMMENT,
                    task.getId(),
                    savedComment.getId()
            );
        }

        return mapToCommentResponse(savedComment);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(Long taskId, UserPrincipal currentUser) {
        log.info("Fetching comments for task id: {}", taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        if (!Boolean.TRUE.equals(user.getIsAdmin())) {
            boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(task.getProject().getId(), user.getId());
            if (!isMember) {
                throw new UnauthorizedException("You do not have permission to view comments for this task");
            }
        }

        List<Comment> comments = commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
        return comments.stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());
    }

    /**
     * Maps a {@link Comment} entity to a {@link CommentResponse} DTO.
     *
     * @param comment the comment entity
     * @return the mapped comment response DTO
     */
    private CommentResponse mapToCommentResponse(Comment comment) {
        UserSummaryDto userDto = UserSummaryDto.builder()
                .id(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .fullName(comment.getUser().getFullName())
                .email(comment.getUser().getEmail())
                .build();

        return CommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTask().getId())
                .user(userDto)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
