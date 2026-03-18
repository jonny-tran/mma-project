export interface SuggestedBatch {
  id?: string | number;
  batchId?: string | number;
  batchCode: string;
  qtyToPick: number;
  expiry: string;
}

export interface ScanCheckBatchInfo {
  productName?: string;
  batchId?: string | number;
  batchCode?: string;
  expiryDate?: string;
  quantityPhysical?: number;
  status?: string;
}

export interface PickingTaskItem {
  id?: string;
  productId?: string | number;
  productName?: string;
  name?: string;
  quantity?: number;
  requiredQty?: number;
  pickedQuantity?: number;
  unit?: string;
  suggestedBatches?: SuggestedBatch[];
}

export interface PickingTask {
  id: string;
  orderId?: string;
  shipmentId?: string;
  franchiseId?: string;
  franchiseName?: string;
  storeName?: string;
  status: string;
  notes?: string;
  deliveryDate?: string;
  itemCount?: string | number;
  createdAt: string;
  updatedAt?: string;
  items?: PickingTaskItem[]; // the array of items to pick
  pickingItems?: PickingTaskItem[];
}

export interface PickingTaskDetail {
  orderId?: string;
  shipmentId?: string;
  items?: PickingTaskItem[];
}

export interface FinalizeBulkPickedItem {
  batchId: number;
  quantity: number;
}

export interface FinalizeBulkOrder {
  orderId: string;
  pickedItems: FinalizeBulkPickedItem[];
}

export interface FinalizeBulkPayload {
  orders: FinalizeBulkOrder[];
}

export interface GetPickingTasksParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

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
