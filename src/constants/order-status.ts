import type { OrderStatus } from "../types/order";

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: string }
> = {
  pending: { label: "Chờ duyệt", color: "#F57C00", icon: "clock-outline" },
  approved: { label: "Đã duyệt", color: "#1976D2", icon: "check-circle-outline" },
  shipping: { label: "Đang giao", color: "#7B1FA2", icon: "truck-delivery-outline" },
  picking: { label: "Đang soạn", color: "#00796B", icon: "package-variant" },
  delivering: { label: "Đang vận chuyển", color: "#7B1FA2", icon: "truck-delivery-outline" },
  completed: { label: "Hoàn thành", color: "#2E7D32", icon: "check-all" },
  cancelled: { label: "Đã hủy", color: "#C62828", icon: "close-circle-outline" },
  rejected: { label: "Bị từ chối", color: "#D32F2F", icon: "cancel" },
  claimed: { label: "Khiếu nại", color: "#E65100", icon: "alert-circle-outline" },
};

export const STATUS_FILTER_OPTIONS: Array<{
  value: OrderStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];
