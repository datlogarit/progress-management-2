package com.example.demo.service.impl;

import com.example.demo.constant.NotificationType;
import com.example.demo.constant.TaskPriority;
import com.example.demo.constant.TaskStatus;
import com.example.demo.dto.request.AssignTaskRequest;
import com.example.demo.dto.request.CreateTaskRequest;
import com.example.demo.dto.request.UpdateTaskRequest;
import com.example.demo.dto.request.UpdateTaskStatusRequest;
import com.example.demo.dto.response.TaskResponse;
import com.example.demo.dto.response.UserSummaryDto;
import com.example.demo.entity.Project;
import com.example.demo.entity.Task;
import com.example.demo.entity.User;
import com.example.demo.exception.CustomException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.repository.ProjectRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TaskResponse createTask(CreateTaskRequest request, UserPrincipal currentUser) {
        log.info("Creating new task: {} by user: {}", request.getTitle(), currentUser.getUsername());

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        if (request.getProjectId() == null) {
            throw new CustomException("projectId is required", HttpStatus.BAD_REQUEST, "MISSING_PROJECT_ID");
        }

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        validateProjectPermission(creator, project);

        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDateTime.now())) {
            throw new CustomException("Hạn hoàn thành phải ở thời điểm trong tương lai", HttpStatus.BAD_REQUEST, "INVALID_DUE_DATE");
        }

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found with id: " + request.getAssigneeId()));

            if (!project.getMembers().contains(assignee)) {
                throw new CustomException("Assignee is not a member of the project", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
            }

            if (!"EMPLOYEE".equals(assignee.getRole().getName())) {
                throw new CustomException("Chỉ được giao công việc cho Nhân viên", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
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
                .project(project)
                .build();

        Task savedTask = taskRepository.save(task);

        if (assignee != null) {
            notificationService.sendNotification(
                    assignee,
                    "Bạn được giao công việc mới",
                    String.format("Bạn được giao công việc '%s' trong dự án %s", savedTask.getTitle(), project.getName()),
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

        validateProjectPermission(user, task.getProject());

        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDateTime.now())) {
            throw new CustomException("Hạn hoàn thành phải ở thời điểm trong tương lai", HttpStatus.BAD_REQUEST, "INVALID_DUE_DATE");
        }

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }

        task.setDueDate(request.getDueDate());

        if (request.getAssigneeId() != null) {
            User oldAssignee = task.getAssignee();
            if (oldAssignee == null || !oldAssignee.getId().equals(request.getAssigneeId())) {
                User newAssignee = userRepository.findById(request.getAssigneeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

                if (!task.getProject().getMembers().contains(newAssignee)) {
                    throw new CustomException("Assignee is not a member of the project", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
                }

                if (!"EMPLOYEE".equals(newAssignee.getRole().getName())) {
                    throw new CustomException("Chỉ được giao công việc cho Nhân viên", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
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

        validateProjectPermission(user, task.getProject());

        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with id: " + request.getAssigneeId()));

        if (!task.getProject().getMembers().contains(assignee)) {
            throw new CustomException("Assignee is not a member of the project", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
        }

        if (!"EMPLOYEE".equals(assignee.getRole().getName())) {
            throw new CustomException("Chỉ được giao công việc cho Nhân viên", HttpStatus.BAD_REQUEST, "INVALID_ASSIGNEE");
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

        boolean isCreator = task.getCreatedBy().getId().equals(user.getId());
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(user.getId());
        boolean isAdmin = "ADMIN".equals(user.getRole().getName());
        boolean isLeader = "LEADER".equals(user.getRole().getName());

        if (isLeader && !isAssignee && request.getStatus() != TaskStatus.CANCELLED) {
            throw new UnauthorizedException("Trưởng dự án chỉ có quyền hủy công việc, không được chuyển trạng thái khác.");
        }

        if (!isAssignee && !isAdmin && !(isLeader && request.getStatus() == TaskStatus.CANCELLED)) {
            throw new UnauthorizedException("Bạn không có quyền cập nhật trạng thái công việc này");
        }

        TaskStatus oldStatus = task.getStatus();
        task.setStatus(request.getStatus());
        Task updatedTask = taskRepository.save(task);

        String notificationMsg = String.format("Trạng thái công việc '%s' đã thay đổi từ %s sang %s",
                task.getTitle(), oldStatus, request.getStatus());

        if (!isCreator) {
            notificationService.sendNotification(
                    task.getCreatedBy(),
                    "Trạng thái công việc thay đổi",
                    notificationMsg,
                    NotificationType.TASK_STATUS_CHANGED,
                    task.getId()
            );
        }

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

        if (!"ADMIN".equals(user.getRole().getName())) {
            if (!task.getProject().getMembers().contains(user)) {
                throw new UnauthorizedException("You do not have permission to view this task");
            }
        }

        return mapToTaskResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Long projectId, Long assigneeId, TaskStatus status, UserPrincipal currentUser) {
        log.info("Fetching tasks filter projectId: {}, assigneeId: {}, status: {}", projectId, assigneeId, status);

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        List<Task> tasks;
        if (!"ADMIN".equals(user.getRole().getName())) {
            // For non-admins, if they don't provide a projectId, they can only see tasks of projects they are in.
            // But we'll simplify and say they MUST provide projectId or they just get assigned tasks?
            // Let's get all tasks they have access to. 
            // It's easier if we filter based on members. For now, let's keep it simple.
            if (projectId != null) {
                Project p = projectRepository.findById(projectId).orElse(null);
                if (p == null || !p.getMembers().contains(user)) {
                    return List.of();
                }
            } else {
                // If they ask for all tasks, only return their assigned tasks or tasks from their projects.
                // We'll fallback to findByAssigneeId for employees.
                if ("EMPLOYEE".equals(user.getRole().getName())) {
                    assigneeId = user.getId();
                }
            }
        }

        if (projectId != null && assigneeId != null && status != null) {
            tasks = taskRepository.findByProjectIdAndAssigneeIdAndStatus(projectId, assigneeId, status);
        } else if (projectId != null && assigneeId != null) {
            tasks = taskRepository.findByProjectIdAndAssigneeId(projectId, assigneeId);
        } else if (projectId != null && status != null) {
            tasks = taskRepository.findByProjectIdAndStatus(projectId, status);
        } else if (projectId != null) {
            tasks = taskRepository.findByProjectId(projectId);
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
    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(TaskStatus status, UserPrincipal currentUser) {
        log.info("Fetching assigned tasks for user id: {}, status: {}", currentUser.getId(), status);
        List<Task> tasks;
        if (status != null) {
            tasks = taskRepository.findByAssigneeIdAndStatus(currentUser.getId(), status);
        } else {
            tasks = taskRepository.findByAssigneeId(currentUser.getId());
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

        validateProjectPermission(user, task.getProject());

        taskRepository.delete(task);
    }

    private void validateProjectPermission(User user, Project project) {
        if ("ADMIN".equals(user.getRole().getName())) {
            return;
        }

        if (!"LEADER".equals(user.getRole().getName())) {
            throw new UnauthorizedException("Only Leaders or Admins can perform this action");
        }

        if (!project.getMembers().contains(user)) {
            throw new UnauthorizedException("You do not have permission to manage tasks in this project");
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
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
