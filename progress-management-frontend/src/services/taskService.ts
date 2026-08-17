import { API_BASE_URL } from '../config';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserSummary {
  id: number;
  username: string;
  fullName: string;
  email: string;
}

export interface TaskDTO {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdBy: UserSummary;
  assignee?: UserSummary;
  projectId: number;
  projectName: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function isTaskStatusLocked(task?: TaskDTO | null): boolean {
  if (!task || task.status !== 'COMPLETED' || !task.completedAt) return false;
  const completedTime = new Date(task.completedAt).getTime();
  const ONE_HOUR_MS = 60 * 60 * 1000;
  // const ONE_HOUR_MS = 10000;
  return Date.now() - completedTime > ONE_HOUR_MS;
}

export interface CommentDTO {
  id: number;
  taskId: number;
  user: UserSummary;
  content: string;
  createdAt: string;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: number | null;
  projectId?: number | null;
}

export interface UpdateTaskParams {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: number | null;
}

export interface GetTasksParams {
  projectId?: number;
  assigneeId?: number;
  status?: TaskStatus;
}

export async function getTasksApi(params?: GetTasksParams): Promise<TaskDTO[]> {
  const query = new URLSearchParams();
  if (params?.projectId) query.append('projectId', params.projectId.toString());
  if (params?.assigneeId) query.append('assigneeId', params.assigneeId.toString());
  if (params?.status) query.append('status', params.status);

  const url = `${API_BASE_URL}/tasks${query.toString() ? `?${query.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy danh sách công việc');
  }
  return data;
}

export async function getMyTasksApi(status?: TaskStatus): Promise<TaskDTO[]> {
  const query = status ? `?status=${status}` : '';
  const response = await fetch(`${API_BASE_URL}/tasks/my-tasks${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy danh sách nhiệm vụ cá nhân');
  }
  return data;
}

export async function getTaskByIdApi(id: number): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy chi tiết công việc');
  }
  return data;
}

export async function createTaskApi(params: CreateTaskParams): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo công việc mới');
  }
  return data;
}

export async function updateTaskApi(id: number, params: UpdateTaskParams): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật công việc');
  }
  return data;
}

export async function assignTaskApi(id: number, assigneeId: number): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/assign`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ assigneeId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể phân công việc');
  }
  return data;
}

export async function updateTaskStatusApi(id: number, status: TaskStatus): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật trạng thái công việc');
  }
  return data;
}

export async function cancelTaskApi(id: number): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/cancel`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Không thể hủy công việc');
  }
  return data;
}

export async function deleteTaskApi(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Không thể xóa công việc');
  }
}

// Comment APIs
export async function getTaskCommentsApi(taskId: number): Promise<CommentDTO[]> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy bình luận của công việc');
  }
  return data;
}

export async function addCommentApi(taskId: number, content: string): Promise<CommentDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể gửi bình luận');
  }
  return data;
}
