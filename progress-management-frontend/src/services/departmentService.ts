import { API_BASE_URL } from '../config';

export interface DepartmentDTO {
  id: number;
  name: string;
  description: string | null;
  teamId?: number | null;
  teamName?: string | null;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentParams {
  name: string;
  description?: string;
  teamId?: number | null;
}

export interface UpdateDepartmentParams {
  name: string;
  description?: string;
  teamId?: number | null;
}

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function getAllDepartmentsApi(): Promise<DepartmentDTO[]> {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy danh sách phòng ban');
  }
  return data;
}

export async function getDepartmentByIdApi(id: number): Promise<DepartmentDTO> {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy thông tin phòng ban');
  }
  return data;
}

export async function createDepartmentApi(params: CreateDepartmentParams): Promise<DepartmentDTO> {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo phòng ban');
  }
  return data;
}

export async function updateDepartmentApi(id: number, params: UpdateDepartmentParams): Promise<DepartmentDTO> {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật phòng ban');
  }
  return data;
}

export async function deleteDepartmentApi(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Không thể xóa phòng ban');
  }
}
