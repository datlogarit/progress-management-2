package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Long departmentId;
    private String departmentName;
    private String status;
    private List<ProjectMemberDto> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
