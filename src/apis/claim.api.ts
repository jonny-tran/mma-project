import type { Claim, CreateManualClaimDto } from "../types/shipment";
import apiClient from "./client";

export const claimApi = {
  fetchMyClaims: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Claim[]> => {
    const response = await apiClient.get<unknown, any>(
      "/claims/my-store",
      { params }
    );
    if (Array.isArray(response)) return response;
    if (response?.items && Array.isArray(response.items)) return response.items;
    if (response?.data && Array.isArray(response.data)) return response.data;
    return [];
  },

  fetchClaimDetail: async (id: string): Promise<Claim> => {
    const response = await apiClient.get<unknown, Claim>(`/claims/${id}`);
    return response;
  },

  createManualClaim: async (data: CreateManualClaimDto): Promise<Claim> => {
    const response = await apiClient.post<unknown, Claim>("/claims", data);
    return response;
  },
};
