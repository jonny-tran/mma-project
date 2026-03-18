import type {
    ClaimDetail,
    ClaimListQuery,
    ClaimSummary,
    PaginatedResponse,
    ResolveClaimPayload,
} from "../types/claim";
import apiClient from "./client";

export const claimApi = {
  /** Danh sách claims (Manager/Coordinator/Admin) */
  list: async (
    query?: ClaimListQuery,
  ): Promise<PaginatedResponse<ClaimSummary>> => {
    const response = await apiClient.get<
      unknown,
      PaginatedResponse<ClaimSummary>
    >("/claims", { params: query });
    return response;
  },

  /** Chi tiết claim */
  getById: async (claimId: string): Promise<ClaimDetail> => {
    const response = await apiClient.get<unknown, ClaimDetail>(
      `/claims/${claimId}`,
    );
    return response;
  },

  /** Coordinator/Manager resolve claim */
  resolve: async (
    claimId: string,
    payload: ResolveClaimPayload,
  ): Promise<any> => {
    const response = await apiClient.patch<unknown, any>(
      `/claims/${claimId}/resolve`,
      payload,
    );
    return response;
  },
};
