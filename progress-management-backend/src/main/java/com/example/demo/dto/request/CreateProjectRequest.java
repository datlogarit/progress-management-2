package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {

    @NotBlank(message = "Tên dự án không được để trống")
    private String name;

    private String description;

    @NotNull(message = "ID phòng ban không được để trống")
    private Long departmentId;

    private List<ProjectMemberRequest> projectMembers;

    private List<Long> memberIds;

    private List<Long> managerIds;
}
