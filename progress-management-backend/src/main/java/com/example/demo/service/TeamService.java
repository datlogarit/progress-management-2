package com.example.demo.service;

import com.example.demo.dto.request.CreateTeamRequest;
import com.example.demo.dto.request.UpdateTeamRequest;
import com.example.demo.dto.response.TeamResponse;

import java.util.List;

public interface TeamService {
    List<TeamResponse> getAllTeams();
    TeamResponse getTeamById(Long id);
    TeamResponse createTeam(CreateTeamRequest request);
    TeamResponse updateTeam(Long id, UpdateTeamRequest request);
    void deleteTeam(Long id);
}
