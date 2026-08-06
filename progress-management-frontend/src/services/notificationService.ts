const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'NEW_COMMENT';

export interface NotificationDTO {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  taskId?: number;
  commentId?: number;
  isRead: boolean;
  createdAt: string;
}

export async function getUserNotificationsApi(): Promise<NotificationDTO[]> {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy danh sách thông báo');
  }
  return data;
}

export async function getUnreadNotificationCountApi(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy số thông báo chưa đọc');
  }
  return data.unreadCount || 0;
}

export async function markNotificationAsReadApi(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Không thể đánh dấu đã đọc');
  }
}

export async function markAllNotificationsAsReadApi(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Không thể đánh dấu tất cả đã đọc');
  }
}
