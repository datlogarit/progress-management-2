package com.example.demo.service;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers(Long departmentId);

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void resetPassword(Long id, ResetPasswordRequest request);

    UserResponse assignRole(Long id, AssignRoleRequest request);

    UserResponse assignDepartment(Long id, AssignDepartmentRequest request);

    void deleteUser(Long id);
}
