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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.example.demo.annotation.Authorize;
import com.example.demo.constant.PermissionEnum;
import com.example.demo.constant.ScopeType;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final CommentService commentService;

    @PostMapping
    @Authorize(permission = { PermissionEnum.TASK_CREATE }, scope = ScopeType.TASK, scopeParam = "projectId")
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.createTask(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Authorize(permission = { PermissionEnum.TASK_READ }, scope = ScopeType.TASK, scopeParam = "projectId")
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) TaskStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<TaskResponse> tasks = taskService.getTasks(projectId, assigneeId, status, currentUser);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/my-tasks")
    @Authorize(permission = { PermissionEnum.TASK_READ })
    public ResponseEntity<List<TaskResponse>> getMyTasks(
            @RequestParam(required = false) TaskStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<TaskResponse> tasks = taskService.getMyTasks(status, currentUser);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    @Authorize(permission = { PermissionEnum.TASK_READ }, scope = ScopeType.TASK, scopeParam = "id")
    public ResponseEntity<TaskResponse> getTaskById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.getTaskById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Authorize(permission = { PermissionEnum.TASK_UPDATE }, scope = ScopeType.TASK, scopeParam = "id")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.updateTask(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/assign")
    @Authorize(permission = { PermissionEnum.TASK_ASSIGN }, scope = ScopeType.TASK, scopeParam = "id")
    public ResponseEntity<TaskResponse> assignTask(
            @PathVariable Long id,
            @Valid @RequestBody AssignTaskRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.assignTask(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @Authorize(permission = { PermissionEnum.TASK_UPDATE_STATUS }, scope = ScopeType.TASK, scopeParam = "id")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.updateTaskStatus(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    @Authorize(permission = { PermissionEnum.TASK_DELETE }, scope = ScopeType.TASK, scopeParam = "id")
    public ResponseEntity<TaskResponse> cancelTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TaskResponse response = taskService.cancelTask(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Authorize(permission = { PermissionEnum.TASK_DELETE }, scope = ScopeType.TASK, scopeParam = "id")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        taskService.deleteTask(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // Comment endpoints on Task
    @PostMapping("/{taskId}/comments")
    @Authorize(permission = { PermissionEnum.TASK_READ }, scope = ScopeType.TASK, scopeParam = "taskId")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CommentResponse response = commentService.addComment(taskId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{taskId}/comments")
    @Authorize(permission = { PermissionEnum.TASK_READ }, scope = ScopeType.TASK, scopeParam = "taskId")
    public ResponseEntity<List<CommentResponse>> getTaskComments(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<CommentResponse> comments = commentService.getTaskComments(taskId, currentUser);
        return ResponseEntity.ok(comments);
    }
}
