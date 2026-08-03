package com.example.demo.service.impl;

import com.example.demo.constant.NotificationType;
import com.example.demo.constant.RoleEnum;
import com.example.demo.constant.TaskPriority;
import com.example.demo.constant.TaskStatus;
import com.example.demo.dto.request.AssignTaskRequest;
import com.example.demo.dto.request.CreateTaskRequest;
import com.example.demo.dto.request.UpdateTaskRequest;
import com.example.demo.dto.request.UpdateTaskStatusRequest;
import com.example.demo.dto.response.TaskResponse;
import com.example.demo.dto.response.UserSummaryDto;
import com.example.demo.entity.Department;
import com.example.demo.entity.Task;
import com.example.demo.entity.User;
import com.example.demo.exception.CustomException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.NotificationService;
import com.example.demo.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TaskResponse createTask(CreateTaskRequest request, UserPrincipal currentUser) {
        log.info("Creating new task: {} by user: {}", request.getTitle(), currentUser.getUsername());

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        Long targetDeptId = request.getDepartmentId();
        if (targetDeptId == null) {
            if (creator.getDepartment() != null) {
                targetDeptId = creator.getDepartment().getId();
            } else {
                throw new CustomException("User does not belong to any department and departmentId was not provided", HttpStatus.BAD_REQUEST, "INVALID_DEPARTMENT");
            }
        }

        final Long finalDeptId = targetDeptId;
        Department department = departmentRepository.findById(finalDeptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + finalDeptId));

        // Check permission: Leader can only create tasks for their department (Admin can create anywhere)
        validateDepartmentPermission(creator, department.getId());

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found with id: " + request.getAssigneeId()));

            // Assignee must belong to the department
            if (assignee.getDepartment() == null || !assignee.getDepartment().getId().equals(department.getId())) {
                throw new CustomException("Assignee does not belong to the target department", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
            }
        }

        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .status(TaskStatus.PENDING)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .createdBy(creator)
                .assignee(assignee)
                .department(department)
                .build();

        Task savedTask = taskRepository.save(task);

        // Notify assignee if assigned
        if (assignee != null) {
            notificationService.sendNotification(
                    assignee,
                    "Bạn được giao công việc mới",
                    String.format("Bạn được giao công việc '%s' trong phòng %s", savedTask.getTitle(), department.getName()),
                    NotificationType.TASK_ASSIGNED,
                    savedTask.getId()
            );
        }

        return mapToTaskResponse(savedTask);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest request, UserPrincipal currentUser) {
        log.info("Updating task id: {} by user: {}", id, currentUser.getUsername());

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        validateDepartmentPermission(user, task.getDepartment().getId());

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }

        task.setDueDate(request.getDueDate());

        // Handle assignee update
        if (request.getAssigneeId() != null) {
            User oldAssignee = task.getAssignee();
            if (oldAssignee == null || !oldAssignee.getId().equals(request.getAssigneeId())) {
                User newAssignee = userRepository.findById(request.getAssigneeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found with id: " + request.getAssigneeId()));

                if (newAssignee.getDepartment() == null || !newAssignee.getDepartment().getId().equals(task.getDepartment().getId())) {
                    throw new CustomException("Assignee does not belong to the task's department", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
                }

                task.setAssignee(newAssignee);
                notificationService.sendNotification(
                        newAssignee,
                        "Bạn được giao công việc mới",
                        String.format("Bạn vừa được gán công việc '%s'", task.getTitle()),
                        NotificationType.TASK_ASSIGNED,
                        task.getId()
                );
            }
        }

        Task updatedTask = taskRepository.save(task);
        return mapToTaskResponse(updatedTask);
    }

    @Override
    @Transactional
    public TaskResponse assignTask(Long id, AssignTaskRequest request, UserPrincipal currentUser) {
        log.info("Assigning task id: {} to assignee: {} by user: {}", id, request.getAssigneeId(), currentUser.getUsername());

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        validateDepartmentPermission(user, task.getDepartment().getId());

        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found with id: " + request.getAssigneeId()));

        if (assignee.getDepartment() == null || !assignee.getDepartment().getId().equals(task.getDepartment().getId())) {
            throw new CustomException("Assignee does not belong to the task's department", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
        }

        task.setAssignee(assignee);
        Task updatedTask = taskRepository.save(task);

        notificationService.sendNotification(
                assignee,
                "Bạn được giao công việc mới",
                String.format("Bạn vừa được phân công làm công việc '%s'", task.getTitle()),
                NotificationType.TASK_ASSIGNED,
                task.getId()
        );

        return mapToTaskResponse(updatedTask);
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(Long id, UpdateTaskStatusRequest request, UserPrincipal currentUser) {
        log.info("Updating status for task id: {} to status: {} by user: {}", id, request.getStatus(), currentUser.getUsername());

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        // User must be creator, assignee, leader of department, or Admin
        boolean isCreator = task.getCreatedBy().getId().equals(user.getId());
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == RoleEnum.ADMIN;
        boolean isLeader = user.getRole() == RoleEnum.LEADER && user.getDepartment() != null && user.getDepartment().getId().equals(task.getDepartment().getId());

        if (!isCreator && !isAssignee && !isAdmin && !isLeader) {
            throw new UnauthorizedException("You do not have permission to update status of this task");
        }

        TaskStatus oldStatus = task.getStatus();
        task.setStatus(request.getStatus());
        Task updatedTask = taskRepository.save(task);

        // Send notification about status change
        String notificationMsg = String.format("Trạng thái công việc '%s' đã thay đổi từ %s sang %s",
                task.getTitle(), oldStatus, request.getStatus());

        // Notify Creator if status updated by someone else
        if (!isCreator) {
            notificationService.sendNotification(
                    task.getCreatedBy(),
                    "Trạng thái công việc thay đổi",
                    notificationMsg,
                    NotificationType.TASK_STATUS_CHANGED,
                    task.getId()
            );
        }

        // Notify Assignee if status updated by someone else
        if (task.getAssignee() != null && !isAssignee) {
            notificationService.sendNotification(
                    task.getAssignee(),
                    "Trạng thái công việc thay đổi",
                    notificationMsg,
                    NotificationType.TASK_STATUS_CHANGED,
                    task.getId()
            );
        }

        return mapToTaskResponse(updatedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id, UserPrincipal currentUser) {
        log.info("Fetching task by id: {}", id);

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        // Validate view permission (must belong to department or be admin)
        if (user.getRole() != RoleEnum.ADMIN) {
            if (user.getDepartment() == null || !user.getDepartment().getId().equals(task.getDepartment().getId())) {
                throw new UnauthorizedException("You do not have permission to view this task");
            }
        }

        return mapToTaskResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Long departmentId, Long assigneeId, TaskStatus status, UserPrincipal currentUser) {
        log.info("Fetching tasks filter departmentId: {}, assigneeId: {}, status: {}", departmentId, assigneeId, status);

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        Long deptIdToSearch = departmentId;
        if (user.getRole() != RoleEnum.ADMIN) {
            if (user.getDepartment() == null) {
                return List.of();
            }
            deptIdToSearch = user.getDepartment().getId();
        }

        List<Task> tasks;
        if (deptIdToSearch != null && status != null) {
            tasks = taskRepository.findByDepartmentIdAndStatus(deptIdToSearch, status);
        } else if (deptIdToSearch != null) {
            tasks = taskRepository.findByDepartmentId(deptIdToSearch);
        } else if (assigneeId != null && status != null) {
            tasks = taskRepository.findByAssigneeIdAndStatus(assigneeId, status);
        } else if (assigneeId != null) {
            tasks = taskRepository.findByAssigneeId(assigneeId);
        } else {
            tasks = taskRepository.findAll();
        }

        return tasks.stream()
                .map(this::mapToTaskResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTask(Long id, UserPrincipal currentUser) {
        log.info("Deleting task id: {} by user: {}", id, currentUser.getUsername());

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        validateDepartmentPermission(user, task.getDepartment().getId());

        taskRepository.delete(task);
    }

    private void validateDepartmentPermission(User user, Long targetDepartmentId) {
        if (user.getRole() == RoleEnum.ADMIN) {
            return;
        }

        if (user.getRole() != RoleEnum.LEADER) {
            throw new UnauthorizedException("Only Leaders or Admins can perform this action");
        }

        if (user.getDepartment() == null || !user.getDepartment().getId().equals(targetDepartmentId)) {
            throw new UnauthorizedException("You do not have permission to manage tasks outside your department");
        }
    }

    private TaskResponse mapToTaskResponse(Task task) {
        UserSummaryDto creatorDto = UserSummaryDto.builder()
                .id(task.getCreatedBy().getId())
                .username(task.getCreatedBy().getUsername())
                .fullName(task.getCreatedBy().getFullName())
                .email(task.getCreatedBy().getEmail())
                .build();

        UserSummaryDto assigneeDto = null;
        if (task.getAssignee() != null) {
            assigneeDto = UserSummaryDto.builder()
                    .id(task.getAssignee().getId())
                    .username(task.getAssignee().getUsername())
                    .fullName(task.getAssignee().getFullName())
                    .email(task.getAssignee().getEmail())
                    .build();
        }

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .createdBy(creatorDto)
                .assignee(assigneeDto)
                .departmentId(task.getDepartment().getId())
                .departmentName(task.getDepartment().getName())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
