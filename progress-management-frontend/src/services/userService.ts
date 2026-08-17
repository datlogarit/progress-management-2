import type { UserDTO } from './authService';
export type { UserDTO };

import { API_BASE_URL } from '../config';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'LEADER' | 'EMPLOYEE';
  departmentId?: number | null;
}

export interface UpdateUserParams {
  email: string;
  fullName: string;
  isActive: boolean;
  reassignToUserId?: number | null;
}

export interface ResetPasswordParams {
  newPassword: string;
}

export interface AssignRoleParams {
  role: 'ADMIN' | 'LEADER' | 'EMPLOYEE';
  reassignToUserId?: number | null;
}

export interface AssignDepartmentParams {
  departmentId: number | null;
}

export async function getAllUsersApi(departmentId?: number): Promise<UserDTO[]> {
  const url = departmentId 
    ? `${API_BASE_URL}/users?departmentId=${departmentId}` 
    : `${API_BASE_URL}/users`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy danh sách người dùng');
  }
  return data;
}

export async function getUserByIdApi(id: number): Promise<UserDTO> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy thông tin người dùng');
  }
  return data;
}

export async function createUserApi(params: CreateUserParams): Promise<UserDTO> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo người dùng mới');
  }
  return data;
}

export async function updateUserApi(id: number, params: UpdateUserParams): Promise<UserDTO> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật người dùng');
  }
  return data;
}

export async function resetPasswordApi(id: number, params: ResetPasswordParams): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể đặt lại mật khẩu');
  }
  return data;
}

export async function assignRoleApi(id: number, params: AssignRoleParams): Promise<UserDTO> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể gán vai trò');
  }
  return data;
}

export async function assignDepartmentApi(id: number, params: AssignDepartmentParams): Promise<UserDTO> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/department`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể gán phòng ban');
  }
  return data;
}

export async function deleteUserApi(id: number, reassignToUserId?: number | null): Promise<void> {
  const url = reassignToUserId 
    ? `${API_BASE_URL}/users/${id}?reassignToUserId=${reassignToUserId}` 
    : `${API_BASE_URL}/users/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Không thể xóa người dùng');
  }
}
