const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface LoginParams {
  usernameOrEmail: string;
  password: string;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'LEADER' | 'EMPLOYEE' | string;
  permissions: string[];
  departmentId: number | null;
  departmentName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  tokenType: string;
  user: UserDTO;
}

export async function loginApi({ usernameOrEmail, password }: LoginParams): Promise<AuthResponseDTO> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usernameOrEmail, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
    throw new Error(errorMessage);
  }

  return data;
}

export async function getCurrentUserApi(token: string): Promise<UserDTO> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Không thể lấy thông tin người dùng');
  }

  return data;
}
