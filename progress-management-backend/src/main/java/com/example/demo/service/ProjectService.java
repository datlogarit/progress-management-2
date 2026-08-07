package com.example.demo.service;

import com.example.demo.dto.request.CreateProjectRequest;
import com.example.demo.dto.request.UpdateProjectRequest;
import com.example.demo.dto.response.ProjectResponse;

import com.example.demo.security.UserPrincipal;

import java.util.List;

public interface ProjectService {
    List<ProjectResponse> getAllProjects(Long departmentId, UserPrincipal currentUser);
    ProjectResponse getProjectById(Long id, UserPrincipal currentUser);
    ProjectResponse createProject(CreateProjectRequest request);
    ProjectResponse updateProject(Long id, UpdateProjectRequest request);
    void deleteProject(Long id);
}
