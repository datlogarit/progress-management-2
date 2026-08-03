package com.example.demo.controller;

import com.example.demo.constant.TaskStatus;
import com.example.demo.dto.request.*;
import com.example.demo.dto.response.CommentResponse;
import com.example.demo.dto.response.TaskResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.CommentService;
import com.example.demo.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final CommentService commentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('LEADER', 'ADMIN')")
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.createTask(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LEADER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) TaskStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<TaskResponse> tasks = taskService.getTasks(departmentId, assigneeId, status, currentUser);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LEADER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<TaskResponse> getTaskById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.getTaskById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LEADER', 'ADMIN')")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.updateTask(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('LEADER', 'ADMIN')")
    public ResponseEntity<TaskResponse> assignTask(
            @PathVariable Long id,
            @Valid @RequestBody AssignTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.assignTask(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('LEADER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.updateTaskStatus(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('LEADER', 'ADMIN')")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        taskService.deleteTask(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // Comment endpoints on Task
    @PostMapping("/{taskId}/comments")
    @PreAuthorize("hasAnyRole('LEADER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CommentResponse response = commentService.addComment(taskId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{taskId}/comments")
    @PreAuthorize("hasAnyRole('LEADER', 'EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<CommentResponse>> getTaskComments(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<CommentResponse> comments = commentService.getTaskComments(taskId, currentUser);
        return ResponseEntity.ok(comments);
    }
}
