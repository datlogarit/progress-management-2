package com.example.demo.repository;

import com.example.demo.constant.TaskStatus;
import com.example.demo.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByProjectIdAndStatus(Long projectId, TaskStatus status);

    List<Task> findByCreatedById(Long createdById);

    List<Task> findByAssigneeId(Long assigneeId);

    List<Task> findByAssigneeIdAndStatus(Long assigneeId, TaskStatus status);

    List<Task> findByProjectIdAndAssigneeId(Long projectId, Long assigneeId);

    List<Task> findByProjectIdAndAssigneeIdAndStatus(Long projectId, Long assigneeId, TaskStatus status);
}
