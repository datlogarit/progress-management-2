package com.example.demo.service.impl;

import com.example.demo.constant.RoleEnum;
import com.example.demo.dto.request.*;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.Department;
import com.example.demo.entity.Role;
import com.example.demo.entity.Task;
import com.example.demo.entity.User;
import com.example.demo.exception.CustomException;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.RoleRepository;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

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

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        log.info("Fetching user by id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating new user with username: {} and email: {}", request.getUsername(), request.getEmail());

        if (request.getRole() == RoleEnum.ADMIN) {
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

        Role targetRole = roleRepository.findByName(request.getRole().name())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(targetRole)
                .department(department)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

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

                    if (newAssignee.getId().equals(user.getId())) {
                        throw new CustomException("Cannot reassign tasks to the same user being deactivated",
                                HttpStatus.BAD_REQUEST, "INVALID_REASSIGNMENT");
                    }
                    if (!Boolean.TRUE.equals(newAssignee.getIsActive())) {
                        throw new CustomException("Replacement user must be active", HttpStatus.BAD_REQUEST,
                                "INVALID_REASSIGNMENT");
                    }
                    if (!"EMPLOYEE".equals(newAssignee.getRole().getName())) {
                        throw new CustomException("Replacement user must be an EMPLOYEE", HttpStatus.BAD_REQUEST,
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
                    Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
                    List<User> otherActiveUsers = (deptId != null)
                            ? userRepository.findByDepartmentId(deptId).stream()
                                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && !u.getId().equals(user.getId())
                                            && "EMPLOYEE".equals(u.getRole().getName()))
                                    .collect(Collectors.toList())
                            : userRepository.findAll().stream()
                                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && !u.getId().equals(user.getId())
                                            && "EMPLOYEE".equals(u.getRole().getName()))
                                    .collect(Collectors.toList());

                    if (!otherActiveUsers.isEmpty()) {
                        throw new CustomException(
                                "Tài khoản này đang có công việc được giao. Vui lòng chọn nhân viên trong cùng phòng ban để bàn giao công việc trước khi khóa tài khoản.",
                                HttpStatus.BAD_REQUEST, "REASSIGNMENT_REQUIRED");
                    } else {
                        for (Task task : assignedTasks) {
                            task.setAssignee(null);
                            taskRepository.save(task);
                        }
                    }
                }
            }
        }

        user.setEmail(request.getEmail().trim());
        user.setFullName(request.getFullName().trim());
        user.setIsActive(request.getIsActive());

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

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

    @Override
    @Transactional
    public UserResponse assignRole(Long id, AssignRoleRequest request) {
        log.info("Assigning role {} to user id: {}", request.getRole(), id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        validateNotAdminTarget(user);

        // If promoting from EMPLOYEE to LEADER, reassign tasks
        if ("EMPLOYEE".equals(user.getRole().getName()) && request.getRole() == RoleEnum.LEADER) {
            List<Task> assignedTasks = taskRepository.findByAssigneeId(id);
            if (!assignedTasks.isEmpty()) {
                if (request.getReassignToUserId() != null) {
                    User newAssignee = userRepository.findById(request.getReassignToUserId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Replacement user not found with id: " + request.getReassignToUserId()));

                    if (newAssignee.getId().equals(user.getId())) {
                        throw new CustomException("Cannot reassign tasks to the same user being promoted",
                                HttpStatus.BAD_REQUEST, "INVALID_REASSIGNMENT");
                    }
                    if (!"EMPLOYEE".equals(newAssignee.getRole().getName())) {
                        throw new CustomException("Replacement assignee must be an EMPLOYEE", HttpStatus.BAD_REQUEST,
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
                    Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
                    List<User> otherEmployees = (deptId != null)
                            ? userRepository.findByDepartmentId(deptId).stream()
                                    .filter(u -> "EMPLOYEE".equals(u.getRole().getName())
                                            && !u.getId().equals(user.getId()))
                                    .collect(Collectors.toList())
                            : List.of();

                    if (!otherEmployees.isEmpty()) {
                        throw new CustomException(
                                "Tài khoản này đang có công việc được giao. Vui lòng chọn nhân viên trong phòng để nhận bàn giao lại công việc trước khi nâng cấp thành Trưởng phòng.",
                                HttpStatus.BAD_REQUEST, "REASSIGNMENT_REQUIRED");
                    } else {
                        for (Task task : assignedTasks) {
                            task.setAssignee(null);
                            taskRepository.save(task);
                        }
                    }
                }
            }
        }

        Role targetRole = roleRepository.findByName(request.getRole().name())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        user.setRole(targetRole);
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse assignDepartment(Long id, AssignDepartmentRequest request) {
        log.info("Assigning department id {} to user id: {}", request.getDepartmentId(), id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        validateNotAdminTarget(user);

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

    @Override
    @Transactional
    public void deleteUser(Long id, Long reassignToUserId) {
        log.info("Deleting user id: {}, reassignToUserId: {}", id, reassignToUserId);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        validateNotAdminTarget(user);

        List<Task> assignedTasks = taskRepository.findByAssigneeId(id);
        if (!assignedTasks.isEmpty()) {
            if (reassignToUserId != null) {
                User newAssignee = userRepository.findById(reassignToUserId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Replacement user not found with id: " + reassignToUserId));

                if (newAssignee.getId().equals(user.getId())) {
                    throw new CustomException("Cannot reassign tasks to the user being deleted", HttpStatus.BAD_REQUEST,
                            "INVALID_REASSIGNMENT");
                }
                if (!Boolean.TRUE.equals(newAssignee.getIsActive())) {
                    throw new CustomException("Replacement user must be active", HttpStatus.BAD_REQUEST,
                            "INVALID_REASSIGNMENT");
                }
                if (!"EMPLOYEE".equals(newAssignee.getRole().getName())) {
                    throw new CustomException("Replacement user must be an EMPLOYEE", HttpStatus.BAD_REQUEST,
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
                Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
                List<User> otherActiveUsers = (deptId != null)
                        ? userRepository.findByDepartmentId(deptId).stream()
                                .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && !u.getId().equals(user.getId())
                                        && "EMPLOYEE".equals(u.getRole().getName()))
                                .collect(Collectors.toList())
                        : userRepository.findAll().stream()
                                .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && !u.getId().equals(user.getId())
                                        && "EMPLOYEE".equals(u.getRole().getName()))
                                .collect(Collectors.toList());

                if (!otherActiveUsers.isEmpty()) {
                    throw new CustomException(
                            "Tài khoản này đang có công việc được giao. Vui lòng chọn nhân viên trong cùng phòng ban để bàn giao công việc trước khi xóa tài khoản.",
                            HttpStatus.BAD_REQUEST, "REASSIGNMENT_REQUIRED");
                } else {
                    for (Task task : assignedTasks) {
                        task.setAssignee(null);
                        taskRepository.save(task);
                    }
                }
            }
        }

        // Handle created tasks if any so FK constraint on created_by doesn't fail
        List<Task> createdTasks = taskRepository.findByCreatedById(id);
        if (!createdTasks.isEmpty()) {
            User creatorReplacement = null;
            if (reassignToUserId != null) {
                creatorReplacement = userRepository.findById(reassignToUserId).orElse(null);
            }
            if (creatorReplacement == null) {
                creatorReplacement = userRepository.findAll().stream()
                        .filter(u -> !u.getId().equals(user.getId()) && "ADMIN".equals(u.getRole().getName()))
                        .findFirst()
                        .orElseGet(() -> userRepository.findAll().stream()
                                .filter(u -> !u.getId().equals(user.getId()) && Boolean.TRUE.equals(u.getIsActive()))
                                .findFirst()
                                .orElse(null));
            }
            if (creatorReplacement != null) {
                for (Task task : createdTasks) {
                    task.setCreatedBy(creatorReplacement);
                    taskRepository.save(task);
                }
            }
        }

        commentRepository.deleteByUserId(id);
        notificationRepository.deleteByRecipientId(id);

        userRepository.delete(user);
    }

    private void validateNotAdminTarget(User targetUser) {
        if ("ADMIN".equals(targetUser.getRole().getName())) {
            throw new CustomException("Cannot modify or manage Admin accounts", HttpStatus.FORBIDDEN,
                    "FORBIDDEN_ADMIN_ACTION");
        }
    }

    private UserResponse mapToUserResponse(User user) {
        java.util.List<String> permissions = user.getRole().getPermissions().stream()
                .map(com.example.demo.entity.Permission::getName)
                .collect(Collectors.toList());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .permissions(permissions)
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
