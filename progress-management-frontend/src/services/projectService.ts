const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export type ProjectRole = 'LEADER' | 'EMPLOYEE';

export interface ProjectMemberDTO {
  id: number;
  username: string;
  fullName: string;
  email: string;
  projectRole: ProjectRole;
}

export interface ProjectMemberRequest {
  userId: number;
  role: ProjectRole;
}

export interface ProjectDTO {
  id: number;
  name: string;
  description?: string;
  departmentId: number;
  departmentName: string;
  status: string;
  members: ProjectMemberDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  departmentId: number;
  projectMembers?: ProjectMemberRequest[];
  memberIds?: number[];
  managerIds?: number[];
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
  status: string;
  projectMembers?: ProjectMemberRequest[];
  memberIds?: number[];
  managerIds?: number[];
}

export const getProjectsApi = async (departmentId?: number): Promise<ProjectDTO[]> => {
  const url = departmentId ? `${API_BASE_URL}/projects?departmentId=${departmentId}` : `${API_BASE_URL}/projects`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể tải danh sách dự án');
  return data;
};

export const getProjectByIdApi = async (id: number): Promise<ProjectDTO> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể tải dự án');
  return data;
};

export const createProjectApi = async (data: CreateProjectRequest): Promise<ProjectDTO> => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await response.json();
  if (!response.ok) throw new Error(resData.message || 'Lỗi tạo dự án');
  return resData;
};

export const updateProjectApi = async (id: number, data: UpdateProjectRequest): Promise<ProjectDTO> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const resData = await response.json();
  if (!response.ok) throw new Error(resData.message || 'Lỗi cập nhật dự án');
  return resData;
};

export const deleteProjectApi = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Lỗi xóa dự án');
  }
};
