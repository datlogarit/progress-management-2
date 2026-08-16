package com.example.demo.service.impl;

import com.example.demo.dto.request.CreateDepartmentRequest;
import com.example.demo.dto.request.UpdateDepartmentRequest;
import com.example.demo.dto.response.DepartmentResponse;
import com.example.demo.entity.Department;
import com.example.demo.entity.Team;
import com.example.demo.entity.User;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.TeamRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link DepartmentService} handling business logic for departments.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        log.info("Fetching all departments");
        return departmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        log.info("Fetching department by id: {}", id);
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return mapToResponse(department);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        log.info("Creating department with name: {}", request.getName());

        if (departmentRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Department name already exists: " + request.getName());
        }

        Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + request.getTeamId()));
        }

        Department department = Department.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .team(team)
                .build();

        Department saved = departmentRepository.save(department);
        return mapToResponse(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request) {
        log.info("Updating department id: {}", id);

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        if (departmentRepository.existsByNameAndIdNot(request.getName().trim(), id)) {
            throw new DuplicateResourceException("Department name already exists: " + request.getName());
        }

        department.setName(request.getName().trim());
        department.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + request.getTeamId()));
            department.setTeam(team);
        } else {
            department.setTeam(null);
        }

        Department updated = departmentRepository.save(department);
        return mapToResponse(updated);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        log.info("Deleting department id: {}", id);

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        // Unassign users from this department prior to deletion to prevent foreign key errors
        List<User> usersInDepartment = userRepository.findByDepartmentId(id);
        if (!usersInDepartment.isEmpty()) {
            log.info("Unassigning {} users from department id: {}", usersInDepartment.size(), id);
            for (User user : usersInDepartment) {
                user.setDepartment(null);
            }
            userRepository.saveAll(usersInDepartment);
        }

        departmentRepository.delete(department);
    }

    /**
     * Maps a {@link Department} entity to a {@link DepartmentResponse} DTO.
     *
     * @param department the department entity
     * @return the mapped department response DTO
     */
    private DepartmentResponse mapToResponse(Department department) {
        long userCount = userRepository.countByDepartmentId(department.getId());
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .teamId(department.getTeam() != null ? department.getTeam().getId() : null)
                .teamName(department.getTeam() != null ? department.getTeam().getName() : null)
                .userCount(userCount)
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}
