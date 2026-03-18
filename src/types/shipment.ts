export type ShipmentStatus =
  | "preparing"
  | "in_transit"
  | "delivered"
  | "completed";

export type SortOrder = "ASC" | "DESC";

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ShipmentListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  status?: ShipmentStatus;
  storeId?: string;
  search?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

export interface ShipmentSummary {
  id: string;
  orderId: string;
  storeName: string;
  status: ShipmentStatus;
  shipDate?: string | null;
  createdAt: string;
}

export interface ShipmentDetailItem {
  batchId: number;
  batchCode?: string;
  productId?: number;
  productName?: string;
  sku?: string;
  quantity: number;
  expiryDate?: string;
  imageUrl?: string;
}

export interface ShipmentDetail {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  createdAt: string;
  order: null | {
    id: string;
    storeId: string;
    storeName?: string;
  };
  items: ShipmentDetailItem[];
}
