import type {
    PaginatedResponse,
    ShipmentDetail,
    ShipmentListQuery,
    ShipmentSummary,
} from "../types/shipment";
import apiClient from "./client";

export const shipmentApi = {
  /** Danh sách shipments (Manager/Coordinator/Admin) */
  list: async (
    query?: ShipmentListQuery,
  ): Promise<PaginatedResponse<ShipmentSummary>> => {
    const response = await apiClient.get<
      unknown,
      PaginatedResponse<ShipmentSummary>
    >("/shipments", { params: query });
    return response;
  },

  /** Chi tiết shipment */
  getById: async (shipmentId: string): Promise<ShipmentDetail> => {
    const response = await apiClient.get<unknown, ShipmentDetail>(
      `/shipments/${shipmentId}`,
    );
    return response;
  },

  /** Picking list theo shipment (Coordinator/Kitchen/Admin) */
  getPickingList: async (shipmentId: string): Promise<any> => {
    const response = await apiClient.get<unknown, any>(
      `/shipments/${shipmentId}/picking-list`,
    );
    return response;
  },
};
