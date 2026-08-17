import { API_BASE_URL } from '../config';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export interface TeamDTO {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamParams {
  name: string;
  description?: string;
}

export interface UpdateTeamParams {
  name?: string;
  description?: string;
}

export async function getAllTeamsApi(): Promise<TeamDTO[]> {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy danh sách đội nhóm');
  }
  return data;
}

export async function getTeamByIdApi(id: number): Promise<TeamDTO> {
  const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy thông tin đội nhóm');
  }
  return data;
}

export async function createTeamApi(params: CreateTeamParams): Promise<TeamDTO> {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo đội nhóm');
  }
  return data;
}

export async function updateTeamApi(id: number, params: UpdateTeamParams): Promise<TeamDTO> {
  const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật đội nhóm');
  }
  return data;
}

export async function deleteTeamApi(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Không thể xóa đội nhóm');
  }
}
