package com.example.demo.service.impl;

import com.example.demo.dto.request.CreateProjectRequest;
import com.example.demo.dto.request.UpdateProjectRequest;
import com.example.demo.dto.response.ProjectResponse;
import com.example.demo.dto.response.UserSummaryDto;
import com.example.demo.entity.Department;
import com.example.demo.entity.Project;
import com.example.demo.entity.User;
import com.example.demo.exception.CustomException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.example.demo.security.UserPrincipal;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects(Long departmentId, UserPrincipal currentUser) {
        log.info("Fetching projects, departmentId={}", departmentId);
        
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        List<Project> projects;
        if (departmentId != null) {
            projects = projectRepository.findByDepartmentId(departmentId);
        } else {
            projects = projectRepository.findAll();
        }

        if (!"ADMIN".equals(user.getRole().getName())) {
            projects = projects.stream()
                    .filter(p -> p.getMembers().stream().anyMatch(member -> member.getId().equals(user.getId())))
                    .collect(Collectors.toList());
        }

        return projects.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id, UserPrincipal currentUser) {
        log.info("Fetching project by id={}", id);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (currentUser != null) {
            User user = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

            if (!"ADMIN".equals(user.getRole().getName())) {
                boolean isMember = project.getMembers().stream()
                        .anyMatch(member -> member.getId().equals(user.getId()));
                if (!isMember) {
                    throw new CustomException("You do not have permission to view this project", HttpStatus.FORBIDDEN, "ACCESS_DENIED");
                }
            }
        }

        return mapToResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        log.info("Creating new project: {}", request.getName());

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        Set<User> members = new HashSet<>();
        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            List<User> users = userRepository.findAllById(request.getMemberIds());
            for (User user : users) {
                if (user.getDepartment() == null || !user.getDepartment().getId().equals(department.getId())) {
                    throw new CustomException("User " + user.getUsername() + " does not belong to the selected department", HttpStatus.BAD_REQUEST, "INVALID_MEMBER");
                }
            }
            members.addAll(users);
        }

        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .department(department)
                .status("ACTIVE")
                .members(members)
                .build();

        Project saved = projectRepository.save(project);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long id, UpdateProjectRequest request) {
        log.info("Updating project id={}", id);

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }

        if (request.getMemberIds() != null) {
            List<User> users = userRepository.findAllById(request.getMemberIds());
            for (User user : users) {
                if (user.getDepartment() == null || !user.getDepartment().getId().equals(project.getDepartment().getId())) {
                    throw new CustomException("User " + user.getUsername() + " does not belong to the project's department", HttpStatus.BAD_REQUEST, "INVALID_MEMBER");
                }
            }
            project.setMembers(new HashSet<>(users));
        }

        Project updated = projectRepository.save(project);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        log.info("Deleting project id={}", id);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    private ProjectResponse mapToResponse(Project project) {
        List<UserSummaryDto> memberDtos = project.getMembers().stream()
                .map(user -> UserSummaryDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .build())
                .collect(Collectors.toList());

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .departmentId(project.getDepartment().getId())
                .departmentName(project.getDepartment().getName())
                .status(project.getStatus())
                .members(memberDtos)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
