package com.example.demo.security;

public class RequestContext {
    private static final ThreadLocal<String> verifiedProjectId = new ThreadLocal<>();
    private static final ThreadLocal<String> verifiedTaskId = new ThreadLocal<>();

    public static void setVerifiedProjectId(String projectId) {
        verifiedProjectId.set(projectId);
    }

    public static String getVerifiedProjectId() {
        return verifiedProjectId.get();
    }

    public static void setVerifiedTaskId(String taskId) {
        verifiedTaskId.set(taskId);
    }

    public static String getVerifiedTaskId() {
        return verifiedTaskId.get();
    }

    public static void clear() {
        verifiedProjectId.remove();
        verifiedTaskId.remove();
    }
}
