import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/authStore";

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 20000,
  headers: { "Content-Type": "application/json" },
});

// ──── Request Interceptor: Gắn Bearer Token vào mỗi request ────
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ──── Cơ chế chống gọi refresh-token đồng thời (race condition) ────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** Giải phóng hàng đợi sau khi refresh thành công / thất bại */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ──── Response Interceptor: Unwrap data + Silent Refresh Token ────
apiClient.interceptors.response.use(
  (response) => {
    // Tự động bóc lớp wrapper { statusCode, data, message }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── Chỉ xử lý 401 và chưa retry lần nào (tránh infinity loop) ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu request gặp 401 chính là /auth/refresh-token → không retry nữa
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        console.log("Refresh token hết hạn → Đăng xuất");
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // Kiểm tra có refresh_token trong SecureStore không
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      if (!refreshToken) {
        console.log("Không tìm thấy refresh_token → Đăng xuất");
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // Nếu đang refresh rồi → đưa request vào hàng đợi chờ kết quả
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        });
      }

      // Đánh dấu đã retry và đang refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Import động authApi để tránh circular dependency
        const { authApi } = await import("./auth.api");
        const data = await authApi.refreshToken({ refreshToken });

        // Lưu token mới vào SecureStore
        await Promise.all([
          SecureStore.setItemAsync("access_token", data.accessToken),
          SecureStore.setItemAsync("refresh_token", data.refreshToken),
        ]);

        // Cập nhật token trong Zustand store
        useAuthStore.getState().updateToken(data.accessToken);

        // Giải phóng hàng đợi với token mới
        processQueue(null, data.accessToken);

        // Retry request ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại → đăng xuất toàn bộ
        console.log("Refresh token thất bại → Đăng xuất");
        processQueue(refreshError, null);
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Xử lý lỗi chung (không phải 401) ──
    const errorMessage =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      "Lỗi kết nối Server";
    return Promise.reject(new Error(errorMessage));
  },
);

export default apiClient;
