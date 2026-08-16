package com.example.demo.service.impl;

import com.example.demo.constant.RoleEnum;
import com.example.demo.dto.request.*;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.Department;
import com.example.demo.entity.Task;
import com.example.demo.entity.User;
import com.example.demo.exception.CustomException;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link UserService} managing user accounts, task reassignments, and department bindings.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(Long departmentId) {
        log.info("Fetching all users, departmentId filter: {}", departmentId);
        List<User> users;
        if (departmentId != null) {
            users = userRepository.findByDepartmentId(departmentId);
        } else {
            users = userRepository.findAll();
        }
        return users.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        log.info("Fetching user by id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToUserResponse(user);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating new user with username: {} and email: {}", request.getUsername(), request.getEmail());

        if (Boolean.TRUE.equals(request.getIsAdmin()) || request.getRole() == RoleEnum.ADMIN) {
            throw new CustomException("Cannot create another Admin user", HttpStatus.FORBIDDEN,
                    "FORBIDDEN_ADMIN_ACTION");
        }

        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new DuplicateResourceException("Username is already taken: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new DuplicateResourceException("Email is already registered: " + request.getEmail());
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Department not found with id: " + request.getDepartmentId()));
        }

        boolean isAdmin = Boolean.TRUE.equals(request.getIsAdmin()) || request.getRole() == RoleEnum.ADMIN;

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .isAdmin(isAdmin)
                .department(department)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        log.info("Updating user id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        validateNotAdminTarget(user);

        if (userRepository.existsByEmailAndIdNot(request.getEmail().trim(), id)) {
            throw new DuplicateResourceException("Email is already taken by another user: " + request.getEmail());
        }

        // If user status is changed to inactive (isActive == false)
        if (Boolean.FALSE.equals(request.getIsActive())) {
            List<Task> assignedTasks = taskRepository.findByAssigneeId(id);
            if (!assignedTasks.isEmpty()) {
                if (request.getReassignToUserId() != null) {
                    User newAssignee = userRepository.findById(request.getReassignToUserId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Replacement user not found with id: " + request.getReassignToUserId()));

                    if (!Boolean.TRUE.equals(newAssignee.getIsActive())) {
                        throw new CustomException("Replacement assignee must be active", HttpStatus.BAD_REQUEST,
                                "INVALID_REASSIGNMENT");
                    }
                    if (user.getDepartment() != null && (newAssignee.getDepartment() == null
                            || !newAssignee.getDepartment().getId().equals(user.getDepartment().getId()))) {
                        throw new CustomException("Replacement assignee must belong to the same department",
                                HttpStatus.BAD_REQUEST, "INVALID_REASSIGNMENT");
                    }

                    for (Task task : assignedTasks) {
                        task.setAssignee(newAssignee);
                        taskRepository.save(task);
                    }
                } else {
                    for (Task task : assignedTasks) {
                        task.setAssignee(null);
                        taskRepository.save(task);
                    }
                }
            }
            user.setIsActive(false);
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().trim());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        log.info("Resetting password for user id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        validateNotAdminTarget(user);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public UserResponse assignRole(Long id, AssignRoleRequest request) {
        log.info("Assigning role {} to user id: {}", request.getRole(), id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsAdmin(request.getRole() == RoleEnum.ADMIN);
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public UserResponse assignDepartment(Long id, AssignDepartmentRequest request) {
        log.info("Assigning department id {} to user id: {}", request.getDepartmentId(), id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Department not found with id: " + request.getDepartmentId()));
        }

        user.setDepartment(department);
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void deleteUser(Long id, Long reassignToUserId) {
        log.info("Deleting user id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        validateNotAdminTarget(user);

        List<Task> assignedTasks = taskRepository.findByAssigneeId(id);
        if (!assignedTasks.isEmpty()) {
            if (reassignToUserId != null) {
                User newAssignee = userRepository.findById(reassignToUserId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Replacement user not found with id: " + reassignToUserId));

                if (!Boolean.TRUE.equals(newAssignee.getIsActive())) {
                    throw new CustomException("Replacement user must be active", HttpStatus.BAD_REQUEST,
                            "INVALID_REASSIGNMENT");
                }

                for (Task task : assignedTasks) {
                    task.setAssignee(newAssignee);
                    taskRepository.save(task);
                }
            } else {
                for (Task task : assignedTasks) {
                    task.setAssignee(null);
                    taskRepository.save(task);
                }
            }
        }

        commentRepository.deleteByUserId(id);
        notificationRepository.deleteByRecipientId(id);

        userRepository.delete(user);
    }

    /**
     * Validates that the target user is not an Admin account before modification.
     *
     * @param targetUser the user to validate
     */
    private void validateNotAdminTarget(User targetUser) {
        if (Boolean.TRUE.equals(targetUser.getIsAdmin())) {
            throw new CustomException("Cannot modify or manage Admin accounts", HttpStatus.FORBIDDEN,
                    "FORBIDDEN_ADMIN_ACTION");
        }
    }

    /**
     * Maps a {@link User} entity to a {@link UserResponse} DTO.
     *
     * @param user the user entity
     * @return the mapped user response DTO
     */
    private UserResponse mapToUserResponse(User user) {
        String roleStr = Boolean.TRUE.equals(user.getIsAdmin()) ? "ADMIN" : "USER";
        java.util.List<String> permissions = Boolean.TRUE.equals(user.getIsAdmin())
                ? java.util.List.of("SYSTEM_MANAGE", "USER_READ", "USER_CREATE", "USER_UPDATE", "USER_DELETE",
                        "DEPARTMENT_READ", "DEPARTMENT_CREATE", "DEPARTMENT_UPDATE", "DEPARTMENT_DELETE",
                        "PROJECT_READ", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE",
                        "TASK_READ", "TASK_CREATE", "TASK_UPDATE", "TASK_DELETE", "TASK_ASSIGN")
                : java.util.List.of("TASK_READ", "TASK_CREATE", "TASK_UPDATE", "TASK_ASSIGN", "PROJECT_READ", "USER_READ", "DEPARTMENT_READ");

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(roleStr)
                .isAdmin(user.getIsAdmin())
                .permissions(permissions)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
