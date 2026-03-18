import React, { memo } from "react";
import { Chip } from "react-native-paper";
import { ORDER_STATUS_CONFIG } from "@/src/constants/order-status";
import type { OrderStatus } from "@/src/types/order";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

function OrderStatusBadgeInner({ status }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status] ?? {
    label: status,
    color: "#757575",
    bg: "#F5F5F5",
    icon: "help-circle-outline",
  };

  return (
    <Chip
      mode="flat"
      icon={config.icon}
      compact
      textStyle={{ color: config.color, fontSize: 11, fontWeight: "700" }}
      style={{ backgroundColor: config.bg, alignSelf: "flex-start" }}
    >
      {config.label}
    </Chip>
  );
}

export const OrderStatusBadge = memo(OrderStatusBadgeInner);
