package com.example.demo.service.impl;

import com.example.demo.dto.request.ChangePasswordRequest;
import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.Department;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.CustomException;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtTokenProvider;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of {@link AuthService} handling authentication, registration, and credential security.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Attempting login for user: {}", request.getUsernameOrEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new UnauthorizedException("User account has been deactivated");
        }

        String jwt = tokenProvider.generateToken(authentication);
        return AuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user with username: {} and email: {}", request.getUsername(), request.getEmail());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is already taken: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered: " + request.getEmail());
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
        }

        boolean isAdmin = Boolean.TRUE.equals(request.getIsAdmin()) || (request.getRole() == com.example.demo.constant.RoleEnum.ADMIN);

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .isAdmin(isAdmin)
                .department(department)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        UserPrincipal userPrincipal = UserPrincipal.create(savedUser);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, userPrincipal.getAuthorities()
        );

        String jwt = tokenProvider.generateToken(authentication);
        return AuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .user(mapToUserResponse(savedUser))
                .build();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        log.info("Changing password for user id: {}", userId);

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new CustomException("New password and confirmation password do not match", HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToUserResponse(user);
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
