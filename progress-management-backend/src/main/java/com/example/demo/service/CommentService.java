package com.example.demo.service;

import com.example.demo.dto.request.CreateCommentRequest;
import com.example.demo.dto.response.CommentResponse;
import com.example.demo.security.UserPrincipal;

import java.util.List;

public interface CommentService {

    CommentResponse addComment(Long taskId, CreateCommentRequest request, UserPrincipal currentUser);

    List<CommentResponse> getTaskComments(Long taskId, UserPrincipal currentUser);
}
