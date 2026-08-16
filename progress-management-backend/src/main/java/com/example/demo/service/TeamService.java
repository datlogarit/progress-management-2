package com.example.demo.service;

import com.example.demo.dto.request.CreateTeamRequest;
import com.example.demo.dto.request.UpdateTeamRequest;
import com.example.demo.dto.response.TeamResponse;

import java.util.List;

/**
 * Service interface for managing team operations.
 */
public interface TeamService {

    /**
     * Retrieves all teams.
     *
     * @return a list of team responses
     */
    List<TeamResponse> getAllTeams();

    /**
     * Retrieves a team by its unique ID.
     *
     * @param id the team ID
     * @return the team response
     */
    TeamResponse getTeamById(Long id);

    /**
     * Creates a new team based on the request payload.
     *
     * @param request the team creation request
     * @return the created team response
     */
    TeamResponse createTeam(CreateTeamRequest request);

    /**
     * Updates an existing team's information.
     *
     * @param id the team ID to update
     * @param request the team update request
     * @return the updated team response
     */
    TeamResponse updateTeam(Long id, UpdateTeamRequest request);

    /**
     * Deletes a team by its unique ID.
     *
     * @param id the team ID to delete
     */
    void deleteTeam(Long id);
}
