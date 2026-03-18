import apiClient from "./client";
import type {
    ApproveOrderPayload,
    ApproveOrderResponse,
    CoordinatorOrderReview,
    OrderDetail,
    OrderListQuery,
    OrderSummary,
    PaginatedResponse,
    RejectOrderPayload,
    RejectOrderResponse,
} from "../types/order";

export const orderApi = {
    /** Danh sách đơn hàng (Coordinator/Manager/Admin) */
    list: async (query?: OrderListQuery): Promise<PaginatedResponse<OrderSummary>> => {
        const response = await apiClient.get<unknown, PaginatedResponse<OrderSummary>>(
            "/orders",
            { params: query },
        );
        return response;
    },

    /** Chi tiết đơn hàng */
    getById: async (orderId: string): Promise<OrderDetail> => {
        const response = await apiClient.get<unknown, OrderDetail>(`/orders/${orderId}`);
        return response;
    },

    /** Coordinator: xem đơn + so sánh kho */
    getCoordinatorReview: async (orderId: string): Promise<CoordinatorOrderReview> => {
        const response = await apiClient.get<unknown, CoordinatorOrderReview>(
            `/orders/coordinator/${orderId}/review`,
        );
        return response;
    },

    /** Coordinator: duyệt đơn (partial fulfillment) */
    approveCoordinator: async (
        orderId: string,
        payload: ApproveOrderPayload = {},
    ): Promise<ApproveOrderResponse> => {
        const response = await apiClient.patch<unknown, ApproveOrderResponse>(
            `/orders/coordinator/${orderId}/approve`,
            payload,
        );
        return response;
    },

    /** Coordinator: từ chối đơn */
    rejectCoordinator: async (
        orderId: string,
        payload: RejectOrderPayload,
    ): Promise<RejectOrderResponse> => {
        const response = await apiClient.patch<unknown, RejectOrderResponse>(
            `/orders/coordinator/${orderId}/reject`,
            payload,
        );
        return response;
    },
};
