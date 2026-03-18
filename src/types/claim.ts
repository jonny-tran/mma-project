export type ClaimStatus = "pending" | "approved" | "rejected";

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

export interface ClaimListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  status?: ClaimStatus;
  search?: string;
  storeId?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

export interface ClaimSummary {
  id: string;
  shipmentId: string;
  status: ClaimStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface ClaimDetailItem {
  productName?: string;
  sku?: string;
  quantityMissing: number;
  quantityDamaged: number;
  reason?: string;
  imageUrl?: string;
}

export interface ClaimDetail {
  id: string;
  shipmentId: string;
  status: ClaimStatus;
  createdAt: string;
  resolvedAt?: string | null;
  items: ClaimDetailItem[];
}

export interface ResolveClaimPayload {
  status: "approved" | "rejected";
  resolutionNote?: string;
}
