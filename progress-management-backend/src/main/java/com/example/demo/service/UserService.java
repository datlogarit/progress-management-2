package com.example.demo.service;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.UserResponse;

import java.util.List;

/**
 * Service interface for user management, role assignments, and department linkage.
 */
public interface UserService {

    /**
     * Retrieves all users, optionally filtered by department ID.
     *
     * @param departmentId optional department ID to filter users
     * @return a list of user responses
     */
    List<UserResponse> getAllUsers(Long departmentId);

    /**
     * Retrieves a user by their unique ID.
     *
     * @param id the user ID
     * @return the user response
     */
    UserResponse getUserById(Long id);

    /**
     * Creates a new user account.
     *
     * @param request the user creation request
     * @return the created user response
     */
    UserResponse createUser(CreateUserRequest request);

    /**
     * Updates an existing user's details and active status.
     *
     * @param id the user ID to update
     * @param request the user update request
     * @return the updated user response
     */
    UserResponse updateUser(Long id, UpdateUserRequest request);

    /**
     * Resets a user's password directly (admin operation).
     *
     * @param id the user ID
     * @param request password reset request payload
     */
    void resetPassword(Long id, ResetPasswordRequest request);

    /**
     * Assigns a role to a user.
     *
     * @param id the user ID
     * @param request role assignment payload
     * @return the updated user response
     */
    UserResponse assignRole(Long id, AssignRoleRequest request);

    /**
     * Assigns a department to a user.
     *
     * @param id the user ID
     * @param request department assignment payload
     * @return the updated user response
     */
    UserResponse assignDepartment(Long id, AssignDepartmentRequest request);

    /**
     * Deletes a user account and reassigns or clears associated tasks.
     *
     * @param id the user ID to delete
     * @param reassignToUserId optional replacement user ID for tasks
     */
    void deleteUser(Long id, Long reassignToUserId);
}
