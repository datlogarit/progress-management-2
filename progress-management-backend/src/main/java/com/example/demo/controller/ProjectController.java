package com.example.demo.controller;

import com.example.demo.dto.request.CreateProjectRequest;
import com.example.demo.dto.request.UpdateProjectRequest;
import com.example.demo.dto.response.ProjectResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.example.demo.annotation.Authorize;
import com.example.demo.constant.PermissionEnum;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Authorize(permission = { PermissionEnum.PROJECT_READ })
    public ResponseEntity<List<ProjectResponse>> getAllProjects(
            @RequestParam(required = false) Long departmentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ProjectResponse> projects = projectService.getAllProjects(departmentId, currentUser);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    @Authorize(permission = { PermissionEnum.PROJECT_READ })
    public ResponseEntity<ProjectResponse> getProjectById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ProjectResponse project = projectService.getProjectById(id, currentUser);
        return ResponseEntity.ok(project);
    }

    @PostMapping
    @Authorize(permission = { PermissionEnum.PROJECT_CREATE })
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse response = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Authorize(permission = { PermissionEnum.PROJECT_UPDATE })
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request) {
        ProjectResponse response = projectService.updateProject(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Authorize(permission = { PermissionEnum.PROJECT_DELETE })
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
