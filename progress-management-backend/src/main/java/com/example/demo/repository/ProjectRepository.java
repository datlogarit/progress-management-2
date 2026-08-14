package com.example.demo.repository;

import com.example.demo.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.projectMembers pm WHERE p.department.id = :departmentId")
    List<Project> findByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.projectMembers pm WHERE p.id IN (SELECT pm2.project.id FROM ProjectMember pm2 WHERE pm2.user.id = :userId)")
    List<Project> findByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.projectMembers pm WHERE p.department.id = :departmentId AND p.id IN (SELECT pm2.project.id FROM ProjectMember pm2 WHERE pm2.user.id = :userId)")
    List<Project> findByDepartmentIdAndUserId(@Param("departmentId") Long departmentId, @Param("userId") Long userId);
}
