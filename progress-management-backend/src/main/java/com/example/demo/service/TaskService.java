package com.example.demo.service;

import com.example.demo.constant.TaskStatus;
import com.example.demo.dto.request.AssignTaskRequest;
import com.example.demo.dto.request.CreateTaskRequest;
import com.example.demo.dto.request.UpdateTaskRequest;
import com.example.demo.dto.request.UpdateTaskStatusRequest;
import com.example.demo.dto.response.TaskResponse;
import com.example.demo.security.UserPrincipal;

import java.util.List;

public interface TaskService {

    TaskResponse createTask(CreateTaskRequest request, UserPrincipal currentUser);

    TaskResponse updateTask(Long id, UpdateTaskRequest request, UserPrincipal currentUser);

    TaskResponse assignTask(Long id, AssignTaskRequest request, UserPrincipal currentUser);

    TaskResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request, UserPrincipal currentUser);

    TaskResponse getTaskById(Long id, UserPrincipal currentUser);

    List<TaskResponse> getTasks(Long departmentId, Long assigneeId, TaskStatus status, UserPrincipal currentUser);

    List<TaskResponse> getMyTasks(TaskStatus status, UserPrincipal currentUser);

    void deleteTask(Long id, UserPrincipal currentUser);
}
