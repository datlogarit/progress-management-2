package com.example.demo.dto.response;

import com.example.demo.constant.ProjectRoleEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private ProjectRoleEnum projectRole;
}
