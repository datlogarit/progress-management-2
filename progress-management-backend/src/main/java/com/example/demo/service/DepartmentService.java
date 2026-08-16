package com.example.demo.service;

import com.example.demo.dto.request.CreateDepartmentRequest;
import com.example.demo.dto.request.UpdateDepartmentRequest;
import com.example.demo.dto.response.DepartmentResponse;

import java.util.List;

/**
 * Service interface for department management operations.
 */
public interface DepartmentService {

    /**
     * Retrieves all departments in the system.
     *
     * @return a list of department responses
     */
    List<DepartmentResponse> getAllDepartments();

    /**
     * Retrieves a specific department by its unique ID.
     *
     * @param id the department ID
     * @return the department response
     */
    DepartmentResponse getDepartmentById(Long id);

    /**
     * Creates a new department based on the request data.
     *
     * @param request the department creation request
     * @return the created department response
     */
    DepartmentResponse createDepartment(CreateDepartmentRequest request);

    /**
     * Updates an existing department's details.
     *
     * @param id the department ID to update
     * @param request the department update request
     * @return the updated department response
     */
    DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request);

    /**
     * Deletes a department by its unique ID.
     *
     * @param id the department ID to delete
     */
    void deleteDepartment(Long id);
}
