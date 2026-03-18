export type OrderStatus =
    | "pending"
    | "approved"
    | "shipping"
    | "completed"
    | "cancelled"
    | "rejected"
    | "claimed"
    | "picking"
    | "delivering";

export type SortOrder = "ASC" | "DESC";

export interface PaginatedMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginatedMeta;
}

export interface OrderListQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
    status?: OrderStatus;
    search?: string;
    storeId?: string;
    fromDate?: string;
    toDate?: string;
}

export interface OrderSummary {
    id: string;
    storeId: string;
    status: OrderStatus;
    deliveryDate: string;
    createdAt: string;
}

export interface OrderDetail {
    id: string;
    storeId: string;
    status: OrderStatus;
    deliveryDate: string;
    createdAt: string;
    items?: Array<{
        productId: number;
        quantity: number;
        productName?: string;
        unit?: string;
    }>;
}

// ──── Store Ordering Types ────

export interface CreateOrderItem {
    productId: number;
    quantity: number;
}

export interface CreateOrderPayload {
    deliveryDate: string;
    items: CreateOrderItem[];
}

export interface StoreOrderItem {
    productId: string;
    quantityRequested: number;
    quantityApproved?: number;
    productName?: string;
    unit?: string;
}

export interface StoreOrder {
    id: string;
    orderCode: string;
    status: OrderStatus;
    createdAt: string;
    items: StoreOrderItem[];
    totalItems: number;
    storeId: string;
}

export interface StoreOrderListQuery {
    page?: number;
    limit?: number;
    status?: OrderStatus;
}

export interface StoreOrderPaginatedResponse {
    items: StoreOrder[];
    meta: PaginatedMeta;
}

export interface CoordinatorReviewItem {
    productId: number;
    productName: string;
    requestedQty: number;
    currentStock: number;
    canFulfill: boolean;
}

export interface CoordinatorOrderReview {
    orderId: string;
    storeName: string;
    status: OrderStatus;
    items: CoordinatorReviewItem[];
}

export interface ApproveOrderPayload {
    force_approve?: boolean;
}

export interface ApproveOrderResultItem {
    productId: number;
    requested: number;
    approved: number;
    missing: number;
}

export interface ApproveOrderResponse {
    orderId: string;
    status: OrderStatus;
    results: ApproveOrderResultItem[];
}

export interface RejectOrderPayload {
    reason: string;
}

export interface RejectOrderResponse {
    orderId: string;
    status: OrderStatus;
    reason?: string;
}
