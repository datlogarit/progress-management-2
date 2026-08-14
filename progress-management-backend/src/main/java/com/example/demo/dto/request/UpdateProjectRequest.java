package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectRequest {

    @NotBlank(message = "Tên dự án không được để trống")
    private String name;

    private String description;
    
    private String status;

    private List<ProjectMemberRequest> projectMembers;

    private List<Long> memberIds;

    private List<Long> managerIds;
}
