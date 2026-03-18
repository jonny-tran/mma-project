import {
  FinalizeBulkPayload,
  GetPickingTasksParams,
  PaginatedResponse,
  PickingTask,
  PickingTaskDetail,
  PickingTaskItem,
  ScanCheckBatchInfo,
} from "../types/picking-tasks";
import apiClient from "./client";

type UnknownRecord = Record<string, unknown>;

const normalizePickingTaskItems = (value: unknown): PickingTaskItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is PickingTaskItem =>
      Boolean(item) && typeof item === "object",
  );
};

const normalizePickingTaskDetail = (raw: unknown): PickingTaskDetail => {
  const payload = (raw && typeof raw === "object" ? raw : {}) as UnknownRecord;

  const orderId =
    typeof payload.orderId === "string"
      ? payload.orderId
      : typeof payload.id === "string"
        ? payload.id
        : undefined;

  const shipmentId =
    typeof payload.shipmentId === "string" ? payload.shipmentId : undefined;
  const items = normalizePickingTaskItems(payload.items);

  return {
    orderId,
    shipmentId,
    items,
  };
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

const normalizeScanCheck = (raw: unknown): ScanCheckBatchInfo => {
  const payload = (raw && typeof raw === "object" ? raw : {}) as UnknownRecord;

  return {
    productName:
      typeof payload.productName === "string" ? payload.productName : undefined,
    batchId:
      typeof payload.batchId === "string" || typeof payload.batchId === "number"
        ? payload.batchId
        : undefined,
    batchCode:
      typeof payload.batchCode === "string" ? payload.batchCode : undefined,
    expiryDate:
      typeof payload.expiryDate === "string" ? payload.expiryDate : undefined,
    quantityPhysical: toOptionalNumber(payload.quantityPhysical),
    status: typeof payload.status === "string" ? payload.status : undefined,
  };
};

export const pickingTasksApi = {
  /**
   * Lấy danh sách phiếu nhặt hàng
   * GET /wdp301-api/v1/warehouse/picking-tasks
   */
  getPickingTasks: async (
    params?: GetPickingTasksParams,
  ): Promise<PaginatedResponse<PickingTask>> => {
    const response = await apiClient.get<
      unknown,
      PaginatedResponse<PickingTask>
    >("/warehouse/picking-tasks", {
      params,
    });
    return response;
  },

  /**
   * Lấy chi tiết phiếu nhặt hàng
   * GET /wdp301-api/v1/warehouse/picking-tasks/{id}
   */
  getPickingTaskById: async (id: string): Promise<PickingTask> => {
    const response = await apiClient.get<unknown, PickingTask>(
      `/warehouse/picking-tasks/${id}`,
    );
    return response;
  },

  /**
   * Lấy chi tiết danh sách mặt hàng của đơn soạn
   * GET /wdp301-api/v1/warehouse/picking-tasks/{id}
   */
  getPickingTaskDetail: async (id: string): Promise<PickingTaskDetail> => {
    const response = await apiClient.get<unknown, unknown>(
      `/warehouse/picking-tasks/${id}`,
    );
    return normalizePickingTaskDetail(response);
  },

  /**
   * Quét nhanh thông tin lô hàng theo mã lô
   * GET /wdp301-api/v1/warehouse/scan-check?batchCode=...
   */
  getScanCheckByBatchCode: async (
    batchCode: string,
  ): Promise<ScanCheckBatchInfo> => {
    const response = await apiClient.get<unknown, unknown>(
      "/warehouse/scan-check",
      {
        params: { batchCode },
      },
    );

    return normalizeScanCheck(response);
  },

  /**
   * Duyệt và xuất kho đồng loạt
   * PATCH /wdp301-api/v1/warehouse/shipments/finalize-bulk
   */
  finalizeShipmentsBulk: async (
    payload: FinalizeBulkPayload,
  ): Promise<void> => {
    await apiClient.patch("/warehouse/shipments/finalize-bulk", payload);
  },

  /**
   * Đặt lại (reset) phiếu nhặt hàng
   * PATCH /wdp301-api/v1/warehouse/picking-tasks/{orderId}/reset
   */
  resetPickingTask: async (orderId: string): Promise<void> => {
    await apiClient.patch(`/warehouse/picking-tasks/${orderId}/reset`);
  },
};
