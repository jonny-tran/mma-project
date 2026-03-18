import type {
    ApproveOrderPayload,
    ApproveOrderResponse,
    CoordinatorOrderReview,
    CreateOrderPayload,
    OrderDetail,
    OrderListQuery,
    OrderSummary,
    PaginatedResponse,
    RejectOrderPayload,
    RejectOrderResponse,
    StoreOrder,
    StoreOrderListQuery,
    StoreOrderPaginatedResponse,
} from "../types/order";
import type { CatalogResponse, Product } from "../types/product";
import apiClient from "./client";

// ──── Store Staff APIs ────

export const storeOrderApi = {
    getCatalog: async (page = 1, limit = 50): Promise<CatalogResponse> => {
        const response = await apiClient.get<unknown, CatalogResponse>(
            "/orders/catalog",
            { params: { page, limit, sortOrder: "DESC" } },
        );
        return response;
    },

    createOrder: async (payload: CreateOrderPayload): Promise<StoreOrder> => {
        const response = await apiClient.post<unknown, StoreOrder>("/orders", payload);
        return response;
    },

    getMyOrders: async (
        params?: StoreOrderListQuery,
    ): Promise<StoreOrderPaginatedResponse> => {
        const response = await apiClient.get<unknown, StoreOrderPaginatedResponse>(
            "/orders/my-store",
            { params },
        );
        return response;
    },

    getOrderDetail: async (orderId: string): Promise<StoreOrder> => {
        const response = await apiClient.get<unknown, StoreOrder>(
            `/orders/${orderId}`,
        );
        return response;
    },
};

// ──── Coordinator / Admin APIs ────

export const orderApi = {
    list: async (query?: OrderListQuery): Promise<PaginatedResponse<OrderSummary>> => {
        const response = await apiClient.get<unknown, PaginatedResponse<OrderSummary>>(
            "/orders",
            { params: query },
        );
        return response;
    },

    getById: async (orderId: string): Promise<OrderDetail> => {
        const response = await apiClient.get<unknown, OrderDetail>(`/orders/${orderId}`);
        return response;
    },

    getCoordinatorReview: async (orderId: string): Promise<CoordinatorOrderReview> => {
        const response = await apiClient.get<unknown, CoordinatorOrderReview>(
            `/orders/coordinator/${orderId}/review`,
        );
        return response;
    },

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
