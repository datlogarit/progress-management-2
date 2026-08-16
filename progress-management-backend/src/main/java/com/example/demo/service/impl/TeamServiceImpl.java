package com.example.demo.service.impl;

import com.example.demo.dto.request.CreateTeamRequest;
import com.example.demo.dto.request.UpdateTeamRequest;
import com.example.demo.dto.response.TeamResponse;
import com.example.demo.entity.Team;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.TeamRepository;
import com.example.demo.service.TeamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link TeamService} providing team management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<TeamResponse> getAllTeams() {
        log.info("Fetching all teams");
        return teamRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public TeamResponse getTeamById(Long id) {
        log.info("Fetching team by id={}", id);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
        return mapToResponse(team);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request) {
        log.info("Creating team name={}", request.getName());
        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Team saved = teamRepository.save(team);
        return mapToResponse(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TeamResponse updateTeam(Long id, UpdateTeamRequest request) {
        log.info("Updating team id={}", id);
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        if (request.getName() != null) {
            team.setName(request.getName());
        }
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }

        Team updated = teamRepository.save(team);
        return mapToResponse(updated);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void deleteTeam(Long id) {
        log.info("Deleting team id={}", id);
        if (!teamRepository.existsById(id)) {
            throw new ResourceNotFoundException("Team not found with id: " + id);
        }
        teamRepository.deleteById(id);
    }

    /**
     * Maps a {@link Team} entity to a {@link TeamResponse} DTO.
     *
     * @param team the team entity
     * @return the team response DTO
     */
    private TeamResponse mapToResponse(Team team) {
        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
    }
}
