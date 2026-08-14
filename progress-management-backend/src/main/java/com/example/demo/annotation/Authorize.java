package com.example.demo.annotation;

import com.example.demo.constant.PermissionEnum;
import com.example.demo.constant.RoleEnum;
import com.example.demo.constant.ScopeType;

import java.lang.annotation.*;

@Target({ ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Authorize {

    // Required permission for the action. Empty means no specific permission required (just login).
    PermissionEnum[] permission() default {};

    // Allowed roles (deprecated - authorization uses permission instead)
    @Deprecated
    RoleEnum[] roles() default {};

    // Scope for authorization
    ScopeType scope() default ScopeType.NONE;

    // The name of the parameter (e.g., in @PathVariable or @RequestParam) to
    // extract the scope ID
    String scopeParam() default "";
}
