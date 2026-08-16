package com.example.demo.aop;

import com.example.demo.annotation.Authorize;
import com.example.demo.constant.PermissionEnum;
import com.example.demo.constant.RoleEnum;
import com.example.demo.constant.ScopeType;
import com.example.demo.entity.Project;
import com.example.demo.entity.Task;
import com.example.demo.entity.User;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.RequestContext;
import com.example.demo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Component
@RequiredArgsConstructor
public class AuthorizationAspect {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final com.example.demo.repository.ProjectMemberRepository projectMemberRepository;

    @Before("@annotation(authorize)")
    public void checkAuthorization(JoinPoint joinPoint, Authorize authorize) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated");
        }

        UserPrincipal currentUser = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        // boolean isSystemAdmin = Boolean.TRUE.equals(user.getIsAdmin());
        // System Admin has full access to all endpoints
        if (Boolean.TRUE.equals(user.getIsAdmin())) {
            return;
        }

        PermissionEnum[] requiredPermissions = authorize.permission();
        if (requiredPermissions.length == 0) {
            return;
        }

        // Global Authority Check
        boolean hasAuthorityPermission = false;
        for (PermissionEnum perm : requiredPermissions) {
            if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(perm.name()))) {
                hasAuthorityPermission = true;
                break;
            }
        }

        // Scope Check: Only check for TASK scope
        if (authorize.scope() == ScopeType.TASK) {
            String scopeParam = authorize.scopeParam();
            Long scopeId = extractScopeId(joinPoint, scopeParam);

            if (scopeId != null) {
                Long targetProjectId = null;
                boolean isAssignee = false;

                if ("projectId".equals(scopeParam)) {
                    targetProjectId = scopeId;
                    RequestContext.setVerifiedProjectId(targetProjectId.toString());
                } else {
                    Task task = taskRepository.findById(scopeId)
                            .orElseThrow(() -> new AccessDeniedException("Task not found"));

                    if (task.getProject() != null) {
                        targetProjectId = task.getProject().getId();
                    }
                    if (task.getAssignee() != null && task.getAssignee().getId().equals(user.getId())) {
                        isAssignee = true;
                    }

                    RequestContext.setVerifiedTaskId(scopeId.toString());
                    if (targetProjectId != null) {
                        RequestContext.setVerifiedProjectId(targetProjectId.toString());
                    }
                }

                if (targetProjectId != null) {
                    var memberOpt = projectMemberRepository.findByProjectIdAndUserId(targetProjectId, user.getId());
                    boolean isSameDepartmentUser = user.getDepartment() != null
                            && projectRepository.findById(targetProjectId)
                                    .map(p -> p.getDepartment() != null
                                            && p.getDepartment().getId().equals(user.getDepartment().getId()))
                                    .orElse(false);

                    if (memberOpt.isEmpty() && !isSameDepartmentUser) {
                        throw new AccessDeniedException("User is not a member of this project");
                    }

                    boolean isLeader = memberOpt.isPresent()
                            && memberOpt.get().getRole() == com.example.demo.constant.ProjectRoleEnum.LEADER;

                    for (PermissionEnum perm : requiredPermissions) {
                        if (perm == PermissionEnum.TASK_UPDATE_STATUS) {
                            // Rule: Chỉ có employee được gán việc mới có thể thay đổi trạng thái task
                            if (!isAssignee) {
                                throw new AccessDeniedException(
                                        "Chỉ có nhân viên được gán việc mới có thể thay đổi trạng thái công việc");
                            }
                        } else if (perm == PermissionEnum.TASK_UPDATE || perm == PermissionEnum.TASK_CREATE
                                || perm == PermissionEnum.TASK_DELETE || perm == PermissionEnum.TASK_ASSIGN) {
                            // Rule: Chỉ có trưởng phòng / trưởng dự án quản lý dự án mới có thể thay đổi
                            // thông tin task
                            if (!isLeader) {
                                throw new AccessDeniedException(
                                        "Chỉ có Trưởng dự án / Trưởng phòng quản lý dự án mới có quyền thay đổi thông tin công việc");
                            }
                        } else if (perm == PermissionEnum.TASK_READ || perm == PermissionEnum.PROJECT_READ) {
                            // Rule: 1 user có thể read được task mà mình được giao trong project nếu mình
                            // là thành viên, và nếu làm leader thì có thể xem được toàn bộ task trong
                            // project đó
                            if (!isLeader && !isAssignee) {
                                throw new AccessDeniedException(
                                        "Bạn chỉ có quyền xem công việc được giao cho mình trong dự án này (Trưởng dự án mới có quyền xem toàn bộ công việc)");
                            }
                        }
                    }
                }
            } else if (!hasAuthorityPermission) {
                throw new AccessDeniedException("User does not have required permission for this action");
            }
        } else if (!hasAuthorityPermission) {
            throw new AccessDeniedException("User does not have required permission for this action");
        }
    }

    private Long extractScopeId(JoinPoint joinPoint, String paramName) {
        if (paramName == null || paramName.isEmpty()) {
            return null;
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        // 1. First look for direct parameter match
        for (int i = 0; i < parameterNames.length; i++) {
            if (parameterNames[i].equals(paramName)) {
                if (args[i] instanceof Long) {
                    return (Long) args[i];
                } else if (args[i] instanceof String) {
                    try {
                        return Long.parseLong((String) args[i]);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                }
            }
        }

        // 2. If not found directly, try to extract from DTO objects in arguments
        for (Object arg : args) {
            if (arg != null) {
                try {
                    // Look for field matching the paramName (e.g., "projectId")
                    Method method = null;
                    try {
                        String getterName = "get" + paramName.substring(0, 1).toUpperCase() + paramName.substring(1);
                        method = arg.getClass().getMethod(getterName);
                    } catch (NoSuchMethodException e) {
                        // ignore
                    }
                    if (method != null) {
                        Object val = method.invoke(arg);
                        if (val instanceof Long) {
                            return (Long) val;
                        } else if (val instanceof String) {
                            return Long.parseLong((String) val);
                        }
                    }
                } catch (Exception e) {
                    // Ignore and try next
                }
            }
        }
        return null;
    }
}
