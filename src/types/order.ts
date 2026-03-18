export type OrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "picking"
  | "delivering"
  | "completed"
  | "claimed";

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
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

export interface OrderSummary {
  id: string;
  storeId: string;
  status: OrderStatus;
  deliveryDate: string;
  createdAt: string;
  store?: {
    name?: string;
  };
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
