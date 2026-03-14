export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  storeId?: string | null;
  status?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (
    userData: User,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  updateToken: (token: string) => void;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/** Response trả về từ API POST /auth/refresh-token */
export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/** Response trả về từ API GET /auth/me (đã unwrap data) */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  storeId: string | null;
  status: string;
  createdAt: string;
}

/** Payload cho API POST /auth/logout */
export interface LogoutPayload {
  refreshToken: string;
}
