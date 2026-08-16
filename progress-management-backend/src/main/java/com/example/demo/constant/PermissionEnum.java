package com.example.demo.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionEnum {

    // TASK Permissions
    TASK_READ("Read tasks"),
    TASK_CREATE("Create tasks"),
    TASK_UPDATE("Update tasks"),
    TASK_UPDATE_STATUS("Update task status"),
    TASK_DELETE("Delete tasks"),
    TASK_ASSIGN("Assign tasks to employees"),

    // USER Permissions
    USER_READ("Read users"),
    USER_CREATE("Create users"),
    USER_UPDATE("Update users"),
    USER_DELETE("Delete users"),

    // PROJECT Permissions
    PROJECT_READ("Read projects"),
    PROJECT_CREATE("Create projects"),
    PROJECT_UPDATE("Update projects"),
    PROJECT_DELETE("Delete projects"),

    // DEPARTMENT Permissions
    DEPARTMENT_READ("Read departments"),
    DEPARTMENT_CREATE("Create departments"),
    DEPARTMENT_UPDATE("Update departments"),
    DEPARTMENT_DELETE("Delete departments"),

    // SYSTEM Admin specific
    SYSTEM_MANAGE("Manage system settings");

    private final String description;
}
