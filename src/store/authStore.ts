import { create } from "zustand";
import { AuthState, User } from "../types/auth";
import { setItemAsync, getItemAsync, deleteItemAsync } from "../utils/storage";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (userData, accessToken, refreshToken) => {
    await Promise.all([
      setItemAsync("access_token", accessToken),
      setItemAsync("refresh_token", refreshToken),
    ]);
    set({ user: userData, token: accessToken, isAuthenticated: true });
  },

  logout: async () => {
    try {
      // Lấy refresh_token trước khi xóa để gọi API đăng xuất trên server
      const refreshToken = await getItemAsync("refresh_token");
      if (refreshToken) {
        const { authApi } = await import("../apis/auth.api");
        await authApi.logout({ refreshToken });
      }
    } catch (error) {
      // Dù API logout lỗi vẫn cho phép xóa token local để user đăng xuất được
      console.warn("API logout thất bại, vẫn tiếp tục xóa token local:", error);
    }

    // Luôn xóa token local bất kể API logout có thành công hay không
    await Promise.all([
      deleteItemAsync("access_token"),
      deleteItemAsync("refresh_token"),
    ]);
    set({ user: null, token: null, isAuthenticated: false });
  },

  /** Cập nhật thông tin user (dùng sau khi gọi getMe) */
  updateUser: (user: User) => {
    set({ user });
  },

  /** Cập nhật access token (dùng bởi interceptor sau khi refresh thành công) */
  updateToken: (token: string) => {
    set({ token });
  },
}));
