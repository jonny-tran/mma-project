import { PaginatedResponse } from "../types/picking-tasks";
import {
  GetProductBatchesParams,
  ProductBatch,
  UpdateProductBatchPayload,
} from "../types/product-batches";
import apiClient from "./client";

type UnknownRecord = Record<string, unknown>;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const mapBatch = (item: UnknownRecord): ProductBatch => {
  const id = String(item.id ?? item.batchId ?? item.batchCode ?? "");

  return {
    id,
    batchCode: typeof item.batchCode === "string" ? item.batchCode : undefined,
    productId: (item.productId as string | number | undefined) ?? undefined,
    productName:
      typeof item.productName === "string"
        ? item.productName
        : typeof item.name === "string"
          ? item.name
          : undefined,
    sku: typeof item.sku === "string" ? item.sku : undefined,
    imageUrl:
      typeof item.imageUrl === "string"
        ? item.imageUrl
        : typeof item.image === "string"
          ? item.image
          : undefined,
    currentQuantity: toOptionalNumber(item.currentQuantity),
    quantity: toOptionalNumber(item.quantity ?? item.currentQuantity),
    availableQuantity: toOptionalNumber(
      item.availableQuantity ?? item.currentQuantity,
    ),
    remainingQuantity: toOptionalNumber(
      item.remainingQuantity ?? item.currentQuantity,
    ),
    unit: typeof item.unit === "string" ? item.unit : undefined,
    status: typeof item.status === "string" ? item.status : undefined,
    manufacturedAt:
      typeof item.manufacturedAt === "string" ? item.manufacturedAt : undefined,
    productionDate:
      typeof item.productionDate === "string" ? item.productionDate : undefined,
    expiryDate:
      typeof item.expiryDate === "string" ? item.expiryDate : undefined,
    warehouseName:
      typeof item.warehouseName === "string" ? item.warehouseName : undefined,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
  };
};

const normalizeBatchDetailResponse = (raw: unknown): ProductBatch => {
  if (raw && typeof raw === "object") {
    const payload = raw as UnknownRecord;

    if (
      typeof payload.id !== "undefined" ||
      typeof payload.batchCode !== "undefined"
    ) {
      return mapBatch(payload);
    }

    if (payload.item && typeof payload.item === "object") {
      return mapBatch(payload.item as UnknownRecord);
    }

    if (payload.data && typeof payload.data === "object") {
      return mapBatch(payload.data as UnknownRecord);
    }
  }

  return {
    id: "",
  };
};

const normalizeBatchesResponse = (
  raw: unknown,
): PaginatedResponse<ProductBatch> => {
  const payload = (raw && typeof raw === "object" ? raw : {}) as UnknownRecord;

  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(raw)
        ? raw
        : [];

  const items = rawItems
    .filter(
      (item): item is UnknownRecord =>
        Boolean(item) && typeof item === "object",
    )
    .map(mapBatch)
    .filter((item) => item.id.length > 0);

  const rawMeta =
    payload.meta && typeof payload.meta === "object"
      ? (payload.meta as UnknownRecord)
      : payload.pagination && typeof payload.pagination === "object"
        ? (payload.pagination as UnknownRecord)
        : {};

  const itemCount = toNumber(rawMeta.itemCount, items.length);
  const totalItems = toNumber(rawMeta.totalItems, itemCount);
  const itemsPerPage = toNumber(
    rawMeta.itemsPerPage,
    itemCount || items.length || 1,
  );
  const currentPage = toNumber(rawMeta.currentPage, 1);
  const totalPages = toNumber(
    rawMeta.totalPages,
    itemsPerPage > 0 ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : 1,
  );

  return {
    items,
    meta: {
      totalItems,
      itemCount,
      itemsPerPage,
      totalPages,
      currentPage,
    },
  };
};

export const productBatchesApi = {
  /**
   * Lấy danh sách lô hàng nguyên liệu
   * GET /wdp301-api/v1/products/batches
   */
  getProductBatches: async (
    params?: GetProductBatchesParams,
  ): Promise<PaginatedResponse<ProductBatch>> => {
    const response = await apiClient.get<unknown, unknown>(
      "/products/batches",
      {
        params,
      },
    );

    return normalizeBatchesResponse(response);
  },

  /**
   * Lấy chi tiết 1 lô hàng
   * GET /wdp301-api/v1/products/batches/{id}
   */
  getProductBatchById: async (id: string): Promise<ProductBatch> => {
    const response = await apiClient.get<unknown, unknown>(
      `/products/batches/${id}`,
    );

    return normalizeBatchDetailResponse(response);
  },

  /**
   * Cập nhật lô hàng
   * PATCH /wdp301-api/v1/products/batches/{id}
   */
  updateProductBatch: async (
    id: string,
    payload: UpdateProductBatchPayload,
  ): Promise<ProductBatch> => {
    const response = await apiClient.patch<unknown, unknown>(
      `/products/batches/${id}`,
      payload,
    );

    return normalizeBatchDetailResponse(response);
  },
};
