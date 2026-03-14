import {
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  RefreshTokenPayload,
  RefreshTokenResponse,
  UserProfile,
} from "../types/auth";
import apiClient from "./client";

export const authApi = {
  /** Đăng nhập */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<unknown, LoginResponse>(
      "/auth/login",
      payload,
    );
    return response;
  },

  /** Làm mới access token bằng refresh token */
  refreshToken: async (
    payload: RefreshTokenPayload,
  ): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<unknown, RefreshTokenResponse>(
      "/auth/refresh-token",
      payload,
    );
    return response;
  },

  /** Lấy thông tin profile của user hiện tại */
  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get<unknown, UserProfile>("/auth/me");
    return response;
  },

  /** Đăng xuất – gửi refresh token lên server để xoá */
  logout: async (payload: LogoutPayload): Promise<void> => {
    await apiClient.post("/auth/logout", payload);
  },
};
