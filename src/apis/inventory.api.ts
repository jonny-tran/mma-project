import type { InventoryItem } from "../types/shipment";
import apiClient from "./client";

export interface InventoryTransaction {
  id: number;
  type: "import" | "export" | "waste" | "adjustment";
  quantity: number;
  createdAt: string;
  batchCode: string;
  productName: string;
  note?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const inventoryApi = {
  fetchStoreInventory: async (
    search?: string
  ): Promise<InventoryItem[]> => {
    const response = await apiClient.get<unknown, any>(
      "/inventory/store",
      { params: { search } }
    );
    if (Array.isArray(response)) return response;
    if (response?.items && Array.isArray(response.items)) return response.items;
    if (response?.data && Array.isArray(response.data)) return response.data;
    return [];
  },

  fetchStoreTransactions: async (params?: {
    type?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InventoryTransaction>> => {
    const response = await apiClient.get<
      unknown,
      PaginatedResponse<InventoryTransaction>
    >("/inventory/store/transactions", { params });
    return response;
  },
};
