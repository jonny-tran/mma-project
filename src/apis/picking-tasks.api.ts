import { GetPickingTasksParams, PaginatedResponse, PickingTask } from "../types/picking-tasks";
import apiClient from "./client";

export const pickingTasksApi = {
  /** 
   * Lấy danh sách phiếu nhặt hàng
   * GET /wdp301-api/v1/warehouse/picking-tasks 
   */
  getPickingTasks: async (params?: GetPickingTasksParams): Promise<PaginatedResponse<PickingTask>> => {
    const response = await apiClient.get<unknown, PaginatedResponse<PickingTask>>("/warehouse/picking-tasks", {
      params,
    });
    return response;
  },

  /** 
   * Lấy chi tiết phiếu nhặt hàng
   * GET /wdp301-api/v1/warehouse/picking-tasks/{id}
   */
  getPickingTaskById: async (id: string): Promise<PickingTask> => {
    const response = await apiClient.get<unknown, PickingTask>(`/warehouse/picking-tasks/${id}`);
    return response;
  },

  /** 
   * Đặt lại (reset) phiếu nhặt hàng
   * PATCH /wdp301-api/v1/warehouse/picking-tasks/{orderId}/reset
   */
  resetPickingTask: async (orderId: string): Promise<void> => {
    await apiClient.patch(`/warehouse/picking-tasks/${orderId}/reset`);
  },
};
