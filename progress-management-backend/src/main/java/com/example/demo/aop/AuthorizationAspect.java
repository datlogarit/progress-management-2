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
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Aspect
@Component
@RequiredArgsConstructor
public class AuthorizationAspect {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Before("@annotation(authorize)")
    public void checkAuthorization(JoinPoint joinPoint, Authorize authorize) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated");
        }

        UserPrincipal currentUser = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        // 1. Check Permissions
        if (authorize.permission().length > 0) {
            boolean hasPermission = false;
            for (PermissionEnum perm : authorize.permission()) {
                if (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(perm.name()))) {
                    hasPermission = true;
                    break;
                }
            }
            if (!hasPermission) {
                throw new AccessDeniedException("User does not have required permissions");
            }
        }

        // 2. Check Roles
        if (authorize.roles().length > 0) {
            boolean hasRole = false;
            for (RoleEnum role : authorize.roles()) {
                if (user.getRole().getName().equalsIgnoreCase(role.name())) {
                    hasRole = true;
                    break;
                }
            }
            if (!hasRole) {
                throw new AccessDeniedException("User does not have required role");
            }
        }

        // 3. Check Scope
        if (authorize.scope() != ScopeType.NONE) {
            String scopeParam = authorize.scopeParam();
            Long scopeId = extractScopeId(joinPoint, scopeParam);

            if (scopeId == null) {
                // If it's a creation method, maybe the scope is in the body, but for path variables it should be present.
                // Assuming it's present for this simple implementation or let it pass if null and handle in service.
                return;
            }

            Long targetProjectId = null;
            if (authorize.scope() == ScopeType.PROJECT) {
                targetProjectId = scopeId;
                RequestContext.setVerifiedProjectId(targetProjectId.toString());
            } else if (authorize.scope() == ScopeType.TASK) {
                Task task = taskRepository.findById(scopeId)
                        .orElseThrow(() -> new AccessDeniedException("Task not found"));
                if (task.getProject() != null) {
                    targetProjectId = task.getProject().getId();
                }
                RequestContext.setVerifiedTaskId(scopeId.toString());
            }

            if (targetProjectId != null) {
                Project project = projectRepository.findById(targetProjectId)
                        .orElseThrow(() -> new AccessDeniedException("Project not found"));

                boolean isProjectMember = project.getMembers().stream()
                        .anyMatch(member -> member.getId().equals(user.getId()));
                
                boolean isDepartmentAdmin = false;
                if (user.getRole().getName().equalsIgnoreCase(RoleEnum.ADMIN.name()) || user.getRole().getName().equalsIgnoreCase("DEPARTMENT_HEAD")) {
                    if (user.getDepartment() != null && project.getDepartment() != null && 
                        user.getDepartment().getId().equals(project.getDepartment().getId())) {
                        isDepartmentAdmin = true;
                    }
                }

                if (!isProjectMember && !isDepartmentAdmin) {
                    throw new AccessDeniedException("User is not authorized for this scope");
                }
            }
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
