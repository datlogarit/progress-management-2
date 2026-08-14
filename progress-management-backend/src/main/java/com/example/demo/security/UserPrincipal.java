package com.example.demo.security;

import com.example.demo.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String email;
    private final String password;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = new java.util.ArrayList<>();
        if (Boolean.TRUE.equals(user.getIsAdmin())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            authorities.add(new SimpleGrantedAuthority("SYSTEM_MANAGE"));
            authorities.add(new SimpleGrantedAuthority("USER_READ"));
            authorities.add(new SimpleGrantedAuthority("USER_CREATE"));
            authorities.add(new SimpleGrantedAuthority("USER_UPDATE"));
            authorities.add(new SimpleGrantedAuthority("USER_DELETE"));
            authorities.add(new SimpleGrantedAuthority("DEPARTMENT_READ"));
            authorities.add(new SimpleGrantedAuthority("DEPARTMENT_CREATE"));
            authorities.add(new SimpleGrantedAuthority("DEPARTMENT_UPDATE"));
            authorities.add(new SimpleGrantedAuthority("DEPARTMENT_DELETE"));
            authorities.add(new SimpleGrantedAuthority("PROJECT_READ"));
            authorities.add(new SimpleGrantedAuthority("PROJECT_CREATE"));
            authorities.add(new SimpleGrantedAuthority("PROJECT_UPDATE"));
            authorities.add(new SimpleGrantedAuthority("PROJECT_DELETE"));
            authorities.add(new SimpleGrantedAuthority("TASK_READ"));
            authorities.add(new SimpleGrantedAuthority("TASK_CREATE"));
            authorities.add(new SimpleGrantedAuthority("TASK_UPDATE"));
            authorities.add(new SimpleGrantedAuthority("TASK_DELETE"));
            authorities.add(new SimpleGrantedAuthority("TASK_ASSIGN"));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            authorities.add(new SimpleGrantedAuthority("USER_READ"));
            authorities.add(new SimpleGrantedAuthority("DEPARTMENT_READ"));
            authorities.add(new SimpleGrantedAuthority("PROJECT_READ"));
            authorities.add(new SimpleGrantedAuthority("TASK_READ"));
            authorities.add(new SimpleGrantedAuthority("TASK_CREATE"));
            authorities.add(new SimpleGrantedAuthority("TASK_UPDATE"));
            authorities.add(new SimpleGrantedAuthority("TASK_ASSIGN"));
        }

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getIsActive() != null && user.getIsActive(),
                authorities
        );
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
