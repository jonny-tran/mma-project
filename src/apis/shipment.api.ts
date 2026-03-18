import type {
  ReceiveShipmentDto,
  ReceiveShipmentResponse,
  Shipment,
  ShipmentStatus,
} from "../types/shipment";
import apiClient from "./client";

export const shipmentApi = {
  fetchMyShipments: async (status?: ShipmentStatus): Promise<Shipment[]> => {
    const response = await apiClient.get<unknown, any>(
      "/shipments/store/my",
      { params: { status } }
    );
    if (Array.isArray(response)) return response;
    if (response?.items && Array.isArray(response.items)) return response.items;
    if (response?.data && Array.isArray(response.data)) return response.data;
    return [];
  },

  fetchShipmentDetail: async (id: string): Promise<Shipment> => {
    const response = await apiClient.get<unknown, Shipment>(
      `/shipments/${id}`
    );
    return response;
  },

  submitReceipt: async (
    id: string,
    data: ReceiveShipmentDto
  ): Promise<ReceiveShipmentResponse> => {
    const response = await apiClient.post<unknown, ReceiveShipmentResponse>(
      `/shipments/${id}/receive`,
      data
    );
    return response;
  },

  receiveAll: async (id: string): Promise<ReceiveShipmentResponse> => {
    const response = await apiClient.patch<unknown, ReceiveShipmentResponse>(
      `/shipments/${id}/receive-all`
    );
    return response;
  },
};
