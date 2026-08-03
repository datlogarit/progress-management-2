package com.example.demo.service;

import com.example.demo.dto.request.CreateDepartmentRequest;
import com.example.demo.dto.request.UpdateDepartmentRequest;
import com.example.demo.dto.response.DepartmentResponse;

import java.util.List;

public interface DepartmentService {

    List<DepartmentResponse> getAllDepartments();

    DepartmentResponse getDepartmentById(Long id);

    DepartmentResponse createDepartment(CreateDepartmentRequest request);

    DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request);

    void deleteDepartment(Long id);
}
