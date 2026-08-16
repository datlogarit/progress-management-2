package com.example.demo.service.impl;

import com.example.demo.constant.ProjectRoleEnum;
import com.example.demo.dto.request.CreateProjectRequest;
import com.example.demo.dto.request.ProjectMemberRequest;
import com.example.demo.dto.request.UpdateProjectRequest;
import com.example.demo.dto.response.ProjectMemberDto;
import com.example.demo.dto.response.ProjectResponse;
import com.example.demo.entity.Department;
import com.example.demo.entity.Project;
import com.example.demo.entity.ProjectMember;
import com.example.demo.entity.User;
import com.example.demo.exception.CustomException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ProjectService} managing project lifecycles and team memberships.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects(Long departmentId, UserPrincipal currentUser) {
        log.info("Fetching projects, departmentId={}", departmentId);

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        List<Project> projects;
        if (Boolean.TRUE.equals(user.getIsAdmin())) {
            if (departmentId != null) {
                projects = projectRepository.findByDepartmentId(departmentId);
            } else {
                projects = projectRepository.findAll();
            }
        } else {
            Long targetDeptId = (departmentId != null) ? departmentId
                    : (user.getDepartment() != null ? user.getDepartment().getId() : null);
            if (targetDeptId != null) {
                projects = projectRepository.findByDepartmentId(targetDeptId);
            } else {
                projects = projectRepository.findByUserId(user.getId());
            }
        }

        return projects.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id, UserPrincipal currentUser) {
        log.info("Fetching project by id={}", id);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (currentUser != null) {
            User user = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

            if (!Boolean.TRUE.equals(user.getIsAdmin())) {
                boolean isMember = project.getProjectMembers().stream()
                        .anyMatch(pm -> pm.getUser().getId().equals(user.getId()));
                if (!isMember) {
                    throw new CustomException("You do not have permission to view this project", HttpStatus.FORBIDDEN,
                            "ACCESS_DENIED");
                }
            }
        }

        return mapToResponse(project);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        log.info("Creating new project: {}", request.getName());

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + request.getDepartmentId()));

        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .department(department)
                .status("ACTIVE")
                .projectMembers(new HashSet<>())
                .build();

        Set<ProjectMember> members = buildProjectMembers(project, request.getProjectMembers(), request.getMemberIds(),
                request.getManagerIds(), department);
        project.setProjectMembers(members);

        Project saved = projectRepository.save(project);
        return mapToResponse(saved);
    }

    /**
     * {@inheritDoc}
     */
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

        if (request.getProjectMembers() != null || request.getMemberIds() != null || request.getManagerIds() != null) {
            project.getProjectMembers().clear();
            Set<ProjectMember> updatedMembers = buildProjectMembers(project, request.getProjectMembers(),
                    request.getMemberIds(), request.getManagerIds(), project.getDepartment());
            projectMemberRepository.deleteByProjectId(id);
            projectMemberRepository.flush();
            project.getProjectMembers().clear();
            project.getProjectMembers().addAll(updatedMembers);
        }

        Project updated = projectRepository.save(project);
        return mapToResponse(updated);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void deleteProject(Long id) {
        log.info("Deleting project id={}", id);
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    /**
     * Constructs a set of {@link ProjectMember} entities based on member/manager lists and validates department membership.
     *
     * @param project the project instance
     * @param projectMemberRequests explicit member role requests
     * @param memberIds list of user IDs for employees
     * @param managerIds list of user IDs for leaders
     * @param department the project's department
     * @return a set of populated project member entities
     */
    private Set<ProjectMember> buildProjectMembers(Project project, List<ProjectMemberRequest> projectMemberRequests,
            List<Long> memberIds, List<Long> managerIds, Department department) {
        Map<Long, ProjectRoleEnum> userRoleMap = new HashMap<>();

        if (projectMemberRequests != null && !projectMemberRequests.isEmpty()) {
            for (ProjectMemberRequest pmr : projectMemberRequests) {
                userRoleMap.put(pmr.getUserId(), pmr.getRole() != null ? pmr.getRole() : ProjectRoleEnum.EMPLOYEE);
            }
        }

        if (managerIds != null) {
            for (Long mId : managerIds) {
                userRoleMap.put(mId, ProjectRoleEnum.LEADER);
            }
        }

        if (memberIds != null) {
            for (Long mId : memberIds) {
                userRoleMap.putIfAbsent(mId, ProjectRoleEnum.EMPLOYEE);
            }
        }

        if (userRoleMap.isEmpty()) {
            return new HashSet<>();
        }

        List<User> users = userRepository.findAllById(userRoleMap.keySet());
        Set<ProjectMember> projectMembers = new HashSet<>();

        for (User user : users) {
            if (user.getDepartment() == null || !user.getDepartment().getId().equals(department.getId())) {
                throw new CustomException(
                        "User " + user.getUsername() + " does not belong to department " + department.getName(),
                        HttpStatus.BAD_REQUEST, "INVALID_MEMBER");
            }
            ProjectMember member = ProjectMember.builder()
                    .project(project)
                    .user(user)
                    .role(userRoleMap.get(user.getId()))
                    .build();
            projectMembers.add(member);
        }

        return projectMembers;
    }

    /**
     * Maps a {@link Project} entity to a {@link ProjectResponse} DTO.
     *
     * @param project the project entity
     * @return the mapped project response DTO
     */
    private ProjectResponse mapToResponse(Project project) {
        List<ProjectMemberDto> memberDtos = (project.getProjectMembers() != null)
                ? project.getProjectMembers().stream()
                        .filter(pm -> pm.getUser() != null)
                        .map(pm -> ProjectMemberDto.builder()
                                .id(pm.getUser().getId())
                                .username(pm.getUser().getUsername())
                                .fullName(pm.getUser().getFullName())
                                .email(pm.getUser().getEmail())
                                .projectRole(pm.getRole())
                                .build())
                        .collect(Collectors.toList())
                : List.of();

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .departmentId(project.getDepartment() != null ? project.getDepartment().getId() : null)
                .departmentName(project.getDepartment() != null ? project.getDepartment().getName() : null)
                .status(project.getStatus())
                .members(memberDtos)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
