import type { OrderStatus } from "../types/order";

/** API hợp lệ: pending, approved, rejected, cancelled, picking, delivering, completed, claimed */
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: {
    label: "Chờ duyệt",
    color: "#F57C00",
    bg: "#FFF3E0",
    icon: "clock-outline",
  },
  approved: {
    label: "Đã duyệt",
    color: "#1976D2",
    bg: "#E3F2FD",
    icon: "check-circle-outline",
  },
  rejected: {
    label: "Bị từ chối",
    color: "#C62828",
    bg: "#FFEBEE",
    icon: "close-circle-outline",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#757575",
    bg: "#F5F5F5",
    icon: "cancel",
  },
  picking: {
    label: "Đang soạn",
    color: "#00796B",
    bg: "#E0F2F1",
    icon: "package-variant",
  },
  delivering: {
    label: "Đang giao",
    color: "#7B1FA2",
    bg: "#F3E5F5",
    icon: "truck-delivery-outline",
  },
  completed: {
    label: "Hoàn thành",
    color: "#2E7D32",
    bg: "#E8F5E9",
    icon: "check-all",
  },
  claimed: {
    label: "Khiếu nại",
    color: "#E65100",
    bg: "#FFF3E0",
    icon: "alert-circle-outline",
  },
};

export const STATUS_FILTER_OPTIONS: Array<{
  value: OrderStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "delivering", label: "Đang giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "rejected", label: "Bị từ chối" },
];
