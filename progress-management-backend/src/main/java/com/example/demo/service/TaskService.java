package com.example.demo.service;

import com.example.demo.constant.TaskStatus;
import com.example.demo.dto.request.AssignTaskRequest;
import com.example.demo.dto.request.CreateTaskRequest;
import com.example.demo.dto.request.UpdateTaskRequest;
import com.example.demo.dto.request.UpdateTaskStatusRequest;
import com.example.demo.dto.response.TaskResponse;
import com.example.demo.security.UserPrincipal;

import java.util.List;

/**
 * Service interface for managing tasks, status workflows, and task assignments.
 */
public interface TaskService {

    /**
     * Creates a new task within a project.
     *
     * @param request task creation payload
     * @param currentUser principal of the user creating the task
     * @return created task response
     */
    TaskResponse createTask(CreateTaskRequest request, UserPrincipal currentUser);

    /**
     * Updates an existing task's information.
     *
     * @param id task ID to update
     * @param request task update payload
     * @param currentUser principal of the user updating the task
     * @return updated task response
     */
    TaskResponse updateTask(Long id, UpdateTaskRequest request, UserPrincipal currentUser);

    /**
     * Assigns a task to a user.
     *
     * @param id task ID to assign
     * @param request task assignment payload
     * @param currentUser principal of the user performing the assignment
     * @return updated task response
     */
    TaskResponse assignTask(Long id, AssignTaskRequest request, UserPrincipal currentUser);

    /**
     * Updates the status of a task and triggers relevant status change notifications.
     *
     * @param id task ID to update status
     * @param request task status update payload
     * @param currentUser principal of the user performing status change
     * @return updated task response
     */
    TaskResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request, UserPrincipal currentUser);

    /**
     * Retrieves details of a specific task.
     *
     * @param id task ID
     * @param currentUser principal of the authenticated user
     * @return task response
     */
    TaskResponse getTaskById(Long id, UserPrincipal currentUser);

    /**
     * Retrieves tasks filtered by project, assignee, or status based on caller's role.
     *
     * @param projectId optional project ID filter
     * @param assigneeId optional assignee user ID filter
     * @param status optional status filter
     * @param currentUser principal of the authenticated user
     * @return list of matching task responses
     */
    List<TaskResponse> getTasks(Long projectId, Long assigneeId, TaskStatus status, UserPrincipal currentUser);

    /**
     * Retrieves tasks assigned to the current authenticated user.
     *
     * @param status optional status filter
     * @param currentUser principal of the authenticated user
     * @return list of assigned task responses
     */
    List<TaskResponse> getMyTasks(TaskStatus status, UserPrincipal currentUser);

    /**
     * Cancels a task by setting its status to CANCELLED (Leader permission required).
     *
     * @param id task ID to cancel
     * @param currentUser principal of the authenticated user
     * @return updated task response
     */
    TaskResponse cancelTask(Long id, UserPrincipal currentUser);

    /**
     * Deletes a task by its ID.
     *
     * @param id task ID to delete
     * @param currentUser principal of the authenticated user
     */
    void deleteTask(Long id, UserPrincipal currentUser);
}
