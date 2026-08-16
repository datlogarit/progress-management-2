package com.example.demo.service;

import com.example.demo.dto.request.CreateProjectRequest;
import com.example.demo.dto.request.UpdateProjectRequest;
import com.example.demo.dto.response.ProjectResponse;

import com.example.demo.security.UserPrincipal;

import java.util.List;

/**
 * Service interface for project management operations.
 */
public interface ProjectService {

    /**
     * Retrieves all projects accessible by the current user or filtered by department.
     *
     * @param departmentId optional department ID to filter projects
     * @param currentUser the principal of the authenticated user
     * @return a list of project responses
     */
    List<ProjectResponse> getAllProjects(Long departmentId, UserPrincipal currentUser);

    /**
     * Retrieves a single project by its unique ID.
     *
     * @param id the project ID
     * @param currentUser the principal of the authenticated user
     * @return the project response
     */
    ProjectResponse getProjectById(Long id, UserPrincipal currentUser);

    /**
     * Creates a new project with members and managers.
     *
     * @param request the project creation payload
     * @return the created project response
     */
    ProjectResponse createProject(CreateProjectRequest request);

    /**
     * Updates details and member assignments for an existing project.
     *
     * @param id the project ID to update
     * @param request the project update payload
     * @return the updated project response
     */
    ProjectResponse updateProject(Long id, UpdateProjectRequest request);

    /**
     * Deletes a project by its unique ID.
     *
     * @param id the project ID to delete
     */
    void deleteProject(Long id);
}
