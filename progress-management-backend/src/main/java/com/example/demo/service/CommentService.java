package com.example.demo.service;

import com.example.demo.dto.request.CreateCommentRequest;
import com.example.demo.dto.response.CommentResponse;
import com.example.demo.security.UserPrincipal;

import java.util.List;

/**
 * Service interface for managing task comments and notifications.
 */
public interface CommentService {

    /**
     * Adds a new comment to a specified task.
     *
     * @param taskId the ID of the task
     * @param request the comment creation payload
     * @param currentUser the principal of the authenticated user
     * @return the created comment response
     */
    CommentResponse addComment(Long taskId, CreateCommentRequest request, UserPrincipal currentUser);

    /**
     * Retrieves all comments for a given task.
     *
     * @param taskId the ID of the task
     * @param currentUser the principal of the authenticated user
     * @return a list of comment responses
     */
    List<CommentResponse> getTaskComments(Long taskId, UserPrincipal currentUser);
}
