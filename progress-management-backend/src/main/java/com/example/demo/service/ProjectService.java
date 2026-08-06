package com.example.demo.service;

import com.example.demo.dto.request.CreateProjectRequest;
import com.example.demo.dto.request.UpdateProjectRequest;
import com.example.demo.dto.response.ProjectResponse;

import java.util.List;

public interface ProjectService {
    List<ProjectResponse> getAllProjects(Long departmentId);
    ProjectResponse getProjectById(Long id);
    ProjectResponse createProject(CreateProjectRequest request);
    ProjectResponse updateProject(Long id, UpdateProjectRequest request);
    void deleteProject(Long id);
}
