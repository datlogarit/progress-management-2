package com.example.demo.dto.request;

import com.example.demo.constant.ProjectRoleEnum;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberRequest {
    @NotNull(message = "userId is required")
    private Long userId;

    private ProjectRoleEnum role;
}
