export interface ProductBatch {
  id: string;
  batchCode?: string;
  productId?: string | number;
  productName?: string;
  sku?: string;
  imageUrl?: string;
  currentQuantity?: number;
  quantity?: number;
  availableQuantity?: number;
  remainingQuantity?: number;
  unit?: string;
  status?: string;
  manufacturedAt?: string;
  productionDate?: string;
  expiryDate?: string;
  warehouseName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetProductBatchesParams {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string | number;
  status?: string;
}

export interface UpdateProductBatchPayload {
  initialQuantity?: number;
  imageUrl?: string | null;
  status?: string;
}
