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
    icon: "help-circle-outline",
  };

  return (
    <Chip
      icon={config.icon}
      mode="outlined"
      compact
      textStyle={{ color: config.color, fontSize: 12 }}
      style={{ borderColor: config.color, alignSelf: "flex-start" }}
    >
      {config.label}
    </Chip>
  );
}

export const OrderStatusBadge = memo(OrderStatusBadgeInner);
