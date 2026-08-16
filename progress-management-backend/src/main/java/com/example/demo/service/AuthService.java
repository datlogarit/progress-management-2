package com.example.demo.service;

import com.example.demo.dto.request.ChangePasswordRequest;
import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.dto.response.UserResponse;

/**
 * Service interface handling authentication and account operations.
 */
public interface AuthService {

    /**
     * Authenticates a user with username/email and password, returning a JWT token response.
     *
     * @param request login request containing credentials
     * @return authentication response with JWT access token
     */
    AuthResponse login(LoginRequest request);

    /**
     * Registers a new user account and returns an authentication token response.
     *
     * @param request registration request with user details
     * @return authentication response with JWT access token
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Changes password for a specified user.
     *
     * @param userId the user ID changing password
     * @param request password change request containing current and new passwords
     */
    void changePassword(Long userId, ChangePasswordRequest request);

    /**
     * Retrieves the profile information for the currently authenticated user.
     *
     * @param userId the authenticated user ID
     * @return the user profile response
     */
    UserResponse getCurrentUser(Long userId);
}
