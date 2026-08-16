package com.example.demo.config;

import com.example.demo.constant.PermissionEnum;
import com.example.demo.constant.RoleEnum;
import com.example.demo.entity.Permission;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.entity.Team;
import com.example.demo.repository.PermissionRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.TeamRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedPermissions();
        seedRoles();
        seedAdminUser();
        seedTeams();
    }

    private void seedPermissions() {
        log.info("Seeding permissions...");
        Arrays.stream(PermissionEnum.values()).forEach(permissionEnum -> {
            Optional<Permission> existingOpt = permissionRepository.findByName(permissionEnum.name());
            if (existingOpt.isEmpty()) {
                Permission permission = Permission.builder()
                        .name(permissionEnum.name())
                        .description(permissionEnum.getDescription())
                        .build();
                permissionRepository.save(permission);
            }
        });
    }

    private void seedRoles() {
        log.info("Seeding roles...");
        Arrays.stream(RoleEnum.values()).forEach(roleEnum -> {
            Optional<Role> existingOpt = roleRepository.findByName(roleEnum.name());
            if (existingOpt.isEmpty()) {
                Set<Permission> rolePermissions = new HashSet<>();
                if (roleEnum == RoleEnum.ADMIN) {
                    rolePermissions = new HashSet<>(permissionRepository.findAll());
                } else if (roleEnum == RoleEnum.LEADER) {
                    rolePermissions = permissionRepository.findAll().stream()
                            .filter(p -> p.getName().startsWith("TASK_") || p.getName().equals("USER_READ")
                                    || p.getName().equals("DEPARTMENT_READ") || p.getName().equals("PROJECT_READ"))
                            .collect(Collectors.toSet());
                } else if (roleEnum == RoleEnum.EMPLOYEE || roleEnum == RoleEnum.USER) {
                    rolePermissions = permissionRepository.findAll().stream()
                            .filter(p -> p.getName().equals("TASK_READ") || p.getName().equals("TASK_UPDATE")
                                    || p.getName().equals("TASK_UPDATE_STATUS") || p.getName().equals("PROJECT_READ"))
                            .collect(Collectors.toSet());
                }

                Role role = Role.builder()
                        .name(roleEnum.name())
                        .description("Default " + roleEnum.name() + " role")
                        .permissions(rolePermissions)
                        .build();
                roleRepository.save(role);
            }
        });
    }

    private void seedAdminUser() {
        log.info("Seeding admin user...");
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .fullName("System Admin")
                    .isAdmin(true)
                    .isActive(true)
                    .build();
            userRepository.save(admin);
            log.info("Admin user created.");
        }
    }

    private void seedTeams() {
        log.info("Seeding teams...");
        if (teamRepository.count() == 0) {
            Team itTeam = Team.builder()
                    .name("Đội IT")
                    .description("Đội IT tổng hợp bao gồm dev, helpdesk, hạ tầng")
                    .build();
            teamRepository.save(itTeam);

            Team hrTeam = Team.builder()
                    .name("Đội Hành chính Nhân sự")
                    .description("Đội Hành chính Nhân sự")
                    .build();
            teamRepository.save(hrTeam);

            log.info("Sample teams created.");
        }
    }
}
