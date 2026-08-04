package com.example.demo.dto.request;

import com.example.demo.constant.RoleEnum;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignRoleRequest {

    @NotNull(message = "Role is required")
    private RoleEnum role;

    private Long reassignToUserId;
}
